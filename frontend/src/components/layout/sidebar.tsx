'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    Users,
    FileText,
    Bot,
    Settings,
    Youtube,
} from 'lucide-react';

interface SidebarProps {
    channelId?: string;
}

export function Sidebar({ channelId }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            title: 'Dashboard',
            href: channelId ? `/channel/${channelId}` : '/',
            icon: LayoutDashboard,
        },
        {
            title: 'Comments',
            href: channelId ? `/channel/${channelId}/comments` : '#',
            icon: MessageSquare,
            disabled: !channelId,
        },
        {
            title: 'Analytics',
            href: channelId ? `/channel/${channelId}/analytics` : '#',
            icon: BarChart3,
            disabled: !channelId,
        },
        {
            title: 'Community',
            href: channelId ? `/channel/${channelId}/community` : '#',
            icon: Users,
            disabled: !channelId,
        },
        {
            title: 'Reports',
            href: channelId ? `/channel/${channelId}/reports` : '#',
            icon: FileText,
            disabled: !channelId,
        },
        {
            title: 'AI Chat',
            href: channelId ? `/channel/${channelId}/chat` : '#',
            icon: Bot,
            disabled: !channelId,
        },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
            <div className="flex h-16 items-center gap-2 border-b px-6">
                <Youtube className="h-6 w-6 text-red-500" />
                <span className="text-lg font-bold">Comment Analyzer</span>
            </div>

            <nav className="space-y-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.disabled ? '#' : item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                item.disabled && 'pointer-events-none opacity-50'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            </div>
        </aside>
    );
}
