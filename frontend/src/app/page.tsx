'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { channelsApi } from '@/lib/api';
import { Channel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppSidebar } from '@/components/layout/app-sidebar';
import {
  Plus,
  Loader2,
  Youtube,
  MessageSquare,
  Video,
  RefreshCw,
  ArrowRight,
  Zap,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingChannel, setAddingChannel] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setAddingChannel(true);
    try {
      const channel = await channelsApi.add(channelUrl);
      setChannels((prev) => [channel, ...prev]);
      setChannelUrl('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to add channel:', error);
      alert('Failed to add channel. Please check the URL and try again.');
    } finally {
      setAddingChannel(false);
    }
  };

  const handleSync = async (channelId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await channelsApi.sync(channelId);
      setChannels((prev) =>
        prev.map((ch) =>
          ch.channel_id === channelId ? { ...ch, sync_status: 'syncing' } : ch
        )
      );
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  };

  const totalComments = channels.reduce((acc, ch) => acc + (ch.total_comments || 0), 0);
  const totalVideos = channels.reduce((acc, ch) => acc + (ch.total_videos_analyzed || 0), 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <AppSidebar />

      {/* Main Content */}
      <main className="ml-64 min-h-screen transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="flex h-full items-center justify-between px-8">
            <div>
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
              <p className="text-sm text-zinc-500">Welcome back</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300">Local AI</span>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Channel
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add YouTube Channel</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Paste a channel URL to start analyzing
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="youtube.com/@channel"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                    <Button
                      onClick={handleAddChannel}
                      disabled={addingChannel || !channelUrl.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {addingChannel ? (
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
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Channels</p>
                    <p className="text-3xl font-bold text-white">{channels.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Youtube className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Comments</p>
                    <p className="text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
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
                    <p className="text-sm text-zinc-500 mb-1">Videos</p>
                    <p className="text-3xl font-bold text-white">{totalVideos}</p>
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
                    <p className="text-sm text-zinc-500 mb-1">Processing</p>
                    <p className="text-3xl font-bold text-emerald-400">Local</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channels Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Your Channels</h2>
              <p className="text-sm text-zinc-500">Select a channel to view analytics</p>
            </div>
          </div>

          {channels.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 mb-4">
                  <Youtube className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No channels yet</h3>
                <p className="text-zinc-500 text-center max-w-sm mb-6">
                  Add your first YouTube channel to start analyzing comments
                </p>
                <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Channel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels.map((channel) => (
                <Link key={channel.channel_id} href={`/channel/${channel.channel_id}`}>
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        {channel.thumbnail_url ? (
                          <img
                            src={channel.thumbnail_url}
                            alt={channel.name}
                            className="h-12 w-12 rounded-full ring-2 ring-zinc-800 group-hover:ring-emerald-500/30"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                            <Youtube className="h-6 w-6 text-zinc-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{channel.name}</h3>
                          <p className="text-sm text-zinc-500">
                            {channel.subscriber_count?.toLocaleString()} subscribers
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            {channel.total_comments.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Video className="h-4 w-4" />
                            {channel.total_videos_analyzed}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {channel.sync_status === 'completed' && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                              Synced
                            </Badge>
                          )}
                          {channel.sync_status === 'syncing' && (
                            <Badge className="bg-amber-500/10 text-amber-400 border-0 animate-pulse text-xs">
                              Syncing
                            </Badge>
                          )}
                          {(channel.sync_status === 'pending' || !channel.sync_status) && (
                            <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                              Pending
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-zinc-800"
                            onClick={(e) => handleSync(channel.channel_id, e)}
                            disabled={channel.sync_status === 'syncing'}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${channel.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 text-sm">
                        <span className="text-zinc-500">View Analytics</span>
                        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
