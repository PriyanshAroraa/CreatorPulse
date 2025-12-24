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
    # Channels collection
    # explicit migration: drop old unique index if it exists
    try:
        # Check if index exists and is unique (or just drop to be safe and recreate)
        indexes = await db.channels.index_information()
        if "channel_id_1" in indexes:
             # Dropping it allows us to recreate it as non-unique or compound below
            await db.channels.drop_index("channel_id_1")
            print("Dropped old channel_id_1 index")
    except Exception as e:
        print(f"Note: Could not drop index (might not exist): {e}")

    # Compound index for multi-tenancy: channel_id must be unique PER USER
    await db.channels.create_index(
        [("channel_id", 1), ("user_id", 1)],
        unique=True
    )
    # Simple index for lookups
    await db.channels.create_index("channel_id")
    
    # Videos collection
    try:
        if "video_id_1" in await db.videos.index_information():
            await db.videos.drop_index("video_id_1")
            print("Dropped old video_id_1 index")
    except Exception:
        pass

    await db.videos.create_index(
        [("video_id", 1), ("user_id", 1)],
        unique=True
    )
    await db.videos.create_index("channel_id")
    
    # Comments collection
    try:
        if "comment_id_1" in await db.comments.index_information():
            await db.comments.drop_index("comment_id_1")
            print("Dropped old comment_id_1 index")
    except Exception:
        pass
        
    await db.comments.create_index(
        [("comment_id", 1), ("user_id", 1)],
        unique=True
    )
    await db.comments.create_index("video_id")
    await db.comments.create_index("channel_id")
    await db.comments.create_index("sentiment")
    await db.comments.create_index("tags")
    await db.comments.create_index("is_bookmarked")
    await db.comments.create_index("published_at")
    
    # Commenters collection
    try:
        # Default name for the compound index on author_channel_id and channel_id
        index_name = "author_channel_id_1_channel_id_1"
        if index_name in await db.commenters.index_information():
            await db.commenters.drop_index(index_name)
            print(f"Dropped old {index_name} index")
    except Exception:
        pass

    await db.commenters.create_index(
        [("author_channel_id", 1), ("channel_id", 1), ("user_id", 1)],
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
    
    # Chat history collection
    await db.chat_history.create_index("channel_id")
    await db.chat_history.create_index("created_at")
    
    # Channel Logs collection
    await db.channel_logs.create_index(
        [("channel_id", 1), ("user_id", 1), ("created_at", -1)]
    )
    # TTL Index: expire logs after 24 hours to keep DB clean
    await db.channel_logs.create_index("created_at", expireAfterSeconds=86400)
    
    print("Database indexes created")


def get_database() -> Database:
    """Get database instance."""
    return db
