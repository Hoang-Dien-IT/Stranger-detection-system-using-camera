from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from .config import get_settings
import asyncio

settings = get_settings()

class DatabaseManager:
    client: AsyncIOMotorClient = None
    database = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    """Create database connection"""
    try:
        db_manager.client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
        
        # Test connection
        await db_manager.client.admin.command('ping')
        db_manager.database = db_manager.client[settings.database_name]
        print("✅ Connected to MongoDB successfully")
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if db_manager.client:
        db_manager.client.close()
        print("📴 Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    if db_manager.database is None:
        raise Exception("Database not connected. Call connect_to_mongo() first.")
    return db_manager.database

# ✅ ADD: get_db function for FastAPI dependency injection (SQLAlchemy style)
def get_db():
    """
    Dependency function for FastAPI - returns database instance
    This mimics SQLAlchemy's session pattern but for MongoDB
    """
    return get_database()

# Event handlers for FastAPI
async def startup_db_client():
    """Startup event handler for database"""
    await connect_to_mongo()

async def shutdown_db_client():
    """Shutdown event handler for database"""
    await close_mongo_connection()