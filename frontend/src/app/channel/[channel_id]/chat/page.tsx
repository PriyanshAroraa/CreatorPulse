'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { chatApi, channelsApi } from '@/lib/api';
import { ChatMessage, Channel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GridCorner } from '@/components/ui/grid-corner';
import { Bot, Send, Loader2, Trash2, User, ArrowLeft, Sparkles } from 'lucide-react';

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

        const tempMessage: ChatMessage = {
            user_message: userMessage,
            ai_response: '',
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMessage]);

        try {
            const response = await chatApi.send(channelId, userMessage);
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
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5] flex flex-col">
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
                            <Sparkles className="h-5 w-5 text-neutral-500" />
                            <div>
                                <h1 className="font-serif text-lg text-[#e5e5e5]">AI Chat</h1>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                    Ask about {channel?.name}'s comments
                                </p>
                            </div>
                        </div>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors"
                        >
                            <Trash2 size={14} /> Clear
                        </button>
                    )}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col">
                <ScrollArea ref={scrollRef} className="flex-1 p-8">
                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center py-12">
                            <div className="h-16 w-16 border border-neutral-800 flex items-center justify-center mb-4">
                                <Bot className="h-8 w-8 text-neutral-600" />
                            </div>
                            <h2 className="font-serif text-xl text-[#e5e5e5] mb-2">Start a conversation</h2>
                            <p className="text-neutral-500 text-sm text-center max-w-sm mb-8">
                                Ask questions about comments, sentiments, and insights from this channel.
                            </p>

                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-neutral-600 text-center mb-3">
                                    Try asking:
                                </p>
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInput(question)}
                                        className="block w-full text-left px-4 py-3 border border-neutral-800 text-neutral-400 text-sm hover:bg-white/[0.02] hover:text-[#e5e5e5] transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className="space-y-4">
                                    {/* User Message */}
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center shrink-0">
                                            <User className="h-5 w-5 text-neutral-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-[#e5e5e5]">You</span>
                                                <span className="text-[10px] uppercase tracking-widest text-neutral-600">
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-neutral-300">{msg.user_message}</p>
                                        </div>
                                    </div>

                                    {/* AI Response */}
                                    {msg.ai_response && (
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center shrink-0">
                                                <Bot className="h-5 w-5 text-neutral-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-[#e5e5e5]">AI Assistant</span>
                                                </div>
                                                <div className="p-4 border border-neutral-800 whitespace-pre-wrap text-neutral-300">
                                                    {msg.ai_response}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Loading indicator */}
                                    {!msg.ai_response && loading && index === messages.length - 1 && (
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center shrink-0">
                                                <Bot className="h-5 w-5 text-neutral-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-[#e5e5e5]">AI Assistant</span>
                                                </div>
                                                <div className="p-4 border border-neutral-800 flex items-center gap-2 text-neutral-500">
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
                <div className="relative border-t border-neutral-800 bg-[#0f0f0f] p-4">
                    <GridCorner corner="bottom-left" />
                    <GridCorner corner="bottom-right" />
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
                            className="min-h-[60px] resize-none bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5] placeholder:text-neutral-600"
                            disabled={loading}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="h-auto bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white"
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
        </div>
    );
}
