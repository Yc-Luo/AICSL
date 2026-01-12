from pymongo import MongoClient
import sys

try:
    print("Testing connection to mongodb://localhost:27017")
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    print("Is master:", client.admin.command('ismaster'))
    print("SUCCESS")
except Exception as e:
    print("FAILED:", e)
    sys.exit(1)
