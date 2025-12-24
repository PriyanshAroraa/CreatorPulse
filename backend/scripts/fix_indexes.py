import asyncio
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import connect_to_mongo, get_database, close_mongo_connection
from app.config import get_settings

async def fix_indexes():
    print("🔌 Connecting to database...")
    await connect_to_mongo()
    db = get_database()
    
    print("🔍 Checking existing indexes on 'channels' collection...")
    async for index in db.channels.list_indexes():
        print(f"   - {index['name']}: {index['key']}")
        
        # Drop the old unique index on channel_id if it exists
        if index['name'] == 'channel_id_1': 
            print("   ⚠️ Found problematic index 'channel_id_1'. Dropping it...")
            await db.channels.drop_index("channel_id_1")
            print("   ✅ Dropped 'channel_id_1'")

    print("🛠️ Creating new compound unique index on (channel_id, user_id)...")
    try:
        await db.channels.create_index(
            [("channel_id", 1), ("user_id", 1)],
            unique=True
        )
        print("   ✅ Created new compound index")
    except Exception as e:
        print(f"   ❌ Error creating index: {e}")

    print("🔍 Verifying indexes...")
    async for index in db.channels.list_indexes():
        print(f"   - {index['name']}: {index['key']}")

    await close_mongo_connection()
    print("✨ Migration complete!")

if __name__ == "__main__":
    asyncio.run(fix_indexes())
