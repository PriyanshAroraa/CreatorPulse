'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { commentsApi, tagsApi, channelsApi } from '@/lib/api';
import { Comment, Tag, Channel } from '@/lib/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    Filter,
    X,
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

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'negative':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTagColor = (tagName: string) => {
        const tag = tags.find((t) => t.name === tagName);
        return tag?.color || '#6366f1';
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

    return (
        <div className="min-h-screen bg-zinc-950">
            <AppSidebar channelId={channelId} />

            <main className="ml-64 min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6">
                        <div>
                            <h1 className="text-xl font-bold">Comments</h1>
                            <p className="text-sm text-muted-foreground">
                                {total.toLocaleString()} comments found
                            </p>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* Filters */}
                    <Card className="mb-6 bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex flex-1 items-center gap-2">
                                    <Input
                                        placeholder="Search comments..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="max-w-sm"
                                    />
                                    <Button variant="outline" size="icon" onClick={handleSearch}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Select value={sentiment} onValueChange={setSentiment}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sentiment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="positive">Positive</SelectItem>
                                        <SelectItem value="neutral">Neutral</SelectItem>
                                        <SelectItem value="negative">Negative</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={selectedTags} onValueChange={setSelectedTags}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filter by tag" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                >
                                    <BookmarkCheck className="mr-2 h-4 w-4" />
                                    Bookmarked
                                </Button>

                                {hasFilters && (
                                    <Button variant="ghost" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments List */}
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : comments.length === 0 ? (
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="flex h-64 flex-col items-center justify-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">No comments found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <Card key={comment.comment_id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            <Avatar>
                                                <AvatarImage src={comment.author_profile_image} />
                                                <AvatarFallback>
                                                    {comment.author_name.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium">{comment.author_name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(comment.published_at)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={getSentimentColor(comment.sentiment)}
                                                        >
                                                            {comment.sentiment}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleToggleBookmark(comment)}
                                                        >
                                                            {comment.is_bookmarked ? (
                                                                <BookmarkCheck className="h-4 w-4 text-primary" />
                                                            ) : (
                                                                <Bookmark className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <p className="mt-2 whitespace-pre-wrap">{comment.text}</p>

                                                <div className="mt-3 flex items-center gap-4">
                                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <ThumbsUp className="h-4 w-4" />
                                                        {comment.like_count}
                                                    </span>
                                                    {comment.reply_count > 0 && (
                                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <MessageSquare className="h-4 w-4" />
                                                            {comment.reply_count} replies
                                                        </span>
                                                    )}

                                                    {comment.tags.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {comment.tags.map((tag) => (
                                                                <Badge
                                                                    key={tag}
                                                                    variant="secondary"
                                                                    style={{
                                                                        backgroundColor: `${getTagColor(tag)}20`,
                                                                        color: getTagColor(tag),
                                                                        borderColor: getTagColor(tag),
                                                                    }}
                                                                >
                                                                    {tag.replace('_', ' ')}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Pagination */}
                            <div className="flex items-center justify-center gap-2 py-4">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {Math.ceil(total / 50)}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={page >= Math.ceil(total / 50)}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
