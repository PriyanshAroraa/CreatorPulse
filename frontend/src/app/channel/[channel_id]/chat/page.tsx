'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { chatApi, channelsApi } from '@/lib/api';
import { ChatMessage, Channel } from '@/lib/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, Loader2, Trash2, User } from 'lucide-react';

export default function ChatPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [channelId]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadData = async () => {
        try {
            const [channelData, historyData] = await Promise.all([
                channelsApi.get(channelId),
                chatApi.getHistory(channelId),
            ]);
            setChannel(channelData);
            setMessages(historyData);
        } catch (error) {
            console.error('Failed to load chat:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setLoading(true);

        // Optimistically add user message
        const tempMessage: ChatMessage = {
            user_message: userMessage,
            ai_response: '',
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMessage]);

        try {
            const response = await chatApi.send(channelId, userMessage);

            // Update the last message with AI response
            setMessages((prev) => [
                ...prev.slice(0, -1),
                {
                    ...tempMessage,
                    ai_response: response.response,
                    timestamp: response.timestamp,
                },
            ]);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Update with error
            setMessages((prev) => [
                ...prev.slice(0, -1),
                {
                    ...tempMessage,
                    ai_response: 'Sorry, I encountered an error. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear the chat history?')) return;

        try {
            await chatApi.clearHistory(channelId);
            setMessages([]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const suggestedQuestions = [
        "What are the most common complaints from viewers?",
        "What content ideas are viewers suggesting?",
        "Which videos have the most positive reception?",
        "Are there any collaboration requests?",
        "What do viewers appreciate most?",
    ];

    if (initialLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <AppSidebar channelId={channelId} />

            <main className="ml-64 flex min-h-screen flex-col transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <Bot className="h-6 w-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-bold">AI Chat</h1>
                                <p className="text-sm text-muted-foreground">
                                    Ask questions about {channel?.name}'s comments
                                </p>
                            </div>
                        </div>

                        {messages.length > 0 && (
                            <Button variant="outline" size="sm" onClick={handleClearHistory}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear History
                            </Button>
                        )}
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex flex-1 flex-col">
                    <ScrollArea ref={scrollRef} className="flex-1 p-6">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center">
                                <Bot className="h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">Start a conversation</h2>
                                <p className="mt-2 text-center text-muted-foreground">
                                    Ask questions about comments, sentiments, and insights from this channel.
                                </p>

                                <div className="mt-6 grid gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Try asking:
                                    </p>
                                    {suggestedQuestions.map((question, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            className="justify-start text-left"
                                            onClick={() => setInput(question)}
                                        >
                                            {question}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((msg, index) => (
                                    <div key={index} className="space-y-4">
                                        {/* User Message */}
                                        <div className="flex gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">You</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="mt-1">{msg.user_message}</p>
                                            </div>
                                        </div>

                                        {/* AI Response */}
                                        {msg.ai_response && (
                                            <div className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-500 text-white">
                                                        <Bot className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">AI Assistant</span>
                                                    </div>
                                                    <div className="mt-1 whitespace-pre-wrap rounded-lg bg-muted p-3">
                                                        {msg.ai_response}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Loading indicator for pending response */}
                                        {!msg.ai_response && loading && index === messages.length - 1 && (
                                            <div className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-500 text-white">
                                                        <Bot className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">AI Assistant</span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-muted p-3">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span>Thinking...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t bg-background p-4">
                        <div className="mx-auto flex max-w-3xl gap-2">
                            <Textarea
                                placeholder="Ask a question about the comments..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                className="min-h-[60px] resize-none"
                                disabled={loading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="h-auto"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
