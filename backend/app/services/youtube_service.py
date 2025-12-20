import re
from typing import Optional, List, Dict, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime

from app.config import get_settings

settings = get_settings()


class YouTubeService:
    """Service for interacting with YouTube Data API v3."""
    
    def __init__(self):
        self.youtube = build('youtube', 'v3', developerKey=settings.youtube_api_key)
    
    def extract_channel_id(self, url_or_id: str) -> Optional[str]:
        """Extract channel ID from URL or return as-is if already an ID."""
        # If it's already a channel ID (starts with UC)
        if url_or_id.startswith('UC') and len(url_or_id) == 24:
            return url_or_id
        
        # Extract from various URL formats
        patterns = [
            r'youtube\.com/channel/([^/?&]+)',
            r'youtube\.com/c/([^/?&]+)',
            r'youtube\.com/@([^/?&]+)',
            r'youtube\.com/user/([^/?&]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url_or_id)
            if match:
                identifier = match.group(1)
                # If it's a handle (@username), we need to resolve it
                if pattern.endswith('@([^/?&]+)'):
                    return self._resolve_handle(identifier)
                elif pattern.endswith('/c/([^/?&]+)') or pattern.endswith('/user/([^/?&]+)'):
                    return self._resolve_custom_url(identifier)
                return identifier
        
        # Try treating it as a handle
        if url_or_id.startswith('@'):
            return self._resolve_handle(url_or_id[1:])
        
        return None
    
    def _resolve_handle(self, handle: str) -> Optional[str]:
        """Resolve a YouTube handle to channel ID."""
        try:
            response = self.youtube.search().list(
                part='snippet',
                q=f'@{handle}',
                type='channel',
                maxResults=1
            ).execute()
            
            if response.get('items'):
                return response['items'][0]['snippet']['channelId']
        except HttpError:
            pass
        return None
    
    def _resolve_custom_url(self, custom_url: str) -> Optional[str]:
        """Resolve a custom URL to channel ID."""
        try:
            response = self.youtube.search().list(
                part='snippet',
                q=custom_url,
                type='channel',
                maxResults=1
            ).execute()
            
            if response.get('items'):
                return response['items'][0]['snippet']['channelId']
        except HttpError:
            pass
        return None
    
    def get_channel_info(self, channel_id: str) -> Optional[Dict[str, Any]]:
        """Get channel information."""
        try:
            response = self.youtube.channels().list(
                part='snippet,statistics',
                id=channel_id
            ).execute()
            
            if response.get('items'):
                item = response['items'][0]
                return {
                    'channel_id': channel_id,
                    'name': item['snippet']['title'],
                    'description': item['snippet'].get('description', ''),
                    'thumbnail_url': item['snippet']['thumbnails'].get('high', {}).get('url'),
                    'subscriber_count': int(item['statistics'].get('subscriberCount', 0)),
                    'video_count': int(item['statistics'].get('videoCount', 0)),
                }
        except HttpError as e:
            print(f"Error getting channel info: {e}")
        return None
    
    def get_channel_videos(
        self,
        channel_id: str,
        max_results: int = 50,
        published_after: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get videos from a channel."""
        videos = []
        next_page_token = None
        
        try:
            while True:
                request_params = {
                    'part': 'snippet',
                    'channelId': channel_id,
                    'maxResults': min(max_results - len(videos), 50),
                    'order': 'date',
                    'type': 'video'
                }
                
                if published_after:
                    request_params['publishedAfter'] = published_after.isoformat() + 'Z'
                
                if next_page_token:
                    request_params['pageToken'] = next_page_token
                
                response = self.youtube.search().list(**request_params).execute()
                
                video_ids = [item['id']['videoId'] for item in response.get('items', [])]
                
                if video_ids:
                    # Get video statistics
                    stats_response = self.youtube.videos().list(
                        part='statistics,snippet',
                        id=','.join(video_ids)
                    ).execute()
                    
                    for item in stats_response.get('items', []):
                        videos.append({
                            'video_id': item['id'],
                            'channel_id': channel_id,
                            'title': item['snippet']['title'],
                            'description': item['snippet'].get('description', ''),
                            'thumbnail_url': item['snippet']['thumbnails'].get('high', {}).get('url'),
                            'published_at': datetime.fromisoformat(
                                item['snippet']['publishedAt'].replace('Z', '+00:00')
                            ),
                            'view_count': int(item['statistics'].get('viewCount', 0)),
                            'like_count': int(item['statistics'].get('likeCount', 0)),
                            'comment_count': int(item['statistics'].get('commentCount', 0)),
                        })
                
                next_page_token = response.get('nextPageToken')
                
                if not next_page_token or len(videos) >= max_results:
                    break
                    
        except HttpError as e:
            print(f"Error getting channel videos: {e}")
        
        return videos
    
    def get_video_comments(
        self,
        video_id: str,
        channel_id: str,
        max_results: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get comments from a video."""
        comments = []
        next_page_token = None
        
        try:
            while True:
                request_params = {
                    'part': 'snippet,replies',
                    'videoId': video_id,
                    'maxResults': min(100, max_results - len(comments)),
                    'order': 'time',
                    'textFormat': 'plainText'
                }
                
                if next_page_token:
                    request_params['pageToken'] = next_page_token
                
                response = self.youtube.commentThreads().list(**request_params).execute()
                
                for item in response.get('items', []):
                    # Top-level comment
                    top_comment = item['snippet']['topLevelComment']['snippet']
                    comment_data = {
                        'comment_id': item['snippet']['topLevelComment']['id'],
                        'video_id': video_id,
                        'channel_id': channel_id,
                        'author_name': top_comment['authorDisplayName'],
                        'author_channel_id': top_comment.get('authorChannelId', {}).get('value', ''),
                        'author_profile_image': top_comment.get('authorProfileImageUrl'),
                        'text': top_comment['textDisplay'],
                        'like_count': top_comment.get('likeCount', 0),
                        'reply_count': item['snippet'].get('totalReplyCount', 0),
                        'published_at': datetime.fromisoformat(
                            top_comment['publishedAt'].replace('Z', '+00:00')
                        ),
                        'updated_at': datetime.fromisoformat(
                            top_comment['updatedAt'].replace('Z', '+00:00')
                        ) if top_comment.get('updatedAt') else None,
                        'parent_id': None,
                        'is_reply': False,
                    }
                    comments.append(comment_data)
                    
                    # Replies
                    if 'replies' in item:
                        for reply in item['replies']['comments']:
                            reply_snippet = reply['snippet']
                            reply_data = {
                                'comment_id': reply['id'],
                                'video_id': video_id,
                                'channel_id': channel_id,
                                'author_name': reply_snippet['authorDisplayName'],
                                'author_channel_id': reply_snippet.get('authorChannelId', {}).get('value', ''),
                                'author_profile_image': reply_snippet.get('authorProfileImageUrl'),
                                'text': reply_snippet['textDisplay'],
                                'like_count': reply_snippet.get('likeCount', 0),
                                'reply_count': 0,
                                'published_at': datetime.fromisoformat(
                                    reply_snippet['publishedAt'].replace('Z', '+00:00')
                                ),
                                'updated_at': datetime.fromisoformat(
                                    reply_snippet['updatedAt'].replace('Z', '+00:00')
                                ) if reply_snippet.get('updatedAt') else None,
                                'parent_id': item['snippet']['topLevelComment']['id'],
                                'is_reply': True,
                            }
                            comments.append(reply_data)
                
                next_page_token = response.get('nextPageToken')
                
                if not next_page_token or len(comments) >= max_results:
                    break
                    
        except HttpError as e:
            # Comments might be disabled
            if 'commentsDisabled' in str(e):
                print(f"Comments disabled for video {video_id}")
            else:
                print(f"Error getting video comments: {e}")
        
        return comments


# Singleton instance
youtube_service = YouTubeService()
