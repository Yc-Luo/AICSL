import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import time

async def check_mongo(uri):
    print(f"Testing {uri}...")
    start = time.time()
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
        await asyncio.wait_for(client.admin.command('ping'), timeout=3.0)
        print(f"SUCCESS: {uri} in {time.time()-start:.2f}s")
    except Exception as e:
        print(f"FAILED: {uri} - {type(e).__name__}: {e}")

async def main():
    # Test both localhost (can be IPv6) and 127.0.0.1 (IPv4)
    await check_mongo("mongodb://127.0.0.1:27017")
    await check_mongo("mongodb://localhost:27017")

if __name__ == "__main__":
    asyncio.run(main())
