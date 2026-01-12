import asyncio
import socketio
import requests
import time
import base64
import zlib
import json

# Configuration
API_URL = "http://localhost:8000"
SOCKET_URL = "http://localhost:8000"
USER_EMAIL = "student@test.com"
USER_PASS = "student123"
ROOM_ID = "wb:test_sync_room_001"

async def test_sync_flow():
    print("=== Starting Sync Flow Test ===")
    
    # 1. Login to get token
    print("[1] Logging in...")
    try:
        response = requests.post(f"{API_URL}/api/v1/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASS
        })
        response.raise_for_status()
        token = response.json()["access_token"]
        print("    Line: Logged in successfully.")
    except Exception as e:
        print(f"    Failed to login: {e}")
        return

    # 2. Setup Socket.IO Client 1
    sio1 = socketio.AsyncClient(reconnection=False)
    
    @sio1.event
    async def connect():
        print("    [C1] Connected")
        
    @sio1.event
    async def disconnect():
        print("    [C1] Disconnected")
        
    @sio1.on('operation')
    async def on_operation(data):
        print(f"    [C1] Received operation: {data.get('type')}")

    # 3. Setup Socket.IO Client 2
    sio2 = socketio.AsyncClient(reconnection=False)
    
    @sio2.event
    async def connect():
        print("    [C2] Connected")
        
    @sio2.on('operation')
    async def on_operation(data):
        print(f"    [C2] Received operation: {data.get('type')}")

    # 4. Connect Clients
    print("[2] Connecting clients...")
    await sio1.connect(SOCKET_URL, auth={"token": token}, transports=['websocket'])
    await sio2.connect(SOCKET_URL, auth={"token": token}, transports=['websocket'])
    
    # 5. Join Room
    print(f"[3] Joining room {ROOM_ID}...")
    await sio1.emit('join_room', {'room_id': ROOM_ID, 'module': 'whiteboard'})
    await sio2.emit('join_room', {'room_id': ROOM_ID, 'module': 'whiteboard'})
    
    await asyncio.sleep(1)
    
    # 6. Send Operation from C1
    print("[4] Sending operation from C1...")
    # Mock Yjs update (empty update is fine for testing transport, but let's try a dummy one)
    # Mock Yjs update using y_py
    import y_py as Y
    d1 = Y.YDoc()
    t1 = d1.get_text("test")
    with d1.begin_transaction() as t:
        t1.insert(t, 0, "A" * 1000)
    dummy_update = Y.encode_state_as_update(d1)
    encoded_update = base64.b64encode(dummy_update).decode('utf-8')
    
    op_payload = {
        "id": "op_001",
        "module": "whiteboard",
        "roomId": ROOM_ID,
        "type": "update",
        "data": {
            "update": encoded_update
        },
        "timestamp": int(time.time() * 1000)
    }
    
    await sio1.emit('operation', op_payload)
    
    # 7. Wait for verification and Debounce
    print("[5] Waiting for debounce save (6s)...")
    await asyncio.sleep(6)
    
    # 8. Unload
    print("[6] Disconnecting (trigger unload)...")
    await sio1.disconnect()
    await sio2.disconnect()
    
    print("=== Test Completed ===")

    # 9. Verify MongoDB
    print("[7] Verifying Persistence in MongoDB...")
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["aicsl"]
    collection = db["whiteboard_snapshots"]
    
    real_id = ROOM_ID.split(":")[-1]
    doc = await collection.find_one({
        "resource_id": real_id,
        "snapshot_type": "whiteboard"
    }, sort=[("snapshot_version", -1)])
    
    if doc:
        print(f"    [PASS] Snapshot found: Version {doc.get('snapshot_version')}")
        print(f"    [PASS] Compressed: {doc.get('compressed')}")
        print(f"    [INFO] Data size: {len(doc.get('data'))} bytes")
    else:
        print(f"    [FAIL] No snapshot found for {real_id}")

if __name__ == "__main__":
    asyncio.run(test_sync_flow())
