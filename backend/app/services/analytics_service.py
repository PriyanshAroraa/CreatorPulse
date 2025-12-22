from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from app.database import get_database


class AnalyticsService:
    """Service for generating analytics and insights."""
    
    async def get_sentiment_breakdown(
        self,
        channel_id: str,
        user_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get sentiment distribution for a channel."""
        db = get_database()
        
        match_stage = {"channel_id": channel_id}
        if user_id:
            match_stage["user_id"] = user_id
        if date_from:
            match_stage["published_at"] = {"$gte": date_from}
        if date_to:
            match_stage.setdefault("published_at", {})["$lte"] = date_to
        
        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": "$sentiment",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await db.comments.aggregate(pipeline).to_list(None)
        
        breakdown = {"positive": 0, "neutral": 0, "negative": 0}
        total = 0
        
        for result in results:
            sentiment = result['_id'] or 'neutral'
            count = result['count']
            breakdown[sentiment] = count
            total += count
        
        # Calculate percentages
        percentages = {
            k: round((v / total * 100) if total > 0 else 0, 1)
            for k, v in breakdown.items()
        }
        
        return {
            "breakdown": breakdown,
            "percentages": percentages,
            "total": total
        }
    
    async def get_tag_breakdown(
        self,
        channel_id: str,
        user_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, int]:
        """Get tag distribution for a channel."""
        db = get_database()
        
        match_stage = {"channel_id": channel_id, "tags": {"$ne": []}}
        if user_id:
            match_stage["user_id"] = user_id
        if date_from:
            match_stage["published_at"] = {"$gte": date_from}
        if date_to:
            match_stage.setdefault("published_at", {})["$lte"] = date_to
        
        pipeline = [
            {"$match": match_stage},
            {"$unwind": "$tags"},
            {
                "$group": {
                    "_id": "$tags",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        results = await db.comments.aggregate(pipeline).to_list(None)
        
        return {result['_id']: result['count'] for result in results}
    
    async def get_sentiment_over_time(
        self,
        channel_id: str,
        days: int = 30,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get sentiment trends over time."""
        db = get_database()
        
        date_from = datetime.utcnow() - timedelta(days=days)
        
        match_stage = {
            "channel_id": channel_id,
            "published_at": {"$gte": date_from}
        }
        if user_id:
            match_stage["user_id"] = user_id
        
        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$published_at"}},
                        "sentiment": "$sentiment"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        
        results = await db.comments.aggregate(pipeline).to_list(None)
        
        # Organize by date
        by_date = {}
        for result in results:
            date = result['_id']['date']
            sentiment = result['_id']['sentiment'] or 'neutral'
            
            if date not in by_date:
                by_date[date] = {"date": date, "positive": 0, "neutral": 0, "negative": 0, "total": 0}
            
            by_date[date][sentiment] = result['count']
            by_date[date]['total'] += result['count']
        
        return list(by_date.values())
    
    async def get_top_videos(
        self,
        channel_id: str,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get top videos by comment count."""
        db = get_database()
        
        match_stage = {"channel_id": channel_id}
        if user_id:
            match_stage["user_id"] = user_id
        
        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": "$video_id",
                    "comment_count": {"$sum": 1},
                    "positive_count": {
                        "$sum": {"$cond": [{"$eq": ["$sentiment", "positive"]}, 1, 0]}
                    },
                    "negative_count": {
                        "$sum": {"$cond": [{"$eq": ["$sentiment", "negative"]}, 1, 0]}
                    }
                }
            },
            {"$sort": {"comment_count": -1}},
            {"$limit": limit}
        ]
        
        comment_stats = await db.comments.aggregate(pipeline).to_list(None)
        
        # Get video details
        result = []
        for stat in comment_stats:
            video_query = {"video_id": stat['_id']}
            if user_id:
                video_query["user_id"] = user_id
            video = await db.videos.find_one(video_query)
            if video:
                result.append({
                    "video_id": stat['_id'],
                    "title": video.get('title'),
                    "thumbnail_url": video.get('thumbnail_url'),
                    "published_at": video.get('published_at'),
                    "comment_count": stat['comment_count'],
                    "positive_count": stat['positive_count'],
                    "negative_count": stat['negative_count'],
                    "sentiment_ratio": round(
                        stat['positive_count'] / stat['comment_count'] * 100
                        if stat['comment_count'] > 0 else 0, 1
                    )
                })
        
        return result
    
    async def get_channel_summary(
        self, 
        channel_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get overall channel summary statistics."""
        db = get_database()
        
        base_query = {"channel_id": channel_id}
        if user_id:
            base_query["user_id"] = user_id
        
        # Total comments
        total_comments = await db.comments.count_documents(base_query)
        
        # Total videos
        total_videos = await db.videos.count_documents(base_query)
        
        # Unique commenters
        unique_commenters = await db.commenters.count_documents(base_query)
        
        # Bookmarked comments
        bookmarked = await db.comments.count_documents({
            **base_query,
            "is_bookmarked": True
        })
        
        # Sentiment breakdown
        sentiment = await self.get_sentiment_breakdown(channel_id, user_id)
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_comments = await db.comments.count_documents({
            **base_query,
            "published_at": {"$gte": week_ago}
        })
        
        return {
            "total_comments": total_comments,
            "total_videos": total_videos,
            "unique_commenters": unique_commenters,
            "bookmarked_comments": bookmarked,
            "sentiment": sentiment,
            "recent_comments_7d": recent_comments
        }


# Singleton instance
analytics_service = AnalyticsService()
