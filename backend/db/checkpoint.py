import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/mongaccentic")

_checkpointer = None

async def get_checkpointer():
    global _checkpointer
    if _checkpointer is not None:
        return _checkpointer
    try:
        from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver
        saver = AsyncMongoDBSaver.from_conn_string(MONGODB_URI)
        await saver.setup()
        _checkpointer = saver
        print("LangGraph MongoDB checkpointing enabled")
        return _checkpointer
    except Exception as e:
        print(f"Checkpointing unavailable: {e}")
        return None
