'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { communityApi, channelsApi } from '@/lib/api';
import { CommunityStats, Commenter, Channel } from '@/lib/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users,
    UserCheck,
    Repeat,
    Trophy,
    Flame,
    MessageSquare,
    ThumbsUp,
    Loader2,
} from 'lucide-react';

export default function CommunityPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [topCommenters, setTopCommenters] = useState<Commenter[]>([]);
    const [streaks, setStreaks] = useState<Commenter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [channelId]);

    const loadData = async () => {
        try {
            const [channelData, statsData, topData, streaksData] = await Promise.all([
                channelsApi.get(channelId),
                communityApi.getStats(channelId),
                communityApi.getTopCommenters(channelId, 20),
                communityApi.getStreaks(channelId, 20),
            ]);
            setChannel(channelData);
            setStats(statsData);
            setTopCommenters(topData);
            setStreaks(streaksData);
        } catch (error) {
            console.error('Failed to load community data:', error);
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

    return (
        <div className="min-h-screen bg-zinc-950">
            <AppSidebar channelId={channelId} />

            <main className="ml-64 min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
                    <div className="flex h-16 items-center px-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-6 w-6" />
                            <h1 className="text-xl font-bold">Community Insights</h1>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.total_commenters.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Unique Commenters</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.unique_commenters.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Repeat Audience</CardTitle>
                                <Repeat className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.repeat_commenters.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.repeat_percentage}% of audience
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg Comments/User</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.avg_comments_per_user}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Lists */}
                    <div className="mt-6">
                        <Tabs defaultValue="top">
                            <TabsList className="bg-zinc-800">
                                <TabsTrigger value="top" className="gap-2">
                                    <Trophy className="h-4 w-4" />
                                    Top Commenters
                                </TabsTrigger>
                                <TabsTrigger value="streaks" className="gap-2">
                                    <Flame className="h-4 w-4" />
                                    Streaks
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="top" className="mt-4">
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle>Top Commenters</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {topCommenters.map((commenter, index) => (
                                                <div
                                                    key={commenter.author_channel_id}
                                                    className="flex items-center gap-4"
                                                >
                                                    <span
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index < 3
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </span>

                                                    <Avatar>
                                                        <AvatarImage src={commenter.author_profile_image} />
                                                        <AvatarFallback>
                                                            {commenter.author_name.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1">
                                                        <p className="font-medium">{commenter.author_name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {commenter.videos_count} videos
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-4 w-4" />
                                                            {commenter.comment_count}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <ThumbsUp className="h-4 w-4" />
                                                            {commenter.total_likes_received}
                                                        </span>
                                                        {commenter.is_repeat && (
                                                            <Badge variant="secondary">Repeat</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {topCommenters.length === 0 && (
                                                <p className="py-8 text-center text-muted-foreground">
                                                    No commenters yet. Sync comments to see community data.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="streaks" className="mt-4">
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle>Comment Streaks</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {streaks.map((commenter, index) => (
                                                <div
                                                    key={commenter.author_channel_id}
                                                    className="flex items-center gap-4"
                                                >
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-800">
                                                        <Flame className="h-4 w-4" />
                                                    </span>

                                                    <Avatar>
                                                        <AvatarImage src={commenter.author_profile_image} />
                                                        <AvatarFallback>
                                                            {commenter.author_name.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1">
                                                        <p className="font-medium">{commenter.author_name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {commenter.comment_count} total comments
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-orange-100 text-orange-800"
                                                    >
                                                        {commenter.streak_days} day streak
                                                    </Badge>
                                                </div>
                                            ))}

                                            {streaks.length === 0 && (
                                                <p className="py-8 text-center text-muted-foreground">
                                                    No streaks yet. Streaks are calculated over time.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}
