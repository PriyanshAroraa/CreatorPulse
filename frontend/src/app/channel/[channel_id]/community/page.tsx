'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useChannel, useCommunityStats, useTopCommenters, useStreaks } from '@/hooks/use-cached-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GridCorner } from '@/components/ui/grid-corner';
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
    ArrowLeft,
} from 'lucide-react';

export default function CommunityPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    // SWR hooks for cached data fetching - instant on subsequent visits
    const { data: channel, isLoading: channelLoading } = useChannel(channelId);
    const { data: stats, isLoading: statsLoading } = useCommunityStats(channelId);
    const { data: topCommenters = [], isLoading: topLoading } = useTopCommenters(channelId, 20);
    const { data: streaks = [], isLoading: streaksLoading } = useStreaks(channelId, 20);

    const loading = channelLoading || statsLoading || topLoading || streaksLoading;

    if (loading && !channel) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="relative border-b border-neutral-800 bg-[#0f0f0f]">
                <GridCorner corner="top-left" />
                <GridCorner corner="top-right" />
                <div className="flex h-16 items-center justify-between px-8">
                    <div className="flex items-center gap-6">
                        <Link href={`/channel/${channelId}`}>
                            <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors">
                                <ArrowLeft size={14} /> Back
                            </button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-neutral-500" />
                            <h1 className="font-serif text-lg text-[#e5e5e5]">Community Insights</h1>
                        </div>
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-bold hidden md:block">
                        Audience Analytics / v0.1
                    </div>
                </div>
            </header>

            <div className="p-8">
                {/* Stats Cards */}
                <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4 border border-neutral-800 mb-8">
                    <div className="relative p-6 border-b md:border-b-0 md:border-r border-neutral-800 hover:bg-white/[0.02] transition-colors">
                        <GridCorner corner="top-left" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Total Comments</p>
                                <p className="font-serif text-3xl text-[#e5e5e5]">
                                    {stats?.total_commenters.toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-neutral-500" />
                            </div>
                        </div>
                    </div>

                    <div className="relative p-6 border-b md:border-b-0 md:border-r border-neutral-800 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Unique Commenters</p>
                                <p className="font-serif text-3xl text-[#e5e5e5]">
                                    {stats?.unique_commenters.toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                <Users className="h-5 w-5 text-neutral-500" />
                            </div>
                        </div>
                    </div>

                    <div className="relative p-6 border-b md:border-b-0 md:border-r border-neutral-800 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Repeat Audience</p>
                                <p className="font-serif text-3xl text-[#e5e5e5]">
                                    {stats?.repeat_commenters.toLocaleString()}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {stats?.repeat_percentage}% of audience
                                </p>
                            </div>
                            <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                <Repeat className="h-5 w-5 text-neutral-500" />
                            </div>
                        </div>
                    </div>

                    <div className="relative p-6 hover:bg-white/[0.02] transition-colors">
                        <GridCorner corner="top-right" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Avg Comments/User</p>
                                <p className="font-serif text-3xl text-[#e5e5e5]">{stats?.avg_comments_per_user}</p>
                            </div>
                            <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-neutral-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs for Lists */}
                <Tabs defaultValue="top" className="space-y-0">
                    <div className="relative border-x border-t border-neutral-800 p-4">
                        <GridCorner corner="top-left" />
                        <GridCorner corner="top-right" />
                        <TabsList className="bg-transparent gap-4">
                            <TabsTrigger
                                value="top"
                                className="data-[state=active]:bg-white/[0.02] data-[state=active]:text-[#e5e5e5] text-neutral-500 gap-2 border border-transparent data-[state=active]:border-neutral-800"
                            >
                                <Trophy className="h-4 w-4" />
                                Top Commenters
                            </TabsTrigger>
                            <TabsTrigger
                                value="streaks"
                                className="data-[state=active]:bg-white/[0.02] data-[state=active]:text-[#e5e5e5] text-neutral-500 gap-2 border border-transparent data-[state=active]:border-neutral-800"
                            >
                                <Flame className="h-4 w-4" />
                                Streaks
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="top" className="mt-0">
                        <div className="relative border border-neutral-800 border-t-0">
                            <GridCorner corner="bottom-left" />
                            <GridCorner corner="bottom-right" />
                            {topCommenters.map((commenter, index) => (
                                <div
                                    key={commenter.author_channel_id}
                                    className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${index !== topCommenters.length - 1 ? 'border-b border-neutral-800' : ''}`}
                                >
                                    <span className="font-serif text-lg text-neutral-600 w-8 text-center">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>

                                    <Avatar className="h-10 w-10 border border-neutral-800">
                                        <AvatarImage src={commenter.author_profile_image} />
                                        <AvatarFallback className="bg-[#0f0f0f] text-neutral-500">
                                            {commenter.author_name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <p className="font-medium text-[#e5e5e5]">{commenter.author_name}</p>
                                        <p className="text-xs text-neutral-600">
                                            {commenter.videos_count} videos
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                                        <span className="flex items-center gap-1.5">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {commenter.comment_count}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            {commenter.total_likes_received}
                                        </span>
                                        {commenter.is_repeat && (
                                            <span className="text-[10px] uppercase tracking-wider border border-neutral-800 px-2 py-0.5">
                                                Repeat
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {topCommenters.length === 0 && (
                                <p className="py-8 text-center text-neutral-600">
                                    No commenters yet. Sync comments to see community data.
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="streaks" className="mt-0">
                        <div className="relative border border-neutral-800 border-t-0">
                            <GridCorner corner="bottom-left" />
                            <GridCorner corner="bottom-right" />
                            {streaks.map((commenter, index) => (
                                <div
                                    key={commenter.author_channel_id}
                                    className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${index !== streaks.length - 1 ? 'border-b border-neutral-800' : ''}`}
                                >
                                    <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center">
                                        <Flame className="h-5 w-5 text-neutral-500" />
                                    </div>

                                    <Avatar className="h-10 w-10 border border-neutral-800">
                                        <AvatarImage src={commenter.author_profile_image} />
                                        <AvatarFallback className="bg-[#0f0f0f] text-neutral-500">
                                            {commenter.author_name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <p className="font-medium text-[#e5e5e5]">{commenter.author_name}</p>
                                        <p className="text-xs text-neutral-600">
                                            {commenter.comment_count} total comments
                                        </p>
                                    </div>

                                    <span className="font-serif text-xl text-[#e5e5e5]">
                                        {commenter.streak_days}
                                        <span className="text-[10px] uppercase tracking-wider text-neutral-600 ml-2">days</span>
                                    </span>
                                </div>
                            ))}

                            {streaks.length === 0 && (
                                <p className="py-8 text-center text-neutral-600">
                                    No streaks yet. Streaks are calculated over time.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
