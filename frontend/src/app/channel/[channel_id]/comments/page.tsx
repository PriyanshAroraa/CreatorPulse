'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { commentsApi, tagsApi, channelsApi } from '@/lib/api';
import { Comment, Tag, Channel } from '@/lib/types';
import { AppSidebar, MainContent } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GridCorner } from '@/components/ui/grid-corner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    Bookmark,
    BookmarkCheck,
    ThumbsUp,
    MessageSquare,
    Loader2,
    X,
    ArrowLeft,
    Video,
} from 'lucide-react';

export default function CommentsPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Filters
    const [sentiment, setSentiment] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [channelId]);

    useEffect(() => {
        loadComments();
    }, [channelId, page, sentiment, selectedTags, bookmarkedOnly]);

    const loadInitialData = async () => {
        try {
            const [channelData, tagsData] = await Promise.all([
                channelsApi.get(channelId),
                tagsApi.list(),
            ]);
            setChannel(channelData);
            setTags(tagsData);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    };

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await commentsApi.listByChannel(channelId, {
                sentiment: sentiment || undefined,
                tags: selectedTags || undefined,
                isBookmarked: bookmarkedOnly ? true : undefined,
                search: search || undefined,
                page,
                limit: 50,
            });
            setComments(data.items);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadComments();
    };

    const handleToggleBookmark = async (comment: Comment) => {
        try {
            await commentsApi.toggleBookmark(comment.comment_id, !comment.is_bookmarked);
            setComments((prev) =>
                prev.map((c) =>
                    c.comment_id === comment.comment_id
                        ? { ...c, is_bookmarked: !c.is_bookmarked }
                        : c
                )
            );
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
        }
    };

    const getSentimentStyle = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive':
                return 'border-neutral-600 text-neutral-300';
            case 'negative':
                return 'border-neutral-700 text-neutral-400';
            default:
                return 'border-neutral-800 text-neutral-500';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const clearFilters = () => {
        setSentiment('');
        setSelectedTags('');
        setSearch('');
        setBookmarkedOnly(false);
        setPage(1);
    };

    const hasFilters = sentiment || selectedTags || search || bookmarkedOnly;

    if (loading && comments.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
            <AppSidebar channelId={channelId} />

            <MainContent>
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
                            <div>
                                <h1 className="font-serif text-lg text-[#e5e5e5]">Comments</h1>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                    {total.toLocaleString()} total
                                </p>
                            </div>
                        </div>

                        <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-bold hidden md:block">
                            Comments Browser / v0.1
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Filters */}
                    <div className="relative border border-neutral-800 p-6 mb-6">
                        <GridCorner corner="top-left" />
                        <GridCorner corner="top-right" />
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-1 items-center gap-2">
                                <Input
                                    placeholder="Search comments..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="max-w-sm bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5] placeholder:text-neutral-600"
                                />
                                <Button variant="outline" size="icon" onClick={handleSearch} className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02]">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>

                            <Select value={sentiment} onValueChange={setSentiment}>
                                <SelectTrigger className="w-40 bg-[#0f0f0f] border-neutral-800 text-neutral-400">
                                    <SelectValue placeholder="Sentiment" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-neutral-800">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="neutral">Neutral</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedTags} onValueChange={setSelectedTags}>
                                <SelectTrigger className="w-48 bg-[#0f0f0f] border-neutral-800 text-neutral-400">
                                    <SelectValue placeholder="Filter by tag" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f0f] border-neutral-800">
                                    <SelectItem value="all">All Tags</SelectItem>
                                    {tags.map((tag) => (
                                        <SelectItem key={tag.name} value={tag.name}>
                                            {tag.name.replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant={bookmarkedOnly ? 'default' : 'outline'}
                                onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
                                className={bookmarkedOnly ? 'bg-[#e5e5e5] text-[#0f0f0f]' : 'border-neutral-800 text-neutral-400 hover:bg-white/[0.02]'}
                            >
                                <BookmarkCheck className="mr-2 h-4 w-4" />
                                Bookmarked
                            </Button>

                            {hasFilters && (
                                <Button variant="ghost" onClick={clearFilters} className="text-neutral-500 hover:text-[#e5e5e5]">
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Comments List */}
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="relative border border-neutral-800">
                            <GridCorner corner="top-left" />
                            <GridCorner corner="bottom-right" />
                            <div className="flex h-64 flex-col items-center justify-center">
                                <MessageSquare className="h-12 w-12 text-neutral-600" />
                                <p className="mt-4 text-neutral-500">No comments found</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-0 border border-neutral-800">
                            {comments.map((comment, index) => (
                                <div key={comment.comment_id} className={`p-6 hover:bg-white/[0.02] transition-colors ${index !== comments.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                                    <div className="flex gap-4">
                                        <Avatar className="h-10 w-10 border border-neutral-800">
                                            <AvatarImage src={comment.author_profile_image} />
                                            <AvatarFallback className="bg-[#0f0f0f] text-neutral-500">
                                                {comment.author_name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-[#e5e5e5]">{comment.author_name}</p>
                                                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">
                                                        {formatDate(comment.published_at)}
                                                    </p>
                                                    {comment.video_title && (
                                                        <a
                                                            href={`https://www.youtube.com/watch?v=${comment.video_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                                                        >
                                                            <Video className="h-3 w-3" />
                                                            <span className="truncate max-w-[200px]">{comment.video_title}</span>
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] uppercase tracking-wider border px-2 py-0.5 ${getSentimentStyle(comment.sentiment)}`}>
                                                        {comment.sentiment}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleBookmark(comment)}
                                                        className="h-8 w-8 text-neutral-500 hover:text-[#e5e5e5] hover:bg-white/[0.02]"
                                                    >
                                                        {comment.is_bookmarked ? (
                                                            <BookmarkCheck className="h-4 w-4 text-[#e5e5e5]" />
                                                        ) : (
                                                            <Bookmark className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <p className="mt-3 text-neutral-300 whitespace-pre-wrap">{comment.text}</p>

                                            <div className="mt-4 flex items-center gap-4">
                                                <span className="flex items-center gap-1.5 text-xs text-neutral-600">
                                                    <ThumbsUp className="h-3.5 w-3.5" />
                                                    {comment.like_count}
                                                </span>
                                                {comment.reply_count > 0 && (
                                                    <span className="flex items-center gap-1.5 text-xs text-neutral-600">
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                        {comment.reply_count} replies
                                                    </span>
                                                )}

                                                {comment.tags.length > 0 && (
                                                    <div className="flex gap-1">
                                                        {comment.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-[10px] uppercase tracking-wider border border-neutral-800 px-2 py-0.5 text-neutral-500"
                                                            >
                                                                {tag.replace('_', ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {comments.length > 0 && (
                        <div className="flex items-center justify-center gap-4 py-8">
                            <Button
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02]"
                            >
                                Previous
                            </Button>
                            <span className="text-xs uppercase tracking-widest text-neutral-600">
                                Page {page} of {Math.ceil(total / 50)}
                            </span>
                            <Button
                                variant="outline"
                                disabled={page >= Math.ceil(total / 50)}
                                onClick={() => setPage((p) => p + 1)}
                                className="border-neutral-800 text-neutral-400 hover:bg-white/[0.02]"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </MainContent>
        </div>
    );
}
