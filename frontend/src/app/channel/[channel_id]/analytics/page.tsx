'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { analyticsApi, channelsApi } from '@/lib/api';
import { Channel, SentimentBreakdown, SentimentTrend, TopVideo } from '@/lib/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart3,
    TrendingUp,
    ThumbsUp,
    ThumbsDown,
    Video,
    Loader2,
    Tag,
} from 'lucide-react';

export default function AnalyticsPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [sentiment, setSentiment] = useState<SentimentBreakdown | null>(null);
    const [trends, setTrends] = useState<SentimentTrend[]>([]);
    const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
    const [tagBreakdown, setTagBreakdown] = useState<Record<string, number>>({});
    const [days, setDays] = useState('30');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [channelId, days]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [channelData, sentimentData, trendsData, videosData, tagsData] = await Promise.all([
                channelsApi.get(channelId),
                analyticsApi.getSentiment(channelId),
                analyticsApi.getTrends(channelId, parseInt(days)),
                analyticsApi.getTopVideos(channelId, 10),
                analyticsApi.getTags(channelId),
            ]);
            setChannel(channelData);
            setSentiment(sentimentData);
            setTrends(trendsData);
            setTopVideos(videosData);
            setTagBreakdown(tagsData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const maxTrendValue = Math.max(...trends.map((t) => t.total), 1);

    return (
        <div className="min-h-screen bg-zinc-950">
            <AppSidebar channelId={channelId} />

            <main className="ml-64 min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6" />
                            <h1 className="text-xl font-bold">Analytics</h1>
                        </div>

                        <Select value={days} onValueChange={setDays}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                <div className="p-6">
                    {/* Sentiment Overview */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Sentiment Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sentiment && (
                                    <div className="space-y-6">
                                        {/* Visual Bars */}
                                        <div className="space-y-4">
                                            <div>
                                                <div className="mb-2 flex justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <ThumbsUp className="h-4 w-4 text-green-500" />
                                                        Positive
                                                    </span>
                                                    <span className="font-medium">
                                                        {sentiment.breakdown.positive.toLocaleString()} ({sentiment.percentages.positive}%)
                                                    </span>
                                                </div>
                                                <div className="h-4 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full bg-green-500 transition-all"
                                                        style={{ width: `${sentiment.percentages.positive}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 flex justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full bg-gray-400" />
                                                        Neutral
                                                    </span>
                                                    <span className="font-medium">
                                                        {sentiment.breakdown.neutral.toLocaleString()} ({sentiment.percentages.neutral}%)
                                                    </span>
                                                </div>
                                                <div className="h-4 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full bg-gray-400 transition-all"
                                                        style={{ width: `${sentiment.percentages.neutral}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 flex justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <ThumbsDown className="h-4 w-4 text-red-500" />
                                                        Negative
                                                    </span>
                                                    <span className="font-medium">
                                                        {sentiment.breakdown.negative.toLocaleString()} ({sentiment.percentages.negative}%)
                                                    </span>
                                                </div>
                                                <div className="h-4 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full bg-red-500 transition-all"
                                                        style={{ width: `${sentiment.percentages.negative}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 text-center text-sm text-muted-foreground">
                                            Total: {sentiment.total.toLocaleString()} comments analyzed
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tag Breakdown */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Tag Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(tagBreakdown)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([tag, count]) => (
                                            <div key={tag} className="flex items-center gap-3">
                                                <span className="w-40 truncate text-sm capitalize">
                                                    {tag.replace('_', ' ')}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full bg-primary transition-all"
                                                            style={{
                                                                width: `${(count / Math.max(...Object.values(tagBreakdown))) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium">{count}</span>
                                            </div>
                                        ))}

                                    {Object.keys(tagBreakdown).length === 0 && (
                                        <p className="py-8 text-center text-muted-foreground">
                                            No tags found. Sync comments to see tag analytics.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Trends Chart */}
                    <Card className="mt-6 bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Comment Activity (Last {days} days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {trends.length > 0 ? (
                                <div className="h-64">
                                    {/* SVG Line Chart */}
                                    <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                                        {/* Grid lines */}
                                        <line x1="0" y1="50" x2="800" y2="50" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4" />
                                        <line x1="0" y1="100" x2="800" y2="100" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4" />
                                        <line x1="0" y1="150" x2="800" y2="150" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4" />

                                        {/* Area fill */}
                                        <path
                                            d={`M0,200 ${trends.map((day, i) => {
                                                const x = (i / (trends.length - 1)) * 800;
                                                const y = 200 - (maxTrendValue > 0 ? (day.total / maxTrendValue) * 180 : 0);
                                                return `L${x},${y}`;
                                            }).join(' ')} L800,200 Z`}
                                            fill="url(#areaGradient)"
                                        />

                                        {/* Line */}
                                        <path
                                            d={`M${trends.map((day, i) => {
                                                const x = (i / (trends.length - 1)) * 800;
                                                const y = 200 - (maxTrendValue > 0 ? (day.total / maxTrendValue) * 180 : 0);
                                                return `${x},${y}`;
                                            }).join(' L')}`}
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Data points */}
                                        {trends.map((day, i) => {
                                            const x = (i / (trends.length - 1)) * 800;
                                            const y = 200 - (maxTrendValue > 0 ? (day.total / maxTrendValue) * 180 : 0);
                                            return (
                                                <g key={day.date}>
                                                    <circle
                                                        cx={x}
                                                        cy={y}
                                                        r="4"
                                                        fill="#10b981"
                                                        className="hover:r-6 transition-all"
                                                    />
                                                    <title>{day.date}: {day.total} comments</title>
                                                </g>
                                            );
                                        })}

                                        {/* Gradient definition */}
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="mt-2 flex justify-between text-xs text-zinc-500">
                                        <span>{trends[0]?.date}</span>
                                        <span className="text-emerald-500 font-medium">Max: {maxTrendValue} comments</span>
                                        <span>{trends[trends.length - 1]?.date}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    No trend data available. Sync comments to see trends.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Videos */}
                    <Card className="mt-6 bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Video className="h-5 w-5" />
                                Top Videos by Comments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topVideos.map((video, index) => (
                                    <div key={video.video_id} className="flex items-center gap-4">
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index < 3
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {index + 1}
                                        </span>

                                        {video.thumbnail_url && (
                                            <img
                                                src={video.thumbnail_url}
                                                alt={video.title}
                                                className="h-12 w-20 rounded object-cover"
                                            />
                                        )}

                                        <div className="flex-1">
                                            <p className="line-clamp-1 font-medium">{video.title}</p>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span>{video.comment_count.toLocaleString()} comments</span>
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {video.positive_count}
                                                </span>
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <ThumbsDown className="h-3 w-3" />
                                                    {video.negative_count}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span
                                                className={`text-lg font-bold ${video.sentiment_ratio >= 70
                                                    ? 'text-green-600'
                                                    : video.sentiment_ratio >= 40
                                                        ? 'text-gray-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                {video.sentiment_ratio}%
                                            </span>
                                            <p className="text-xs text-muted-foreground">positive</p>
                                        </div>
                                    </div>
                                ))}

                                {topVideos.length === 0 && (
                                    <p className="py-8 text-center text-muted-foreground">
                                        No videos yet. Sync comments to see top videos.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
