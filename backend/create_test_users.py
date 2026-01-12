
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Configuration
# NO AUTH version - matched our successful probe
MONGO_URL = os.getenv("MONGODB_URI", "mongodb://localhost:27017/aicsl")
DB_NAME = os.getenv("MONGODB_DB_NAME", "aicsl")

# Must match backend/app/services/auth_service.py
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def create_users():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("Connected successfully!")
        
        # Define users: student1-5 plus teacher and admin
        users = []
        
        # Add students student1 to student5
        for i in range(1, 6):
            users.append({
                "username": f"student{i}",
                "email": f"student{i}@example.com",
                "password": "password123",
                "full_name": f"Test Student {i}",
                "role": "student",
                "is_active": True
            })
            
        # Add teacher and admin
        users.extend([
            {
                "username": "teacher",
                "email": "teacher@example.com", 
                "password": "password123",
                "full_name": "Test Teacher",
                "role": "teacher",
                "is_active": True
            },
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "password123",
                "full_name": "System Admin",
                "role": "admin",
                "is_active": True
            }
        ])

        for user_data in users:
            # We look up by username as the primary key for these test accounts
            existing_user = await db.users.find_one({"username": user_data["username"]})
            
            # Prepare data (Beanie/FastAPI requires password_hash)
            password = user_data.pop("password")
            user_data["password_hash"] = get_password_hash(password)
            
            if existing_user:
                print(f"User {user_data['username']} already exists. Updating...")
                await db.users.update_one(
                    {"username": user_data["username"]},
                    {"$set": user_data}
                )
            else:
                print(f"Creating user {user_data['username']}...")
                await db.users.insert_one(user_data)
        
        print("\nAll test users created/updated successfully!")
        print("Standard Password: password123")
        print("Accounts: student1@example.com ... student5@example.com")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_users())
