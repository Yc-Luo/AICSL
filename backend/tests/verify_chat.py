import asyncio
import socketio
import requests
import time
import logging
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
API_URL = "http://localhost:8000"
SOCKET_URL = "http://localhost:8000"
DB_URL = "mongodb://localhost:27017"
DB_NAME = "aicsl"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# Test Data
EMAIL = "student@test.com"
PASSWORD = "student123"
ROOM_ID = "project:test_chat_room"

async def test_chat_flow():
    # 1. Login to get token
    print("\n[1] Logging in...")
    try:
        resp = requests.post(f"{API_URL}/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if resp.status_code != 200:
            logger.error(f"Login failed: {resp.text}")
            return
        token = resp.json()["access_token"]
        
        # Get User Info
        headers = {"Authorization": f"Bearer {token}"}
        resp_me = requests.get(f"{API_URL}/api/v1/auth/me", headers=headers)
        if resp_me.status_code != 200:
             logger.error(f"Get Me failed: {resp_me.text}")
             return
        user_id = resp_me.json()["id"]
        print(f"Login success. User ID: {user_id}")
    except Exception as e:
        logger.error(f"Login failed: {e}")
        return

    # 2. Connect Two Clients
    sio1 = socketio.AsyncClient()
    sio2 = socketio.AsyncClient()

    received_ops_client2 = []
    received_user_joined = []

    @sio2.on("operation")
    async def on_operation(data):
        print(f"[Client 2] Received Operation: {data['type']}")
        received_ops_client2.append(data)

    @sio2.on("user_joined")
    async def on_user_joined(data):
        print(f"[Client 2] User Joined: {data}")
        received_user_joined.append(data)

    print("\n[2] Connecting Clients...")
    await sio1.connect(SOCKET_URL, auth={"token": token}, transports=['websocket'])
    await sio2.connect(SOCKET_URL, auth={"token": token}, transports=['websocket'])

    # 3. Join Room
    print(f"\n[3] Joining Room: {ROOM_ID}")
    # SyncService uses 'roomId' in data
    await sio1.emit("join_room", {"roomId": ROOM_ID, "module": "chat"})
    await sio2.emit("join_room", {"roomId": ROOM_ID, "module": "chat"})
    
    await asyncio.sleep(1)

    # 4. Send Message (Client 1)
    print("\n[4] Sending Message (Client 1)...")
    message_content = f"Hello from Client 1 at {time.time()}"
    operation = {
        "id": "op_test_msg_1",
        "module": "chat",
        "roomId": ROOM_ID,
        "timestamp": int(time.time() * 1000),
        "clientId": user_id,
        "version": 0,
        "type": "message",
        "data": {
            "messageId": "msg_test_1",
            "content": message_content
        }
    }
    
    await sio1.emit("operation", operation)
    
    print("Waiting for broadcast...")
    await asyncio.sleep(2)

    # 5. Verify Broadcast
    print("\n[5] Verifying Broadcast...")
    success = False
    for op in received_ops_client2:
        if op.get("data", {}).get("content") == message_content:
            print(f"[PASS] Client 2 received message: {message_content}")
            success = True
            break
    
    if not success:
        print("[FAIL] Client 2 did NOT receive the message.")
    
    # Check user_joined
    if len(received_user_joined) > 0:
        print(f"[PASS] Client 2 received user_joined events.")
    else:
        print("[WARN] Client 2 did not receive user_joined (might have joined after C1 joined or simultaneous race).")

    # 6. Verify Persistence
    print("\n[6] Verifying Persistence in MongoDB...")
    db_client = AsyncIOMotorClient(DB_URL)
    db = db_client[DB_NAME]
    
    # ChatLog table stores messages
    # ChatLog extracts project_id from roomId (project:xxxx -> xxxx)
    project_id = ROOM_ID.replace("project:", "")
    
    chat_log = await db["chat_logs"].find_one({"content": message_content})
    
    if chat_log:
        print(f"[PASS] Found message within DB: {chat_log['content']}")
    else:
        print(f"[FAIL] Message not found in DB.")

    await sio1.disconnect()
    await sio2.disconnect()
    db_client.close()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(test_chat_flow())
