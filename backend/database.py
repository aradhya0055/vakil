import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
database_name = os.getenv("MONGO_DB", "vakil")

client = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
database = client[database_name]
cases_collection = database["cases"]
cases_collection.create_index("case_number", unique=True)

def check_database_connection():
    client.admin.command("ping")
    return True