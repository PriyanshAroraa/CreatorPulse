'use client';

import useSWR from 'swr';
import { channelsApi, analyticsApi, communityApi } from '@/lib/api';
import { Channel, ChannelSummary, SentimentBreakdown, SentimentTrend, TopVideo, CommunityStats, Commenter } from '@/lib/types';

// SWR configuration for optimal caching
const swrConfig = {
    revalidateOnFocus: false,       // Don't refetch when window regains focus
    revalidateOnReconnect: false,   // Don't refetch on network reconnection
    dedupingInterval: 60000,        // Dedupe requests within 60 seconds
    errorRetryCount: 2,             // Only retry failed requests twice
};

// Long-lived cache config (5 minutes) for rarely changing data
const longCacheConfig = {
    ...swrConfig,
    refreshInterval: 0,             // Never auto-refresh
    dedupingInterval: 300000,       // 5 minute deduping
};

// ============= Channel Hooks =============

export function useChannel(channelId: string | undefined) {
    return useSWR<Channel>(
        channelId ? `channel-${channelId}` : null,
        () => channelsApi.get(channelId!),
        swrConfig
    );
}

export function useChannelSummary(channelId: string | undefined) {
    return useSWR<ChannelSummary>(
        channelId ? `channel-summary-${channelId}` : null,
        () => analyticsApi.getSummary(channelId!),
        swrConfig
    );
}

// ============= Analytics Hooks =============

export function useSentiment(channelId: string | undefined) {
    return useSWR<SentimentBreakdown>(
        channelId ? `sentiment-${channelId}` : null,
        () => analyticsApi.getSentiment(channelId!),
        longCacheConfig
    );
}

export function useTrends(channelId: string | undefined, days: number = 30) {
    return useSWR<SentimentTrend[]>(
        channelId ? `trends-${channelId}-${days}` : null,
        () => analyticsApi.getTrends(channelId!, days),
        longCacheConfig
    );
}

export function useTopVideos(channelId: string | undefined, limit: number = 10) {
    return useSWR<TopVideo[]>(
        channelId ? `top-videos-${channelId}-${limit}` : null,
        () => analyticsApi.getTopVideos(channelId!, limit),
        longCacheConfig
    );
}

export function useTags(channelId: string | undefined) {
    return useSWR<Record<string, number>>(
        channelId ? `tags-${channelId}` : null,
        () => analyticsApi.getTags(channelId!),
        longCacheConfig
    );
}

// ============= Community Hooks =============

export function useCommunityStats(channelId: string | undefined) {
    return useSWR<CommunityStats>(
        channelId ? `community-stats-${channelId}` : null,
        () => communityApi.getStats(channelId!),
        longCacheConfig
    );
}

export function useTopCommenters(channelId: string | undefined, limit: number = 20) {
    return useSWR<Commenter[]>(
        channelId ? `top-commenters-${channelId}-${limit}` : null,
        () => communityApi.getTopCommenters(channelId!, limit),
        longCacheConfig
    );
}

export function useStreaks(channelId: string | undefined, limit: number = 20) {
    return useSWR<Commenter[]>(
        channelId ? `streaks-${channelId}-${limit}` : null,
        () => communityApi.getStreaks(channelId!, limit),
        longCacheConfig
    );
}

// ============= Prefetch Utilities =============

// Prefetch channel data when hovering over channel in sidebar
export async function prefetchChannelData(channelId: string) {
    // These will be cached by SWR
    Promise.all([
        channelsApi.get(channelId),
        analyticsApi.getSummary(channelId),
        analyticsApi.getSentiment(channelId),
    ]).catch(console.error);
}

