import asyncio
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_database
from app.services.youtube_service import youtube_service
from app.services.local_analysis_service import local_analysis_service


class SyncService:
    """Service for synchronizing YouTube data."""
    
    async def sync_channel(
        self,
        channel_id: str,
        days_back: int = 30,
        max_videos: int = 50
    ) -> dict:
        """
        Sync comments for a channel.
        
        Args:
            channel_id: YouTube channel ID
            days_back: Number of days to look back for videos
            max_videos: Maximum number of videos to process
        
        Returns:
            Sync status and statistics
        """
        db = get_database()
        
        # Update sync status
        await db.channels.update_one(
            {"channel_id": channel_id},
            {"$set": {"sync_status": "syncing", "last_synced": datetime.utcnow()}}
        )
        
        try:
            # Get videos from the channel
            published_after = datetime.utcnow() - timedelta(days=days_back)
            videos = youtube_service.get_channel_videos(
                channel_id,
                max_results=max_videos,
                published_after=published_after
            )
            
            total_comments = 0
            total_videos = 0
            
            for video in videos:
                print(f"📹 Processing video: {video['title'][:50]}...")
                
                # Save/update video
                video['last_synced'] = datetime.utcnow()
                await db.videos.update_one(
                    {"video_id": video['video_id']},
                    {"$set": video},
                    upsert=True
                )
                
                # Get comments for video
                comments = youtube_service.get_video_comments(
                    video['video_id'],
                    channel_id
                )
                
                if comments:
                    print(f"   💬 Found {len(comments)} comments, analyzing locally...")
                    
                    # Use LOCAL analysis instead of Gemini API - INSTANT and FREE!
                    analysis_results = local_analysis_service.analyze_batch(comments)
                    
                    # Create lookup map
                    analysis_map = {r['comment_id']: r for r in analysis_results}
                    
                    # Save comments
                    for comment in comments:
                        analysis = analysis_map.get(comment['comment_id'], {})
                        
                        comment['sentiment'] = analysis.get('sentiment', 'neutral')
                        comment['sentiment_score'] = analysis.get('sentiment_score', 0.0)
                        comment['tags'] = analysis.get('tags', [])
                        comment['is_bookmarked'] = False
                        comment['created_at'] = datetime.utcnow()
                        
                        await db.comments.update_one(
                            {"comment_id": comment['comment_id']},
                            {"$set": comment},
                            upsert=True
                        )
                        
                        # Update commenter stats
                        await self._update_commenter(comment)
                    
                    total_comments += len(comments)
                    print(f"   ✅ Saved {len(comments)} comments (Total: {total_comments})")
                    
                    # Update video analyzed count
                    await db.videos.update_one(
                        {"video_id": video['video_id']},
                        {"$set": {"analyzed_comment_count": len(comments)}}
                    )
                
                total_videos += 1
                print(f"   📊 Completed video {total_videos}/{len(videos)}")
            
            # Update channel stats
            await db.channels.update_one(
                {"channel_id": channel_id},
                {
                    "$set": {
                        "sync_status": "completed",
                        "total_comments": total_comments,
                        "total_videos_analyzed": total_videos,
                        "last_synced": datetime.utcnow()
                    }
                }
            )
            
            return {
                "status": "completed",
                "total_videos": total_videos,
                "total_comments": total_comments
            }
            
        except Exception as e:
            print(f"Sync error: {e}")
            await db.channels.update_one(
                {"channel_id": channel_id},
                {"$set": {"sync_status": "error"}}
            )
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def _update_commenter(self, comment: dict):
        """Update commenter statistics."""
        db = get_database()
        
        author_channel_id = comment.get('author_channel_id')
        if not author_channel_id:
            return
        
        existing = await db.commenters.find_one({
            "author_channel_id": author_channel_id,
            "channel_id": comment['channel_id']
        })
        
        if existing:
            # Update existing commenter
            update_data = {
                "$inc": {
                    "comment_count": 1,
                    "total_likes_received": comment.get('like_count', 0)
                },
                "$set": {
                    "last_comment_at": comment['published_at'],
                    "updated_at": datetime.utcnow(),
                    "is_repeat": True
                },
                "$addToSet": {
                    "videos_commented_on": comment['video_id']
                }
            }
            await db.commenters.update_one(
                {"_id": existing['_id']},
                update_data
            )
        else:
            # Create new commenter
            commenter_data = {
                "author_channel_id": author_channel_id,
                "channel_id": comment['channel_id'],
                "author_name": comment['author_name'],
                "author_profile_image": comment.get('author_profile_image'),
                "comment_count": 1,
                "total_likes_received": comment.get('like_count', 0),
                "first_comment_at": comment['published_at'],
                "last_comment_at": comment['published_at'],
                "videos_commented_on": [comment['video_id']],
                "streak_days": 0,
                "is_repeat": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.commenters.insert_one(commenter_data)


# Singleton instance
sync_service = SyncService()
