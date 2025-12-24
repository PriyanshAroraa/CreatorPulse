import {
    Channel,
    Video,
    Comment,
    CommunityStats,
    SentimentBreakdown,
    Tag,
    Report,
    ChatMessage,
    PaginatedResponse,
    ChannelSummary,
    TopVideo,
    SentimentTrend,
    Commenter,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

import { getSession } from 'next-auth/react';

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if session exists
    try {
        const session = await getSession();
        // The backendToken is attached to the session object in lib/auth.ts
        const token = (session as any)?.backendToken;

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (error) {
        console.warn('Failed to get session for API call', error);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
}

// Channels API
export const channelsApi = {
    list: () => fetchApi<Channel[]>('/channels'),

    get: (channelId: string) => fetchApi<Channel>(`/channels/${channelId}`),

    add: (channelUrl: string) =>
        fetchApi<Channel>('/channels', {
            method: 'POST',
            body: JSON.stringify({ channel_url: channelUrl }),
        }),

    delete: (channelId: string) =>
        fetchApi<{ message: string }>(`/channels/${channelId}`, {
            method: 'DELETE',
        }),

    sync: (channelId: string, daysBack = 30, maxVideos = 50) =>
        fetchApi<{ message: string }>(`/channels/${channelId}/sync?days_back=${daysBack}&max_videos=${maxVideos}`, {
            method: 'POST',
        }),

    getSyncStatus: (channelId: string) =>
        fetchApi<{
            channel_id: string;
            sync_status: string;
            last_synced?: string;
            total_comments: number;
            total_videos_analyzed: number;
        }>(`/channels/${channelId}/sync-status`),

    getLogs: (channelId: string) =>
        fetchApi<{
            _id: string;
            message: string;
            level: string;
            created_at: string;
        }[]>(`/channels/${channelId}/logs`),
};

// Videos API
export const videosApi = {
    listByChannel: (channelId: string, limit = 50, skip = 0) =>
        fetchApi<Video[]>(`/videos/channel/${channelId}?limit=${limit}&skip=${skip}`),

    get: (videoId: string) => fetchApi<Video>(`/videos/${videoId}`),

    getComments: (videoId: string, sentiment?: string, limit = 50, skip = 0) => {
        let url = `/videos/${videoId}/comments?limit=${limit}&skip=${skip}`;
        if (sentiment) url += `&sentiment=${sentiment}`;
        return fetchApi<{ items: Comment[]; total: number; video_id: string }>(url);
    },
};

// Comments API
export const commentsApi = {
    listByChannel: (
        channelId: string,
        params: {
            sentiment?: string;
            tags?: string;
            videoId?: string;
            isBookmarked?: boolean;
            dateFrom?: string;
            dateTo?: string;
            search?: string;
            page?: number;
            limit?: number;
        } = {}
    ) => {
        const searchParams = new URLSearchParams();
        if (params.sentiment) searchParams.set('sentiment', params.sentiment);
        if (params.tags) searchParams.set('tags', params.tags);
        if (params.videoId) searchParams.set('video_id', params.videoId);
        if (params.isBookmarked !== undefined)
            searchParams.set('is_bookmarked', String(params.isBookmarked));
        if (params.dateFrom) searchParams.set('date_from', params.dateFrom);
        if (params.dateTo) searchParams.set('date_to', params.dateTo);
        if (params.search) searchParams.set('search', params.search);
        if (params.page) searchParams.set('page', String(params.page));
        if (params.limit) searchParams.set('limit', String(params.limit));

        return fetchApi<PaginatedResponse<Comment>>(
            `/comments/channel/${channelId}?${searchParams.toString()}`
        );
    },

    get: (commentId: string) => fetchApi<Comment>(`/comments/${commentId}`),

    toggleBookmark: (commentId: string, isBookmarked: boolean) =>
        fetchApi<{ message: string }>(`/comments/${commentId}/bookmark`, {
            method: 'PATCH',
            body: JSON.stringify({ is_bookmarked: isBookmarked }),
        }),

    updateTags: (commentId: string, tags: string[]) =>
        fetchApi<{ message: string }>(`/comments/${commentId}/tags`, {
            method: 'PATCH',
            body: JSON.stringify({ tags }),
        }),

    getBookmarked: (channelId: string, page = 1, limit = 50) =>
        fetchApi<{ items: Comment[]; total: number }>(
            `/comments/bookmarked/${channelId}?page=${page}&limit=${limit}`
        ),
};

// Analytics API
export const analyticsApi = {
    getSummary: (channelId: string) =>
        fetchApi<ChannelSummary>(`/analytics/channel/${channelId}/summary`),

    getSentiment: (channelId: string, dateFrom?: string, dateTo?: string) => {
        let url = `/analytics/channel/${channelId}/sentiment`;
        if (dateFrom || dateTo) {
            const params = new URLSearchParams();
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);
            url += `?${params.toString()}`;
        }
        return fetchApi<SentimentBreakdown>(url);
    },

    getTags: (channelId: string, dateFrom?: string, dateTo?: string) => {
        let url = `/analytics/channel/${channelId}/tags`;
        if (dateFrom || dateTo) {
            const params = new URLSearchParams();
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);
            url += `?${params.toString()}`;
        }
        return fetchApi<Record<string, number>>(url);
    },

    getTrends: (channelId: string, days = 30) =>
        fetchApi<SentimentTrend[]>(`/analytics/channel/${channelId}/trends?days=${days}`),

    getTopVideos: (channelId: string, limit = 10) =>
        fetchApi<TopVideo[]>(`/analytics/channel/${channelId}/top-videos?limit=${limit}`),
};

// Community API
export const communityApi = {
    getStats: (channelId: string) =>
        fetchApi<CommunityStats>(`/community/channel/${channelId}/stats`),

    getTopCommenters: (channelId: string, limit = 20) =>
        fetchApi<Commenter[]>(`/community/channel/${channelId}/top-commenters?limit=${limit}`),

    getStreaks: (channelId: string, limit = 20) =>
        fetchApi<Commenter[]>(`/community/channel/${channelId}/streaks?limit=${limit}`),

    getCommenterProfile: (authorChannelId: string, channelId: string) =>
        fetchApi<{ profile: Commenter; recent_comments: Comment[] }>(
            `/community/commenter/${authorChannelId}?channel_id=${channelId}`
        ),
};

// Tags API
export const tagsApi = {
    list: () => fetchApi<Tag[]>('/tags'),

    create: (tag: { name: string; color: string; description?: string }) =>
        fetchApi<Tag>('/tags', {
            method: 'POST',
            body: JSON.stringify(tag),
        }),

    update: (tagName: string, updates: Partial<Tag>) =>
        fetchApi<Tag>(`/tags/${tagName}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        }),

    delete: (tagName: string) =>
        fetchApi<{ message: string }>(`/tags/${tagName}`, {
            method: 'DELETE',
        }),
};

// Reports API
export const reportsApi = {
    list: (channelId: string) =>
        fetchApi<Report[]>(`/reports/channel/${channelId}`),

    create: (channelId: string, dateFrom: string, dateTo: string, title?: string) =>
        fetchApi<Report>('/reports', {
            method: 'POST',
            body: JSON.stringify({
                channel_id: channelId,
                date_from: dateFrom,
                date_to: dateTo,
                title,
            }),
        }),

    get: (reportId: string) => fetchApi<Report>(`/reports/${reportId}`),

    download: (reportId: string) => `${API_URL}/reports/${reportId}/download`,

    delete: (reportId: string) =>
        fetchApi<{ message: string }>(`/reports/${reportId}`, {
            method: 'DELETE',
        }),
};

// Chat API
export const chatApi = {
    send: (channelId: string, message: string) =>
        fetchApi<{ response: string; timestamp: string }>(`/chat/channel/${channelId}`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        }),

    getHistory: (channelId: string, limit = 20) =>
        fetchApi<ChatMessage[]>(`/chat/channel/${channelId}/history?limit=${limit}`),

    clearHistory: (channelId: string) =>
        fetchApi<{ message: string }>(`/chat/channel/${channelId}/history`, {
            method: 'DELETE',
        }),
};

// Subscription API
export const subscriptionApi = {
    getStatus: () =>
        fetchApi<{
            status: string;
            plan: string;
            max_channels: number;
            authenticated: boolean;
        }>('/webhooks/subscription/status'),

    createCheckout: () =>
        fetchApi<{ checkout_url: string }>('/webhooks/checkout/create', {
            method: 'POST',
        }),
};
