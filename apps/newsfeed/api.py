from fastapi import FastAPI, BackgroundTasks
from src.news_generator import NewsGenerator  # adjust import to real path
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
