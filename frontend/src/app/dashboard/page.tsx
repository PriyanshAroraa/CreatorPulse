'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { channelsApi, subscriptionApi } from '@/lib/api';
import { useChannels } from '@/contexts/channels-context';
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
    Sparkles,
    Crown,
} from 'lucide-react';

export default function DashboardPage() {
    const { data: session } = useSession();
    // Use cached channels from context
    const { channels, isLoading: loading, loadChannels, addChannel, removeChannel } = useChannels();
    const [adding, setAdding] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [channelUrl, setChannelUrl] = useState('');
    const [syncLogs, setSyncLogs] = useState<{ _id: string; message: string; level: string; created_at: string }[]>([]);
    const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<{ plan: string; max_channels: number } | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        loadChannels();
        // Fetch subscription status
        subscriptionApi.getStatus()
            .then(status => setSubscription({ plan: status.plan, max_channels: status.max_channels }))
            .catch(e => console.error('Failed to fetch subscription:', e));
    }, [loadChannels]);

    // SSE via EventSource for real-time logs (replaces polling)
    useEffect(() => {
        let eventSource: EventSource | null = null;

        if (dialogOpen && currentChannelId) {
            // Initial fetch of any missed logs (optional, but good for history)
            const fetchHistory = async () => {
                try {
                    const logs = await channelsApi.getLogs(currentChannelId);
                    setSyncLogs(logs);
                } catch (e) {
                    console.error("Failed to load log history");
                }
            };
            fetchHistory();

            // Connect to SSE stream
            // Note: EventSource doesn't support headers natively, so we pass token in URL if needed, 
            // but for now relying on cookie or open endpoint as per recent backend change.
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/channels/${currentChannelId}/logs/stream`;

            console.log("Connecting to SSE:", url);
            eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Add new log to state
                    setSyncLogs(prev => [
                        {
                            _id: 'live-' + Date.now(), // Generate temp ID
                            message: data.message,
                            level: data.level,
                            created_at: data.created_at
                        },
                        ...prev
                    ]);

                    // Check for completion message
                    if (data.message.includes("Sync completed") || data.message.includes("completion:") || data.level === 'success') {
                        // Force refresh channels to update stats
                        loadChannels(true);
                    }
                } catch (e) {
                    console.error("Error parsing SSE message:", e);
                }
            };

            eventSource.onerror = (e) => {
                console.error("SSE Error:", e);
                eventSource?.close();
            };
        }

        return () => {
            if (eventSource) {
                console.log("Closing SSE connection");
                eventSource.close();
            }
        };
    }, [dialogOpen, currentChannelId, loadChannels]);

    const handleAddChannel = async () => {
        if (!channelUrl.trim()) return;
        setAdding(true);
        // Show immediate feedback
        setSyncLogs([{
            _id: 'temp-1',
            message: '🧠 Initializing neural link...',
            level: 'info',
            created_at: new Date().toISOString()
        }]);
        setCurrentChannelId(null);

        try {
            const newChannel = await channelsApi.add(channelUrl.trim());
            addChannel(newChannel);
            setCurrentChannelId(newChannel.channel_id); // Start polling
            // Don't close dialog, show logs instead
            setChannelUrl('');
        } catch (error: any) {
            console.error('Failed to add channel:', error);
            // Check if it's a channel limit error
            if (error?.message?.includes('Channel limit') || error?.message?.includes('403')) {
                setShowUpgradePrompt(true);
                setAdding(false);
            } else {
                alert('Failed to add channel. Please check the URL and try again.');
                setAdding(false);
            }
        }
        // distinct from finally: we stay in "adding" mode visually or at least keep dialog open
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setAdding(false);
        setCurrentChannelId(null);
        setSyncLogs([]);
    }

    const handleDeleteChannel = async (channelId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this channel?')) return;
        try {
            await channelsApi.delete(channelId);
            removeChannel(channelId);
        } catch (error) {
            console.error('Failed to delete channel:', error);
            // If 404, remove it anyway as it's gone from backend
            if (error instanceof Error && error.message.includes("404")) {
                removeChannel(channelId);
            }
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

                                    {/* Subscription Badge */}
                                    {subscription?.plan === 'pro' ? (
                                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-semibold rounded">
                                            <Crown size={10} /> Pro
                                        </span>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                setUpgrading(true);
                                                try {
                                                    const { checkout_url } = await subscriptionApi.createCheckout();
                                                    window.open(checkout_url, '_blank');
                                                } catch (e) {
                                                    console.error('Checkout failed:', e);
                                                    alert('Failed to open checkout. Please try again.');
                                                } finally {
                                                    setUpgrading(false);
                                                }
                                            }}
                                            disabled={upgrading}
                                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:from-violet-500 hover:to-purple-400 transition-all rounded"
                                        >
                                            {upgrading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                            Upgrade
                                        </button>
                                    )}

                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors"
                                    >
                                        <LogOut size={14} />
                                    </button>
                                </div>
                            )}

                            <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                                <DialogTrigger asChild>
                                    <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors">
                                        <Plus size={14} /> Add Channel
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0f0f0f] border-neutral-800 sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="font-serif text-xl text-[#e5e5e5]">Add YouTube Channel</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        {!currentChannelId ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-medium text-[#e5e5e5] flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                                                        <span className="animate-pulse">Neural Sync Active...</span>
                                                    </h3>
                                                </div>

                                                <div className="bg-black border border-green-900/30 p-4 h-64 overflow-y-auto font-mono text-[11px] space-y-1 rounded-md shadow-[0_0_15px_rgba(0,255,0,0.05)]">
                                                    {syncLogs.length === 0 && <p className="text-green-900 animate-pulse">_initializing_uplink...</p>}
                                                    {syncLogs.map((log) => (
                                                        <div key={log._id} className="flex gap-3 font-mono opacity-90 hover:opacity-100 transition-opacity">
                                                            <span className="text-neutral-600 shrink-0 select-none">
                                                                {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </span>
                                                            <span className={
                                                                log.level === 'error' ? 'text-red-500' :
                                                                    log.level === 'success' ? 'text-green-400 font-bold' :
                                                                        log.level === 'warning' ? 'text-yellow-500' :
                                                                            'text-green-500/80'
                                                            }>
                                                                <span className="mr-2 opacity-50">{'>'}</span>
                                                                {log.message}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="animate-pulse text-green-500/50 mt-2">_</div>
                                                </div>

                                                <Button
                                                    onClick={handleCloseDialog}
                                                    className="w-full border border-neutral-800 bg-transparent text-[#e5e5e5] hover:bg-neutral-900 hover:text-white transition-colors"
                                                >
                                                    Close & View Dashboard
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Upgrade Prompt Dialog */}
                            <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
                                <DialogContent className="bg-[#0f0f0f] border-neutral-800 sm:max-w-[450px]">
                                    <DialogHeader>
                                        <DialogTitle className="font-serif text-xl text-[#e5e5e5] flex items-center gap-2">
                                            <Crown className="text-yellow-500" size={24} />
                                            Upgrade to Pro
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <p className="text-neutral-400">
                                            You've reached your free channel limit ({subscription?.max_channels || 1} channel).
                                        </p>
                                        <div className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-800/30 p-4 rounded">
                                            <h4 className="font-semibold text-[#e5e5e5] mb-2">Pro Plan - $5/month</h4>
                                            <ul className="text-sm text-neutral-400 space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-purple-400" /> Up to 5 YouTube channels
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-purple-400" /> Unlimited video analysis
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-purple-400" /> AI-powered insights
                                                </li>
                                            </ul>
                                        </div>
                                        <Button
                                            onClick={async () => {
                                                setUpgrading(true);
                                                try {
                                                    const { checkout_url } = await subscriptionApi.createCheckout();
                                                    window.open(checkout_url, '_blank');
                                                    setShowUpgradePrompt(false);
                                                } catch (e) {
                                                    console.error('Checkout failed:', e);
                                                    alert('Failed to open checkout. Please try again.');
                                                } finally {
                                                    setUpgrading(false);
                                                }
                                            }}
                                            disabled={upgrading}
                                            className="w-full bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:from-violet-500 hover:to-purple-400"
                                        >
                                            {upgrading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="mr-2 h-4 w-4" />
                                            )}
                                            Upgrade Now
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
                        <div className="space-y-6">
                            {/* Welcome / Instructions Banner */}
                            <div className="relative border border-neutral-800 p-6">
                                <GridCorner corner="top-left" />
                                <GridCorner corner="top-right" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-serif text-xl text-[#e5e5e5] mb-1">Your Channels</h2>
                                        <p className="text-sm text-neutral-500">
                                            Click on any channel below to view detailed analytics, comments, and AI insights.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setDialogOpen(true)}
                                        className="bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Channel
                                    </Button>
                                </div>
                            </div>

                            {/* Channel Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {channels.map((channel) => (
                                    <Link key={channel.channel_id} href={`/channel/${channel.channel_id}`}>
                                        <div className="group relative border border-neutral-800 p-6 hover:border-neutral-600 hover:bg-white/[0.03] transition-all cursor-pointer">
                                            <GridCorner corner="top-left" />
                                            <GridCorner corner="top-right" />
                                            <GridCorner corner="bottom-left" />
                                            <GridCorner corner="bottom-right" />

                                            {/* Channel Header */}
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={channel.thumbnail_url}
                                                    alt={channel.name}
                                                    className="h-14 w-14 border border-neutral-800 group-hover:border-neutral-600 transition-colors"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-serif text-lg text-[#e5e5e5] truncate group-hover:text-white transition-colors">
                                                        {channel.name}
                                                    </h3>
                                                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">
                                                        {formatNumber(channel.subscriber_count ?? 0)} subscribers
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteChannel(channel.channel_id, e)}
                                                    className="p-2 text-neutral-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete channel"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-800 group-hover:border-neutral-700 transition-colors">
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

                                            {/* Click hint - appears on hover */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <span className="text-xs uppercase tracking-widest text-neutral-400">View Analytics</span>
                                                <TrendingUp className="h-3 w-3 text-neutral-400" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
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
