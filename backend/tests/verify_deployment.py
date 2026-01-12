
import asyncio
import httpx
import sys
import uuid

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_backend():
    print(f"Testing backend at {BASE_URL}...")
    
    unique_id = str(uuid.uuid4())[:8]
    email_owner = f"owner_{unique_id}@test.com"
    email_invitee = f"invitee_{unique_id}@test.com"
    email_reset = f"reset_{unique_id}@test.com"
    password = "password123"
    
    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        # 1. Register Owner
        print(f"\n[1] Registering Owner: {email_owner}")
        resp = await client.post(f"{BASE_URL}/auth/register", json={
            "username": f"owner_{unique_id}",
            "email": email_owner,
            "password": password,
            "role": "student"
        })
        if resp.status_code not in [200, 201]:
            print(f"Failed to register owner. Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            return
        owner_token = resp.json()["access_token"]
        print("Owner registered successfully.")

        # 2. Register Invitee
        print(f"\n[2] Registering Invitee: {email_invitee}")
        resp = await client.post(f"{BASE_URL}/auth/register", json={
            "username": f"invitee_{unique_id}",
            "email": email_invitee,
            "password": password,
            "role": "student"
        })
        if resp.status_code != 200:
            print(f"Failed to register invitee: {resp.text}")
            return
        # invitee_token = resp.json()["access_token"]
        print("Invitee registered successfully.")

        # 3. Create Project (as Owner)
        print("\n[3] Creating Project...")
        headers_owner = {"Authorization": f"Bearer {owner_token}"}
        resp = await client.post(f"{BASE_URL}/projects", json={
            "name": f"Project {unique_id}",
            "description": "Test Project"
        }, headers=headers_owner)
        if resp.status_code != 201:
            print(f"Failed to create project: {resp.text}")
            return
        project_id = resp.json()["id"]
        print(f"Project created: {project_id}")

        # 4. Invite Member by Email
        print(f"\n[4] Inviting {email_invitee} by Email...")
        resp = await client.post(f"{BASE_URL}/projects/{project_id}/members", json={
            "email": email_invitee,
            "role": "editor"
        }, headers=headers_owner)
        
        if resp.status_code != 201:
            print(f"Failed to invite member: {resp.text}")
            sys.exit(1)
        print("Invitation sent successfully.")

        # 5. Verify Member Added
        print("\n[5] Verifying Member in Project...")
        resp = await client.get(f"{BASE_URL}/projects/{project_id}", headers=headers_owner)
        project_data = resp.json()
        members = project_data["members"]
        # We don't have the user ID handy for invitee (we could have saved it but let's assume we just check count or role)
        # Actually to be sure, we should check if *a* member other than owner exists.
        if len(members) < 2:
            print(f"Error: Expected at least 2 members, found {len(members)}")
            sys.exit(1)
        print(f"Verified members count: {len(members)}")

        # 6. Test Password Reset Request (Logic only, check for 200)
        print(f"\n[6] Requesting Password Reset for {email_owner}...")
        resp = await client.post(f"{BASE_URL}/auth/password/reset-request", json={
            "email": email_owner
        })
        if resp.status_code != 200:
            print(f"Failed to request reset: {resp.text}")
            sys.exit(1)
        print("Reset request accepted.")

        print("\nSUCCESS: All backend integration tests passed!")

if __name__ == "__main__":
    asyncio.run(test_backend())
