from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/test")
async def test():
    return {"status": "ok", "message": "Minimal server is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
