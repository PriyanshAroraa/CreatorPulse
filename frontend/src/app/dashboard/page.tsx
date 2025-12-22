'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { channelsApi } from '@/lib/api';
import { Channel } from '@/lib/types';
import { AppSidebar, MainContent } from '@/components/layout/app-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GridCorner } from '@/components/ui/grid-corner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus,
    MessageSquare,
    TrendingUp,
    Users,
    Loader2,
    Trash2,
    LogOut,
} from 'lucide-react';

export default function DashboardPage() {
    const { data: session } = useSession();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [channelUrl, setChannelUrl] = useState('');

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            const data = await channelsApi.list();
            setChannels(data);
        } catch (error) {
            console.error('Failed to load channels:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChannel = async () => {
        if (!channelUrl.trim()) return;
        setAdding(true);
        try {
            const newChannel = await channelsApi.add(channelUrl.trim());
            setChannels((prev) => [...prev, newChannel]);
            setChannelUrl('');
            setDialogOpen(false);
        } catch (error) {
            console.error('Failed to add channel:', error);
            alert('Failed to add channel. Please check the URL and try again.');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteChannel = async (channelId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this channel?')) return;
        try {
            await channelsApi.delete(channelId);
            setChannels((prev) => prev.filter((c) => c.channel_id !== channelId));
        } catch (error) {
            console.error('Failed to delete channel:', error);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
            <AppSidebar />

            <MainContent>
                {/* Header */}
                <header className="relative border-b border-neutral-800 bg-[#0f0f0f]">
                    <GridCorner corner="top-left" />
                    <GridCorner corner="top-right" />
                    <div className="flex h-16 items-center justify-between px-8">
                        <div className="flex items-center gap-8">
                            <div>
                                <h1 className="font-serif text-lg text-[#e5e5e5]">Dashboard</h1>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                    {channels.length} channels connected
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {session?.user && (
                                <div className="flex items-center gap-3">
                                    {session.user.image && (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || 'User'}
                                            className="h-8 w-8 border border-neutral-800"
                                        />
                                    )}
                                    <span className="text-sm text-neutral-400">{session.user.name}</span>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors"
                                    >
                                        <LogOut size={14} />
                                    </button>
                                </div>
                            )}

                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors">
                                        <Plus size={14} /> Add Channel
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0f0f0f] border-neutral-800">
                                    <DialogHeader>
                                        <DialogTitle className="font-serif text-xl text-[#e5e5e5]">Add YouTube Channel</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-neutral-600">
                                                Channel URL or ID
                                            </label>
                                            <Input
                                                placeholder="https://youtube.com/@channelname"
                                                value={channelUrl}
                                                onChange={(e) => setChannelUrl(e.target.value)}
                                                className="mt-2 bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5] placeholder:text-neutral-600"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleAddChannel}
                                            disabled={adding || !channelUrl.trim()}
                                            className="w-full bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white"
                                        >
                                            {adding ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                'Add Channel'
                                            )}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                        </div>
                    ) : channels.length === 0 ? (
                        <div className="relative border border-neutral-800">
                            <GridCorner corner="top-left" />
                            <GridCorner corner="top-right" />
                            <GridCorner corner="bottom-left" />
                            <GridCorner corner="bottom-right" />
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="h-16 w-16 border border-neutral-800 flex items-center justify-center mb-4">
                                    <Plus className="h-8 w-8 text-neutral-600" />
                                </div>
                                <h2 className="font-serif text-xl text-[#e5e5e5] mb-2">No channels yet</h2>
                                <p className="text-neutral-500 text-sm text-center max-w-sm mb-6">
                                    Add your first YouTube channel to start analyzing comments.
                                </p>
                                <Button
                                    onClick={() => setDialogOpen(true)}
                                    className="bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Channel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3 border border-neutral-800">
                            {channels.map((channel, index) => (
                                <Link key={channel.channel_id} href={`/channel/${channel.channel_id}`}>
                                    <div
                                        className={`relative p-6 hover:bg-white/[0.02] transition-colors cursor-pointer
                                            ${index % 3 !== 2 ? 'lg:border-r border-neutral-800' : ''}
                                            ${index % 2 === 0 ? 'md:border-r lg:border-r-0 border-neutral-800' : 'md:border-r-0'}
                                            ${index < channels.length - (channels.length % 3 || 3) ? 'border-b border-neutral-800' : ''}
                                        `}
                                    >
                                        {index === 0 && <GridCorner corner="top-left" />}
                                        {(index === 2 || (channels.length < 3 && index === channels.length - 1)) && <GridCorner corner="top-right" />}

                                        <div className="flex items-start gap-4">
                                            <img
                                                src={channel.thumbnail_url}
                                                alt={channel.name}
                                                className="h-12 w-12 border border-neutral-800"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-serif text-lg text-[#e5e5e5] truncate">{channel.name}</h3>
                                                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">
                                                    {formatNumber(channel.subscriber_count ?? 0)} subscribers
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteChannel(channel.channel_id, e)}
                                                className="p-2 text-neutral-600 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-800">
                                            <div className="text-center">
                                                <MessageSquare className="h-4 w-4 mx-auto text-neutral-600" />
                                                <p className="font-serif text-lg text-[#e5e5e5] mt-1">
                                                    {formatNumber(channel.total_comments || 0)}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-neutral-600">Comments</p>
                                            </div>
                                            <div className="text-center">
                                                <TrendingUp className="h-4 w-4 mx-auto text-neutral-600" />
                                                <p className="font-serif text-lg text-[#e5e5e5] mt-1">
                                                    {channel.total_videos_analyzed || 0}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-neutral-600">Analyzed</p>
                                            </div>
                                            <div className="text-center">
                                                <Users className="h-4 w-4 mx-auto text-neutral-600" />
                                                <p className="font-serif text-lg text-[#e5e5e5] mt-1">
                                                    {formatNumber(channel.video_count || 0)}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-neutral-600">Videos</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="relative border-t border-neutral-800 mt-auto">
                    <GridCorner corner="bottom-left" />
                    <GridCorner corner="bottom-right" />
                    <div className="px-8 py-4 flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                            CreatorPulse / Dashboard v0.1
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </footer>
            </MainContent>
        </div>
    );
}
