import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run_test():
    print("Connecting to mongodb://127.0.0.1:27017...", flush=True)
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    try:
        print("Pinging...", flush=True)
        await asyncio.wait_for(client.admin.command('ping'), timeout=5.0)
        print("Success! MongoDB is responsive.", flush=True)
    except Exception as e:
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    asyncio.run(run_test())
