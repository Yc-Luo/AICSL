import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongodb():
    print("Testing MongoDB connection to localhost:27017...")
    client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
    try:
        await client.admin.command('ping')
        print("MongoDB: OK")
    except Exception as e:
        print(f"MongoDB: Error - {e}")

async def test_redis():
    print("Testing Redis connection to localhost:6379...")
    import redis.asyncio as redis
    try:
        r = redis.from_url('redis://localhost:6379/0', socket_timeout=2)
        await r.ping()
        print("Redis: OK")
    except Exception as e:
        print(f"Redis: Error - {e}")

async def main():
    await test_mongodb()
    await test_redis()

if __name__ == "__main__":
    asyncio.run(main())
