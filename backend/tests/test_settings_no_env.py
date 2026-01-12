from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None) # NO ENV FILE
    SECRET_KEY: str = "A" * 32
    JWT_SECRET_KEY: str = "B" * 32
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

print("INSTANTIATING...")
s = Settings()
print("SUCCESS")
