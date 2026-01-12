import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(os.getcwd())

async def test():
    print("START SIMPLE MOTOR", flush=True)
    from app.core.config import settings
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    try:
        print("PINGING", flush=True)
        await client.admin.command('ping')
        print("PONG", flush=True)
    except Exception as e:
        print(f"ERR: {e}", flush=True)

if __name__ == "__main__":
    asyncio.run(test())
