import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis

sys.path.append(os.getcwd())

async def test():
    print("--- Starting All Connections Test ---", flush=True)
    from app.core.config import settings
    
    # 1. Mongo
    print(f"Testing Mongo: {settings.MONGODB_URI}...", flush=True)
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        await asyncio.wait_for(client.admin.command('ping'), timeout=5.0)
        print("Mongo: OK", flush=True)
    except Exception as e:
        print(f"Mongo: FAILED - {e}", flush=True)

    # 2. Redis
    print(f"Testing Redis: {settings.REDIS_URL}...", flush=True)
    try:
        r = redis.from_url(settings.REDIS_URL)
        await asyncio.wait_for(r.ping(), timeout=5.0)
        print("Redis: OK", flush=True)
    except Exception as e:
        print(f"Redis: FAILED - {e}", flush=True)

    # 3. MinIO (Optional)
    print("--- Test Finished ---", flush=True)

if __name__ == "__main__":
    asyncio.run(test())
