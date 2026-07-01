import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/mongaccentic")
DB_NAME = "mongaccentic"

_async_client = None

def get_async_client():
    global _async_client
    if _async_client is None:
        _async_client = AsyncIOMotorClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=8000,
            tlsInsecure=True,
        )
    return _async_client

def get_db():
    return get_async_client()[DB_NAME]

def get_claims_col():
    return get_db()["claims"]

def get_policies_col():
    return get_db()["policies"]

def get_audit_col():
    return get_db()["audit_trail"]

def get_fraud_rings_col():
    return get_db()["fraud_rings"]

def get_agent_memory_col():
    return get_db()["agent_memory"]

def get_submissions_col():
    return get_db()["uw_submissions"]

def get_sync_db():
    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=8000,
        tlsInsecure=True,
    )
    return client[DB_NAME]

async def ping_db():
    try:
        await get_async_client().admin.command("ping")
        print("MongoDB connected successfully")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False
