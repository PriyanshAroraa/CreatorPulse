'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useChannel, useSentiment, useTrends, useTopVideos, useTags } from '@/hooks/use-cached-data';
import { GridCorner } from '@/components/ui/grid-corner';
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
    ArrowLeft,
} from 'lucide-react';

export default function AnalyticsPage() {
    const params = useParams();
    const channelId = params.channel_id as string;
    const [days, setDays] = useState('30');
    const [hoveredPoint, setHoveredPoint] = useState<{ day: { date: string; total: number; positive?: number; negative?: number; neutral?: number }; x: number; y: number } | null>(null);

    // SWR hooks for cached data fetching - instant on subsequent visits
    const { data: channel, isLoading: channelLoading } = useChannel(channelId);
    const { data: sentiment, isLoading: sentimentLoading } = useSentiment(channelId);
    const { data: trends = [], isLoading: trendsLoading } = useTrends(channelId, parseInt(days));
    const { data: topVideos = [], isLoading: videosLoading } = useTopVideos(channelId, 10);
    const { data: tagBreakdown = {}, isLoading: tagsLoading } = useTags(channelId);

    const loading = channelLoading || sentimentLoading || trendsLoading || videosLoading || tagsLoading;

    if (loading && !channel) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    const maxTrendValue = Math.max(...trends.map((t) => t.total), 1);

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
                            <BarChart3 className="h-5 w-5 text-neutral-500" />
                            <h1 className="font-serif text-lg text-[#e5e5e5]">Analytics</h1>
                        </div>
                    </div>

                    <Select value={days} onValueChange={setDays}>
                        <SelectTrigger className="w-40 bg-[#0f0f0f] border-neutral-800 text-neutral-400">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f0f0f] border-neutral-800">
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <div className="p-8">
                {/* Sentiment & Tags Grid */}
                <div className="grid gap-0 lg:grid-cols-2 border border-neutral-800 mb-8">
                    {/* Sentiment Distribution */}
                    <div className="relative p-8 border-b lg:border-b-0 lg:border-r border-neutral-800">
                        <GridCorner corner="top-left" />
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="h-5 w-5 text-neutral-500" />
                            <h3 className="font-serif text-xl text-[#e5e5e5]">Sentiment Distribution</h3>
                        </div>

                        {sentiment && (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ThumbsUp className="h-4 w-4 text-neutral-400" />
                                            <span className="text-sm text-neutral-400">Positive</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg text-[#e5e5e5]">
                                                {sentiment.breakdown.positive.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 px-2 py-0.5">
                                                {sentiment.percentages.positive}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 overflow-hidden bg-neutral-800 rounded-full">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${sentiment.percentages.positive}%`,
                                                background: 'linear-gradient(90deg, #06b6d4, #22d3ee)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border border-neutral-600" />
                                            <span className="text-sm text-neutral-400">Neutral</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg text-[#e5e5e5]">
                                                {sentiment.breakdown.neutral.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 px-2 py-0.5">
                                                {sentiment.percentages.neutral}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 overflow-hidden bg-neutral-800 rounded-full">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${sentiment.percentages.neutral}%`,
                                                background: 'linear-gradient(90deg, #525252, #737373)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ThumbsDown className="h-4 w-4 text-neutral-500" />
                                            <span className="text-sm text-neutral-400">Negative</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-serif text-lg text-[#e5e5e5]">
                                                {sentiment.breakdown.negative.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-neutral-600 border border-neutral-800 px-2 py-0.5">
                                                {sentiment.percentages.negative}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 overflow-hidden bg-neutral-800 rounded-full">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${sentiment.percentages.negative}%`,
                                                background: 'linear-gradient(90deg, #ef4444, #f87171)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 text-center text-[10px] uppercase tracking-widest text-neutral-600">
                                    Total: {sentiment.total.toLocaleString()} comments analyzed
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tag Distribution */}
                    <div className="relative p-8">
                        <GridCorner corner="top-right" />
                        <div className="flex items-center gap-2 mb-6">
                            <Tag className="h-5 w-5 text-neutral-500" />
                            <h3 className="font-serif text-xl text-[#e5e5e5]">Tag Distribution</h3>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(tagBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 8)
                                .map(([tag, count]) => (
                                    <div key={tag} className="flex items-center gap-3">
                                        <span className="w-40 truncate text-sm text-neutral-400 capitalize">
                                            {tag.replace('_', ' ')}
                                        </span>
                                        <div className="flex-1">
                                            <div className="h-2 overflow-hidden bg-neutral-800 rounded-full">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${(count / Math.max(...Object.values(tagBreakdown))) * 100}%`,
                                                        background: 'linear-gradient(90deg, #525252, #737373)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <span className="font-serif text-sm text-[#e5e5e5]">{count}</span>
                                    </div>
                                ))}

                            {Object.keys(tagBreakdown).length === 0 && (
                                <p className="py-8 text-center text-neutral-600">
                                    No tags found. Sync comments to see tag analytics.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trends Chart */}
                <div className="relative border border-neutral-800 p-8 mb-8">
                    <GridCorner corner="top-left" />
                    <GridCorner corner="top-right" />
                    <GridCorner corner="bottom-left" />
                    <GridCorner corner="bottom-right" />

                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="h-5 w-5 text-neutral-500" />
                        <h3 className="font-serif text-xl text-[#e5e5e5]">Comment Activity (Last {days} days)</h3>
                    </div>

                    {trends.length > 0 ? (
                        <div className="h-64 relative" onMouseLeave={() => setHoveredPoint(null)}>
                            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                                {/* Grid lines */}
                                <line x1="0" y1="50" x2="800" y2="50" stroke="#262626" strokeWidth="1" strokeDasharray="4" />
                                <line x1="0" y1="100" x2="800" y2="100" stroke="#262626" strokeWidth="1" strokeDasharray="4" />
                                <line x1="0" y1="150" x2="800" y2="150" stroke="#262626" strokeWidth="1" strokeDasharray="4" />

                                {/* Area fill with vibrant gradient */}
                                <path
                                    d={`M0,200 ${trends.map((day, i) => {
                                        const x = (i / (trends.length - 1)) * 800;
                                        const y = 200 - (maxTrendValue > 0 ? (day.total / maxTrendValue) * 180 : 0);
                                        return `L${x},${y}`;
                                    }).join(' ')} L800,200 Z`}
                                    fill="url(#areaGradient)"
                                />

                                {/* Line with glow effect */}
                                <path
                                    d={`M${trends.map((day, i) => {
                                        const x = (i / (trends.length - 1)) * 800;
                                        const y = 200 - (maxTrendValue > 0 ? (day.total / maxTrendValue) * 180 : 0);
                                        return `${x},${y}`;
                                    }).join(' L')}`}
                                    fill="none"
                                    stroke="url(#lineGradient)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter="url(#glow)"
                                />

                                {/* Data points */}
                                {trends.map((day, i) => {
                                    const x = (i / (trends.length - 1)) * 800;
                                    const y = 200 - (maxTrendValue > 0 ? (day.total / maxTrendValue) * 180 : 0);
                                    const isHovered = hoveredPoint?.day.date === day.date;
                                    return (
                                        <g
                                            key={day.date}
                                            className="cursor-pointer"
                                            onMouseEnter={() => setHoveredPoint({ day, x, y })}
                                        >
                                            <circle cx={x} cy={y} r="16" fill="transparent" />
                                            <circle
                                                cx={x} cy={y} r={isHovered ? 6 : 4}
                                                fill={isHovered ? "#22d3ee" : "#06b6d4"}
                                                className="transition-all duration-150"
                                            />
                                            {isHovered && (
                                                <circle
                                                    cx={x} cy={y} r="10"
                                                    fill="transparent"
                                                    stroke="#22d3ee"
                                                    strokeWidth="2"
                                                    strokeOpacity="0.5"
                                                />
                                            )}
                                        </g>
                                    );
                                })}

                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="50%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="1" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                            </svg>

                            {/* Custom Tooltip */}
                            {hoveredPoint && (
                                <div
                                    className="absolute pointer-events-none z-10 bg-[#1a1a1a] border border-neutral-700 px-4 py-3 shadow-xl"
                                    style={{
                                        left: `${(hoveredPoint.x / 800) * 100}%`,
                                        top: `${(hoveredPoint.y / 200) * 100}%`,
                                        transform: `translate(${hoveredPoint.x > 600 ? '-100%' : hoveredPoint.x < 200 ? '0%' : '-50%'}, -120%)`,
                                    }}
                                >
                                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                                        {hoveredPoint.day.date}
                                    </div>
                                    <div className="font-serif text-xl text-[#e5e5e5]">
                                        {hoveredPoint.day.total.toLocaleString()}
                                        <span className="text-xs text-neutral-500 ml-2">comments</span>
                                    </div>
                                    {hoveredPoint.day.positive !== undefined && (
                                        <div className="flex gap-3 mt-2 text-xs">
                                            <span className="text-cyan-400">+{hoveredPoint.day.positive}</span>
                                            <span className="text-neutral-500">{hoveredPoint.day.neutral}</span>
                                            <span className="text-neutral-400">-{hoveredPoint.day.negative}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 flex justify-between text-[10px] uppercase tracking-widest text-neutral-600">
                                <span>{trends[0]?.date}</span>
                                <span className="text-cyan-500">Peak: {maxTrendValue.toLocaleString()} comments</span>
                                <span>{trends[trends.length - 1]?.date}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-neutral-600">
                            No trend data available. Sync comments to see trends.
                        </p>
                    )}
                </div>

                {/* Top Videos */}
                <div className="relative border border-neutral-800">
                    <div className="p-4 border-b border-neutral-800">
                        <GridCorner corner="top-left" />
                        <GridCorner corner="top-right" />
                        <div className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-neutral-500" />
                            <h3 className="font-serif text-xl text-[#e5e5e5]">Top Videos by Comments</h3>
                        </div>
                    </div>

                    <div>
                        {topVideos.map((video, index) => (
                            <div key={video.video_id} className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${index !== topVideos.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                                <span className="font-serif text-lg text-neutral-600 w-8 text-center">
                                    {String(index + 1).padStart(2, '0')}
                                </span>

                                {video.thumbnail_url && (
                                    <img
                                        src={video.thumbnail_url}
                                        alt={video.title}
                                        className="h-12 w-20 object-cover border border-neutral-800"
                                    />
                                )}

                                <div className="flex-1">
                                    <p className="line-clamp-1 text-[#e5e5e5]">{video.title}</p>
                                    <div className="flex items-center gap-4 text-xs text-neutral-600 mt-1">
                                        <span>{video.comment_count.toLocaleString()} comments</span>
                                        <span className="flex items-center gap-1">
                                            <ThumbsUp className="h-3 w-3" />
                                            {video.positive_count}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ThumbsDown className="h-3 w-3" />
                                            {video.negative_count}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="font-serif text-xl text-[#e5e5e5]">
                                        {video.sentiment_ratio}%
                                    </span>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-600">positive</p>
                                </div>
                            </div>
                        ))}

                        {topVideos.length === 0 && (
                            <p className="py-8 text-center text-neutral-600">
                                No videos yet. Sync comments to see top videos.
                            </p>
                        )}
                    </div>
                    <GridCorner corner="bottom-left" />
                    <GridCorner corner="bottom-right" />
                </div>
            </div>
        </>
    );
}
