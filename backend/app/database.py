from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from app.config import get_settings

settings = get_settings()

# MongoDB client
client: AsyncIOMotorClient = None
db: Database = None


async def connect_to_mongo():
    """Connect to MongoDB on startup."""
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    
    # Create indexes
    await create_indexes()
    
    print(f"Connected to MongoDB: {settings.mongodb_db_name}")


async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


async def create_indexes():
    """Create database indexes for optimal performance."""
    # Channels collection
    await db.channels.create_index("channel_id", unique=True)
    
    # Videos collection
    await db.videos.create_index("video_id", unique=True)
    await db.videos.create_index("channel_id")
    
    # Comments collection
    await db.comments.create_index("comment_id", unique=True)
    await db.comments.create_index("video_id")
    await db.comments.create_index("channel_id")
    await db.comments.create_index("sentiment")
    await db.comments.create_index("tags")
    await db.comments.create_index("is_bookmarked")
    await db.comments.create_index("published_at")
    
    # Commenters collection
    await db.commenters.create_index(
        [("author_channel_id", 1), ("channel_id", 1)],
        unique=True
    )
    await db.commenters.create_index("channel_id")
    await db.commenters.create_index("comment_count")
    
    # Tags collection
    await db.tags.create_index("name", unique=True)
    
    # Reports collection
    await db.reports.create_index("channel_id")
    await db.reports.create_index("created_at")
    
    # Chat history collection
    await db.chat_history.create_index("channel_id")
    await db.chat_history.create_index("created_at")
    
    print("Database indexes created")


def get_database() -> Database:
    """Get database instance."""
    return db
