// API Types for YouTube Comment Analyzer

export interface Channel {
    id?: string;
    channel_id: string;
    name: string;
    description?: string;
    thumbnail_url?: string;
    subscriber_count?: number;
    video_count?: number;
    created_at: string;
    last_synced?: string;
    sync_status: 'pending' | 'syncing' | 'completed' | 'error';
    total_comments: number;
    total_videos_analyzed: number;
}

export interface Video {
    id?: string;
    video_id: string;
    channel_id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    published_at?: string;
    view_count?: number;
    like_count?: number;
    comment_count: number;
    analyzed_comment_count: number;
    sentiment_breakdown?: {
        positive: number;
        neutral: number;
        negative: number;
    };
    top_tags?: { tag: string; count: number }[];
}

export interface Comment {
    id?: string;
    comment_id: string;
    video_id: string;
    channel_id: string;
    author_name: string;
    author_channel_id: string;
    author_profile_image?: string;
    text: string;
    like_count: number;
    reply_count: number;
    published_at: string;
    updated_at?: string;
    parent_id?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    sentiment_score?: number;
    tags: string[];
    is_bookmarked: boolean;
    is_reply: boolean;
}

export interface Commenter {
    author_channel_id: string;
    author_name: string;
    author_profile_image?: string;
    comment_count: number;
    total_likes_received: number;
    videos_count: number;
    streak_days: number;
    first_comment_at?: string;
    last_comment_at?: string;
    is_repeat: boolean;
}

export interface CommunityStats {
    total_commenters: number;
    unique_commenters: number;
    repeat_commenters: number;
    repeat_percentage: number;
    avg_comments_per_user: number;
    top_commenters: Commenter[];
}

export interface SentimentBreakdown {
    breakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    percentages: {
        positive: number;
        neutral: number;
        negative: number;
    };
    total: number;
}

export interface Tag {
    id?: string;
    name: string;
    color: string;
    description?: string;
    is_system: boolean;
    is_active: boolean;
    usage_count: number;
}

export interface Report {
    id?: string;
    channel_id: string;
    title: string;
    date_from: string;
    date_to: string;
    data: {
        total_comments: number;
        total_videos: number;
        unique_commenters: number;
        sentiment_breakdown: Record<string, number>;
        sentiment_percentage: Record<string, number>;
        tag_breakdown: Record<string, number>;
        top_videos: Video[];
        top_commenters: Commenter[];
    };
    status: 'generating' | 'completed' | 'error';
    created_at: string;
    completed_at?: string;
}

export interface ChatMessage {
    user_message: string;
    ai_response: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface ChannelSummary {
    total_comments: number;
    total_videos: number;
    unique_commenters: number;
    bookmarked_comments: number;
    sentiment: SentimentBreakdown;
    recent_comments_7d: number;
}

export interface TopVideo {
    video_id: string;
    title: string;
    thumbnail_url?: string;
    published_at?: string;
    comment_count: number;
    positive_count: number;
    negative_count: number;
    sentiment_ratio: number;
}

export interface SentimentTrend {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
}
