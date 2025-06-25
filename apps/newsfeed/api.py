from fastapi import FastAPI, BackgroundTasks, Query, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from src.news_generator import NewsGenerator  # adjust import to real path
from store import search_segments, client
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
import json
import pathlib
import datetime
import io
import asyncio
import numpy as np
from sklearn.manifold import TSNE
from scipy.stats import gaussian_kde

app = FastAPI(title="NewsFeed API")

# Initialize scheduler
scheduler = BackgroundScheduler()

def scheduled_run():
    """Run the news generator on a schedule"""
    loop = asyncio.get_event_loop()
    loop.create_task(generator.run_once())

# Schedule to run every hour
scheduler.add_job(scheduled_run, "interval", hours=1)

# Directory for storing broadcast files
BCAST_DIR = pathlib.Path("data/broadcasts")
BCAST_DIR.mkdir(parents=True, exist_ok=True)

def save_broadcast(broadcast):
    """Save broadcast data to a JSON file"""
    ts = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    fname = BCAST_DIR / f"{broadcast['broadcast_id']}_{ts}.json"
    fname.write_text(json.dumps(broadcast, indent=2))

generator = NewsGenerator()

# Start the scheduler
scheduler.start()

@app.post("/refresh")
async def refresh(feeds: list[str] | None = None):
    """
    Trigger an immediate fetch / summarise / cluster pass.
    If `feeds` is provided, override the feeds.yaml list for this run.
    Returns the new broadcast_id that the client can poll.
    """
    broadcast_id = await generator.run_once(feeds)
    broadcast = generator.load_broadcast(broadcast_id)
    save_broadcast(broadcast)
    return {"broadcast_id": broadcast_id}

@app.get("/broadcast/{broadcast_id}")
async def get_broadcast(broadcast_id: str):
    """
    Return the generated segments, summaries and TTS URLs for this broadcast.
    """
    return generator.load_broadcast(broadcast_id)

@app.get("/broadcast/{broadcast_id}/export")
def export_broadcast(broadcast_id: str, format: str = "json"):
    """Export broadcast in JSON or Markdown format"""
    broadcast = generator.load_broadcast(broadcast_id)
    
    if format == "json":
        f = io.BytesIO(json.dumps(broadcast, indent=2).encode())
        return FileResponse(
            f, 
            media_type="application/json",
            filename=f"{broadcast_id}.json"
        )
    if format == "md":
        # Convert to markdown
        md = ["# Broadcast", f"ID: **{broadcast_id}**", ""]
        for seg in broadcast["segments"]:
            md += [
                f"## {seg['title']}", 
                seg["summary"], 
                "",
                f"> {seg['comment']}", 
                ""
            ]
        return PlainTextResponse(
            "\n".join(md), 
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename={broadcast_id}.md"}
        )
    raise HTTPException(400, "format must be json or md")

@app.get("/persona/{persona_id}/timeline")
def persona_timeline(persona_id: str, n: int = 200):
    """Get timeline data for a persona's commentary"""
    coll = client.get_collection("news_segments")
    docs = coll.query(
        where={"persona": persona_id},
        n_results=n,
        include=["documents", "metadatas", "embeddings"]
    )
    
    # Flatten for convenience
    items = []
    for doc, meta, vec in zip(*docs.values()):
        items.append({
            "summary": doc,
            "title": meta["title"],
            "timestamp": meta.get("timestamp"),
            "embedding": vec
        })
    
    # Sort oldest→newest
    items.sort(key=lambda x: x["timestamp"])
    return items

@app.get("/search")
async def semantic_search(
    query: str,
    persona: Optional[str] = Query(None, description="Filter results by persona ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of results to return")
):
    """
    Search for news segments semantically similar to the query.
    Optionally filter by persona and limit the number of results.
    """
    results = search_segments(query, persona=persona, limit=limit)
    return {
        "query": query,
        "results": [
            {
                "id": id,
                "summary": doc,
                "metadata": metadata,
                "distance": float(distance)
            }
            for id, doc, metadata, distance in zip(
                results["ids"][0],
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]
    }

@app.get("/clusters/global")
def global_heatmap(n_bins: int = 20):
    """Get global cluster data for heatmap visualization"""
    # Get all embeddings from ChromaDB
    coll = client.get_collection("news_segments")
    docs = coll.query(
        n_results=1000,
        include=["embeddings"]
    )
    
    if not docs["embeddings"]:
        return {}

    # Convert embeddings to numpy array
    embeddings = np.array(docs["embeddings"])
    
    # Project to 2D using TSNE
    tsne = TSNE(n_components=2, random_state=42)
    coords = tsne.fit_transform(embeddings)
    
    # Calculate density using Gaussian KDE
    kernel = gaussian_kde(coords.T)
    
    # Create grid of points
    x_min, x_max = coords[:, 0].min(), coords[:, 0].max()
    y_min, y_max = coords[:, 1].min(), coords[:, 1].max()
    
    x = np.linspace(x_min, x_max, n_bins)
    y = np.linspace(y_min, y_max, n_bins)
    X, Y = np.meshgrid(x, y)
    
    # Calculate density at each grid point
    positions = np.vstack([X.ravel(), Y.ravel()])
    density = kernel(positions).reshape(n_bins, n_bins)
    
    # Convert to row-based format for heatmap
    result = {}
    for i in range(n_bins):
        result[f"row_{i}"] = density[i].tolist()
    
    return result
