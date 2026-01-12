import sys
from app.main import app
import uvicorn

if __name__ == "__main__":
    print("Starting uvicorn manually...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug")
