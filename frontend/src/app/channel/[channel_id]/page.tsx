'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { channelsApi, analyticsApi } from '@/lib/api';
import { Channel, ChannelSummary, TopVideo } from '@/lib/types';
import { AppSidebar, MainContent } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GridCorner } from '@/components/ui/grid-corner';
import {
    MessageSquare,
    Video,
    Users,
    Bookmark,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    RefreshCw,
    ArrowLeft,
    ChevronRight,
} from 'lucide-react';

export default function ChannelDashboard() {
    const params = useParams();
    const channelId = params.channel_id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [summary, setSummary] = useState<ChannelSummary | null>(null);
    const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [channelId]);

    const loadData = async () => {
        try {
            const [channelData, summaryData, videosData] = await Promise.all([
                channelsApi.get(channelId),
                analyticsApi.getSummary(channelId),
                analyticsApi.getTopVideos(channelId, 5),
            ]);
            setChannel(channelData);
            setSummary(summaryData);
            setTopVideos(videosData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            await channelsApi.sync(channelId);
            setChannel((prev) => (prev ? { ...prev, sync_status: 'syncing' } : null));
        } catch (error) {
            console.error('Failed to start sync:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!channel || !summary) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0f0f0f]">
                <p className="text-neutral-500">Channel not found</p>
                <Link href="/">
                    <Button variant="outline" className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02] hover:text-[#e5e5e5]">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    const sentimentData = summary.sentiment;

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
            <AppSidebar channelId={channelId} />

            <MainContent>
                {/* Header - Brutalist Utility Bar */}
                <header className="relative border-b border-neutral-800 bg-[#0f0f0f]">
                    <GridCorner corner="top-left" />
                    <GridCorner corner="top-right" />
                    <div className="flex h-16 items-center justify-between px-8">
                        <div className="flex items-center gap-6">
                            <Link href="/">
                                <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors">
                                    <ArrowLeft size={14} /> Back
                                </button>
                            </Link>
                            <div className="flex items-center gap-3">
                                {channel.thumbnail_url && (
                                    <img
                                        src={channel.thumbnail_url}
                                        alt={channel.name}
                                        className="h-8 w-8 border border-neutral-800"
                                    />
                                )}
                                <div>
                                    <h1 className="font-serif text-lg text-[#e5e5e5]">{channel.name}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-bold hidden md:block">
                            Channel Analytics / v0.1
                        </div>

                        <button
                            onClick={handleSync}
                            disabled={channel.sync_status === 'syncing'}
                            className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${channel.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                            {channel.sync_status === 'syncing' ? 'Syncing...' : 'Sync'}
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8">
                    {/* Stats Cards - Brutalist Grid */}
                    <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4 border border-neutral-800 mb-8">
                        <div className="relative p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 group hover:bg-white/[0.02] transition-colors">
                            <GridCorner corner="top-left" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Total Comments</p>
                                    <p className="font-serif text-3xl text-[#e5e5e5]">
                                        {summary.total_comments.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        +{summary.recent_comments_7d.toLocaleString()} in 7d
                                    </p>
                                </div>
                                <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-neutral-500" />
                                </div>
                            </div>
                        </div>

                        <div className="relative p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 group hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Videos Analyzed</p>
                                    <p className="font-serif text-3xl text-[#e5e5e5]">{summary.total_videos}</p>
                                </div>
                                <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                    <Video className="h-5 w-5 text-neutral-500" />
                                </div>
                            </div>
                        </div>

                        <div className="relative p-6 border-b md:border-b-0 lg:border-r border-neutral-800 group hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Unique Commenters</p>
                                    <p className="font-serif text-3xl text-[#e5e5e5]">
                                        {summary.unique_commenters.toLocaleString()}
                                    </p>
                                </div>
                                <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-neutral-500" />
                                </div>
                            </div>
                        </div>

                        <div className="relative p-6 group hover:bg-white/[0.02] transition-colors">
                            <GridCorner corner="top-right" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Bookmarked</p>
                                    <p className="font-serif text-3xl text-[#e5e5e5]">{summary.bookmarked_comments}</p>
                                </div>
                                <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                    <Bookmark className="h-5 w-5 text-neutral-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sentiment Overview & Top Videos */}
                    <div className="grid gap-0 lg:grid-cols-2 border border-neutral-800">
                        {/* Sentiment Card */}
                        <div className="relative p-8 border-b lg:border-b-0 lg:border-r border-neutral-800">
                            <GridCorner corner="top-left" />
                            <GridCorner corner="bottom-left" />

                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="h-5 w-5 text-neutral-500" />
                                <h3 className="font-serif text-xl text-[#e5e5e5]">Sentiment Overview</h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ThumbsUp className="h-4 w-4 text-neutral-400" />
                                            <span className="text-sm text-neutral-400">Positive</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg text-[#e5e5e5]">
                                                {sentimentData.breakdown.positive.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 px-2 py-0.5">
                                                {sentimentData.percentages.positive}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1 overflow-hidden bg-neutral-800">
                                        <div
                                            className="h-full bg-neutral-400 transition-all"
                                            style={{ width: `${sentimentData.percentages.positive}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border border-neutral-600" />
                                            <span className="text-sm text-neutral-400">Neutral</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg text-[#e5e5e5]">
                                                {sentimentData.breakdown.neutral.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 px-2 py-0.5">
                                                {sentimentData.percentages.neutral}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1 overflow-hidden bg-neutral-800">
                                        <div
                                            className="h-full bg-neutral-600 transition-all"
                                            style={{ width: `${sentimentData.percentages.neutral}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ThumbsDown className="h-4 w-4 text-neutral-500" />
                                            <span className="text-sm text-neutral-400">Negative</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg text-[#e5e5e5]">
                                                {sentimentData.breakdown.negative.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 px-2 py-0.5">
                                                {sentimentData.percentages.negative}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1 overflow-hidden bg-neutral-800">
                                        <div
                                            className="h-full bg-neutral-500 transition-all"
                                            style={{ width: `${sentimentData.percentages.negative}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Videos Card */}
                        <div className="relative p-8">
                            <GridCorner corner="top-right" />
                            <GridCorner corner="bottom-right" />

                            <div className="flex items-center gap-2 mb-6">
                                <Video className="h-5 w-5 text-neutral-500" />
                                <h3 className="font-serif text-xl text-[#e5e5e5]">Top Videos by Comments</h3>
                            </div>

                            <div className="space-y-4">
                                {topVideos.map((video, index) => (
                                    <div key={video.video_id} className="flex items-center gap-4 p-3 border border-neutral-800 hover:bg-white/[0.02] transition-colors">
                                        <span className="font-serif text-lg text-neutral-600 w-6 text-center">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {video.thumbnail_url && (
                                            <img
                                                src={video.thumbnail_url}
                                                alt={video.title}
                                                className="h-10 w-16 object-cover transition-all"
                                            />
                                        )}
                                        <div className="flex-1 truncate">
                                            <p className="truncate text-sm text-[#e5e5e5]">{video.title}</p>
                                            <p className="text-xs text-neutral-600">
                                                {video.comment_count.toLocaleString()} comments • {video.sentiment_ratio}% positive
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {topVideos.length === 0 && (
                                    <p className="py-4 text-center text-neutral-600">
                                        No videos yet. Sync comments to see top videos.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 relative border border-neutral-800 p-8">
                        <GridCorner corner="top-left" />
                        <GridCorner corner="top-right" />
                        <GridCorner corner="bottom-left" />
                        <GridCorner corner="bottom-right" />

                        <h3 className="font-serif text-xl text-[#e5e5e5] mb-6">Quick Actions</h3>

                        <div className="flex flex-wrap gap-3">
                            <Link href={`/channel/${channelId}/comments`}>
                                <Button variant="outline" className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02] hover:text-[#e5e5e5] group">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    View All Comments
                                    <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </Link>
                            <Link href={`/channel/${channelId}/analytics`}>
                                <Button variant="outline" className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02] hover:text-[#e5e5e5] group">
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    View Analytics
                                    <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </Link>
                            <Link href={`/channel/${channelId}/community`}>
                                <Button variant="outline" className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02] hover:text-[#e5e5e5] group">
                                    <Users className="mr-2 h-4 w-4" />
                                    Community Insights
                                    <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </Link>
                            <Link href={`/channel/${channelId}/chat`}>
                                <Button className="bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white border-0">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    AI Chat
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-8 px-8 pb-8">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-neutral-600">
                        <div className="flex gap-6">
                            <span>© CreatorPulse 2025</span>
                            <span className="hidden sm:inline">{channel.name}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-neutral-400">01 — Overview</span>
                            <span>02 — Comments</span>
                            <span>03 — Analytics</span>
                        </div>
                    </div>
                </footer>
            </MainContent>
        </div>
    );
}
