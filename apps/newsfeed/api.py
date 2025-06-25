from fastapi import FastAPI, BackgroundTasks, Query
from src.news_generator import NewsGenerator  # adjust import to real path
from store import search_segments
from typing import Optional

app = FastAPI(title="NewsFeed API")

generator = NewsGenerator()

@app.post("/refresh")
async def refresh(feeds: list[str] | None = None):
    """
    Trigger an immediate fetch / summarise / cluster pass.
    If `feeds` is provided, override the feeds.yaml list for this run.
    Returns the new broadcast_id that the client can poll.
    """
    broadcast_id = await generator.run_once(feeds)
    return {"broadcast_id": broadcast_id}

@app.get("/broadcast/{broadcast_id}")
async def get_broadcast(broadcast_id: str):
    """
    Return the generated segments, summaries and TTS URLs for this broadcast.
    """
    return generator.load_broadcast(broadcast_id)

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
