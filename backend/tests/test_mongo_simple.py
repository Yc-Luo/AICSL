import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

async def test():
    print("Loading settings...")
    from app.core.config import settings
    print(f"Connecting to {settings.MONGODB_URI}...")
    
    from app.core.db.mongodb import mongodb
    try:
        # Set a timeout for the connection
        await asyncio.wait_for(mongodb.connect(), timeout=10.0)
        print("Connected successfully!")
        await mongodb.disconnect()
    except asyncio.TimeoutError:
        print("Connection timed out after 10 seconds")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
