import time
print("START")
start = time.time()
from app.core.config import settings
print(f"DONE in {time.time()-start:.2f}s")
print(f"APP_NAME: {settings.APP_NAME}")
