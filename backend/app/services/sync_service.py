import asyncio
from datetime import datetime, timedelta
from typing import Optional, List

from app.database import get_database
from app.services.youtube_service import youtube_service
from app.services.local_analysis_service import local_analysis_service


class SyncService:
    """Service for synchronizing YouTube data."""
    
    # Number of videos to process in parallel
    PARALLEL_BATCH_SIZE = 50
    
    def __init__(self):
        # In-memory listeners for SSE: channel_id -> list of asyncio.Queue
        self.listeners: dict[str, list[asyncio.Queue]] = {}

    async def add_listener(self, channel_id: str) -> asyncio.Queue:
        if channel_id not in self.listeners:
            self.listeners[channel_id] = []
        q = asyncio.Queue()
        self.listeners[channel_id].append(q)
        return q

    async def remove_listener(self, channel_id: str, q: asyncio.Queue):
        if channel_id in self.listeners:
            if q in self.listeners[channel_id]:
                self.listeners[channel_id].remove(q)
            if not self.listeners[channel_id]:
                del self.listeners[channel_id]

    async def _log_event(self, channel_id: str, user_id: str, message: str, level: str = "info"):
        """Log a sync event to the database and broadcast to listeners."""
        # 1. Save to DB (Persistence)
        try:
            db = get_database()
            log_entry = {
                "channel_id": channel_id,
                "user_id": user_id,
                "message": message,
                "level": level,
                "created_at": datetime.utcnow()
            }
            await db.channel_logs.insert_one(log_entry)
            
            # 2. Broadcast to SSE users (Real-time)
            if channel_id in self.listeners:
                json_data = {
                    "message": message,
                    "level": level,
                    "created_at": log_entry["created_at"].isoformat()
                }
                import json
                sse_message = f"data: {json.dumps(json_data)}\n\n"
                
                for q in self.listeners[channel_id]:
                    await q.put(sse_message)

        except Exception as e:
            print(f"Failed to log event: {e}")

    async def sync_channel(
        self,
        channel_id: str,
        user_id: str,  # Added user_id parameter
        days_back: int = 30,
        max_videos: int = 50
    ) -> dict:
        """
        Sync comments for a channel with parallel video processing.
        """
        db = get_database()
        
        # Update sync status
        await db.channels.update_one(
            {"channel_id": channel_id, "user_id": user_id},
            {"$set": {"sync_status": "syncing", "last_synced": datetime.utcnow()}}
        )
        
        # NOTE: Logs are cleared in the API route now to prevent race conditions
        
        await self._log_event(channel_id, user_id, "🧠 core: Initializing sync protocol. establishing connection...", "info")
        
        try:
            # Get videos from the channel
            await self._log_event(channel_id, user_id, f"🔍 perception: Scanning for recent uploads (Reach: {days_back} days)...", "info")
            published_after = datetime.utcnow() - timedelta(days=days_back)
            videos = youtube_service.get_channel_videos(
                channel_id,
                max_results=max_videos,
                published_after=published_after
            )
            
            if not videos:
                 await self._log_event(channel_id, user_id, "⚠️ observation: No recent content detected within parameters.", "warning")
            else:
                 await self._log_event(channel_id, user_id, f"👁️ perception: Identified {len(videos)} targets. Formulating analysis strategy...", "info")
            
            total_comments = 0
            total_videos = 0
            
            print(f"🚀 Starting parallel sync for {len(videos)} videos (batch size: {self.PARALLEL_BATCH_SIZE})")
            
            # Process videos in parallel batches
            for i in range(0, len(videos), self.PARALLEL_BATCH_SIZE):
                batch = videos[i:i + self.PARALLEL_BATCH_SIZE]
                batch_num = (i // self.PARALLEL_BATCH_SIZE) + 1
                total_batches = (len(videos) + self.PARALLEL_BATCH_SIZE - 1) // self.PARALLEL_BATCH_SIZE
                
                msg = f"⚡ processing_unit_{batch_num}: Engaging neural sentiment analysis for {len(batch)} videos..."
                print(msg)
                await self._log_event(channel_id, user_id, msg, "info")
                
                # Process batch in parallel - pass user_id
                results = await asyncio.gather(
                    *[self._process_single_video(video, channel_id, user_id) for video in batch],
                    return_exceptions=True
                )
                
                # Collect results
                batch_comments = 0
                for result in results:
                    if isinstance(result, Exception):
                        print(f"   ❌ Error processing video: {result}")
                        await self._log_event(channel_id, user_id, f"❌ error: Analysis failed for video segment: {str(result)}", "error")
                    elif result:
                        comments = result.get('comments', 0)
                        batch_comments += comments
                        total_comments += comments
                        total_videos += 1
                
                await self._log_event(channel_id, user_id, f"✅ memory: Integrated {batch_comments} new data points from batch {batch_num}.", "success")
                print(f"   ✅ Batch complete! Total: {total_videos} videos, {total_comments} comments")
            
            # Update channel stats
            await db.channels.update_one(
                {"channel_id": channel_id, "user_id": user_id},
                {
                    "$set": {
                        "sync_status": "completed",
                        "total_comments": total_comments,
                        "total_videos_analyzed": total_videos,
                        "last_synced": datetime.utcnow()
                    }
                }
            )
            
            success_msg = f"🎉 completion: Sync successful. Knowledge base expanded by {total_videos} videos & {total_comments} comments."
            print(f"\n{success_msg}")
            await self._log_event(channel_id, user_id, success_msg, "success")
            
            return {
                "status": "completed",
                "total_videos": total_videos,
                "total_comments": total_comments
            }
            
        except Exception as e:
            print(f"Sync error: {e}")
            await self._log_event(channel_id, user_id, f"Sync failed: {str(e)}", "error")
            await db.channels.update_one(
                {"channel_id": channel_id, "user_id": user_id},
                {"$set": {"sync_status": "error"}}
            )
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def _process_single_video(self, video: dict, channel_id: str, user_id: str) -> dict:
        """Process a single video - fetch comments and analyze."""
        db = get_database()
        
        video_title = video['title'][:40]
        # await self._log_event(channel_id, user_id, f"Analyzing video: {video_title}...", "info") # Too noisy?
        print(f"   📹 [{video_title}...] Starting...")
        
        # Save/update video with user_id
        video['user_id'] = user_id
        video['last_synced'] = datetime.utcnow()
        await db.videos.update_one(
            {"video_id": video['video_id'], "user_id": user_id},
            {"$set": video},
            upsert=True
        )
        
        # Get comments for video
        comments = youtube_service.get_video_comments(
            video['video_id'],
            channel_id
        )
        
        if not comments:
            print(f"   📹 [{video_title}...] No comments")
            return {"comments": 0}
        
        print(f"   📹 [{video_title}...] Found {len(comments)} comments")
        
        # Use LOCAL analysis instead of Gemini API - INSTANT and FREE!
        analysis_results = await local_analysis_service.analyze_batch(comments)
        
        # Create lookup map
        analysis_map = {r['comment_id']: r for r in analysis_results}
        
        # Save comments in batch with user_id
        comments_to_save = []
        for comment in comments:
            analysis = analysis_map.get(comment['comment_id'], {})
            
            comment['user_id'] = user_id  # Add user_id
            comment['sentiment'] = analysis.get('sentiment', 'neutral')
            comment['sentiment_score'] = analysis.get('sentiment_score', 0.0)
            comment['tags'] = analysis.get('tags', [])
            comment['is_bookmarked'] = False
            comment['created_at'] = datetime.utcnow()
            comments_to_save.append(comment)
        
        # Batch upsert comments for efficiency
        if comments_to_save:
            from pymongo import UpdateOne
            bulk_ops = [
                UpdateOne(
                    {"comment_id": c['comment_id'], "user_id": user_id},
                    {"$set": c},
                    upsert=True
                )
                for c in comments_to_save
            ]
            await db.comments.bulk_write(bulk_ops)
            
            # Update commenters (batch) with user_id
            for comment in comments_to_save:
                await self._update_commenter(comment, user_id)
        
        # Update video analyzed count
        await db.videos.update_one(
            {"video_id": video['video_id'], "user_id": user_id},
            {"$set": {"analyzed_comment_count": len(comments)}}
        )
        
        print(f"   📹 [{video_title}...] ✅ Saved {len(comments)} comments")
        
        return {"comments": len(comments)}
    
    async def _update_commenter(self, comment: dict, user_id: str):
        """Update commenter statistics."""
        db = get_database()
        
        author_channel_id = comment.get('author_channel_id')
        if not author_channel_id:
            return
        
        # Atomic upsert to handle race conditions in parallel processing
        update_data = {
            "$inc": {
                "comment_count": 1,
                "total_likes_received": comment.get('like_count', 0)
            },
            "$set": {
                "last_comment_at": comment['published_at'],
                "updated_at": datetime.utcnow(),
                "author_name": comment['author_name'], # Update name in case it changed
                "author_profile_image": comment.get('author_profile_image')
            },
            "$addToSet": {
                "videos_commented_on": comment['video_id']
            },
            "$setOnInsert": {
                "first_comment_at": comment['published_at'],
                "streak_days": 0,
                "is_repeat": False,
                "created_at": datetime.utcnow()
            }
        }
        
        try:
            await db.commenters.update_one(
                {
                    "author_channel_id": author_channel_id,
                    "channel_id": comment['channel_id'],
                    "user_id": user_id
                },
                update_data,
                upsert=True
            )
        except Exception as e:
            print(f"Error updating commenter: {e}")


# Singleton instance
sync_service = SyncService()
