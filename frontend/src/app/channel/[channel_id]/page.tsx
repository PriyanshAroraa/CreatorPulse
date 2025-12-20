'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { channelsApi, analyticsApi } from '@/lib/api';
import { Channel, ChannelSummary, TopVideo } from '@/lib/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Zap,
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
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!channel || !summary) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
                <p className="text-zinc-400">Channel not found</p>
                <Link href="/">
                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    const sentimentData = summary.sentiment;

    return (
        <div className="min-h-screen bg-zinc-950">
            <AppSidebar channelId={channelId} />

            <main className="ml-64 min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
                    <div className="flex h-full items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                {channel.thumbnail_url && (
                                    <img
                                        src={channel.thumbnail_url}
                                        alt={channel.name}
                                        className="h-10 w-10 rounded-full ring-2 ring-zinc-700"
                                    />
                                )}
                                <div>
                                    <h1 className="text-lg font-semibold text-white">{channel.name}</h1>
                                    <p className="text-sm text-zinc-500">
                                        {channel.subscriber_count?.toLocaleString()} subscribers
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs text-emerald-300">Local AI</span>
                            </div>
                            <Button
                                onClick={handleSync}
                                disabled={channel.sync_status === 'syncing'}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <RefreshCw
                                    className={`mr-2 h-4 w-4 ${channel.sync_status === 'syncing' ? 'animate-spin' : ''}`}
                                />
                                {channel.sync_status === 'syncing' ? 'Syncing...' : 'Sync Comments'}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Total Comments</p>
                                        <p className="text-2xl font-bold text-white">
                                            {summary.total_comments.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-emerald-400 mt-1">
                                            +{summary.recent_comments_7d.toLocaleString()} in 7d
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <MessageSquare className="h-5 w-5 text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Videos Analyzed</p>
                                        <p className="text-2xl font-bold text-white">{summary.total_videos}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Video className="h-5 w-5 text-purple-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Unique Commenters</p>
                                        <p className="text-2xl font-bold text-white">
                                            {summary.unique_commenters.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-amber-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Bookmarked</p>
                                        <p className="text-2xl font-bold text-white">{summary.bookmarked_comments}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                        <Bookmark className="h-5 w-5 text-rose-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sentiment Overview & Top Videos */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        {/* Sentiment Card */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                    Sentiment Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <ThumbsUp className="h-4 w-4 text-emerald-400" />
                                                <span className="text-zinc-300">Positive</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">
                                                    {sentimentData.breakdown.positive.toLocaleString()}
                                                </span>
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                                                    {sentimentData.percentages.positive}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                                            <div
                                                className="h-full bg-emerald-500 transition-all"
                                                style={{ width: `${sentimentData.percentages.positive}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full bg-zinc-500" />
                                                <span className="text-zinc-300">Neutral</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">
                                                    {sentimentData.breakdown.neutral.toLocaleString()}
                                                </span>
                                                <Badge className="bg-zinc-700 text-zinc-300 border-0">
                                                    {sentimentData.percentages.neutral}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                                            <div
                                                className="h-full bg-zinc-500 transition-all"
                                                style={{ width: `${sentimentData.percentages.neutral}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <ThumbsDown className="h-4 w-4 text-rose-400" />
                                                <span className="text-zinc-300">Negative</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">
                                                    {sentimentData.breakdown.negative.toLocaleString()}
                                                </span>
                                                <Badge className="bg-rose-500/10 text-rose-400 border-0">
                                                    {sentimentData.percentages.negative}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                                            <div
                                                className="h-full bg-rose-500 transition-all"
                                                style={{ width: `${sentimentData.percentages.negative}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Videos Card */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Video className="h-5 w-5 text-purple-400" />
                                    Top Videos by Comments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topVideos.map((video, index) => (
                                        <div key={video.video_id} className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                                                {index + 1}
                                            </span>
                                            {video.thumbnail_url && (
                                                <img
                                                    src={video.thumbnail_url}
                                                    alt={video.title}
                                                    className="h-10 w-16 rounded object-cover"
                                                />
                                            )}
                                            <div className="flex-1 truncate">
                                                <p className="truncate text-sm font-medium text-white">{video.title}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {video.comment_count.toLocaleString()} comments • {video.sentiment_ratio}% positive
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {topVideos.length === 0 && (
                                        <p className="py-4 text-center text-zinc-500">
                                            No videos yet. Sync comments to see top videos.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    <Link href={`/channel/${channelId}/comments`}>
                                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            View All Comments
                                        </Button>
                                    </Link>
                                    <Link href={`/channel/${channelId}/analytics`}>
                                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            View Analytics
                                        </Button>
                                    </Link>
                                    <Link href={`/channel/${channelId}/community`}>
                                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                            <Users className="mr-2 h-4 w-4" />
                                            Community Insights
                                        </Button>
                                    </Link>
                                    <Link href={`/channel/${channelId}/chat`}>
                                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            AI Chat
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
