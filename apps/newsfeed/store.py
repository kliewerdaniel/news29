import chromadb
import uuid
import os

def get_chroma_client():
    chroma_host = os.getenv("CHROMA_HOST", "http://chroma:8000")
    return chromadb.HttpClient(host=chroma_host.split("://")[1].split(":")[0], port=8000)

client = get_chroma_client()

def store_segment(persona_id, title, summary, comment, vector):
    """
    Store a news segment with its metadata and embedding in ChromaDB.
    
    Args:
        persona_id (str): The ID of the persona providing commentary
        title (str): The title of the news segment
        summary (str): The summary of the news content
        comment (str): The persona's commentary on the segment
        vector (list): The embedding vector for the segment
    
    Returns:
        str: The UUID of the stored document
    """
    collection = client.get_or_create_collection(name="news_segments")
    doc_id = str(uuid.uuid4())

    metadata = {
        "persona": persona_id,
        "title": title,
        "summary": summary,
        "comment": comment,
    }

    collection.add(
        documents=[summary],
        ids=[doc_id],
        metadatas=[metadata],
        embeddings=[vector]
    )
    return doc_id

def search_segments(query_text, persona=None, limit=5):
    """
    Search for news segments semantically similar to the query.
    
    Args:
        query_text (str): The search query
        persona (str, optional): Filter by specific persona
        limit (int): Maximum number of results to return
        
    Returns:
        dict: Search results from ChromaDB
    """
    collection = client.get_collection("news_segments")
    where_filter = {"persona": persona} if persona else None
    
    results = collection.query(
        query_texts=[query_text],
        n_results=limit,
        where=where_filter
    )
    return results
