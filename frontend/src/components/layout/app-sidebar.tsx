'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    Users,
    FileText,
    Sparkles,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    Activity,
} from 'lucide-react';

// Sidebar context
interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
}

interface AppSidebarProps {
    channelId?: string;
}

export function AppSidebar({ channelId }: AppSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: channelId ? `/channel/${channelId}` : '/',
            icon: <LayoutDashboard className="h-4 w-4" />,
        },
    ];

    const channelNavItems: NavItem[] = channelId
        ? [
            {
                title: 'Comments',
                href: `/channel/${channelId}/comments`,
                icon: <MessageSquare className="h-4 w-4" />,
            },
            {
                title: 'Analytics',
                href: `/channel/${channelId}/analytics`,
                icon: <BarChart3 className="h-4 w-4" />,
            },
            {
                title: 'Community',
                href: `/channel/${channelId}/community`,
                icon: <Users className="h-4 w-4" />,
            },
            {
                title: 'Reports',
                href: `/channel/${channelId}/reports`,
                icon: <FileText className="h-4 w-4" />,
            },
            {
                title: 'AI Chat',
                href: `/channel/${channelId}/chat`,
                icon: <Sparkles className="h-4 w-4" />,
                badge: 'AI',
            },
        ]
        : [];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(href + '/');
    };

    const NavLink = ({ item }: { item: NavItem }) => {
        const active = isActive(item.href);

        const linkContent = (
            <Link
                href={item.href}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    'hover:bg-zinc-800/50',
                    active
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white',
                    isCollapsed && 'justify-center px-2'
                )}
            >
                <span className={cn(active && 'text-emerald-400')}>{item.icon}</span>
                {!isCollapsed && (
                    <>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                                {item.badge}
                            </span>
                        )}
                    </>
                )}
            </Link>
        );

        if (isCollapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                        <p>{item.title}</p>
                    </TooltipContent>
                </Tooltip>
            );
        }

        return linkContent;
    };

    return (
        <TooltipProvider>
            <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
                <aside
                    className={cn(
                        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300',
                        isCollapsed ? 'w-16' : 'w-64'
                    )}
                >
                    {/* Logo */}
                    <div className={cn(
                        'flex h-16 items-center border-b border-zinc-800 px-4',
                        isCollapsed ? 'justify-center' : 'gap-3'
                    )}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="font-bold text-white">CreatorPulse</span>
                                <span className="text-[10px] text-zinc-500">YouTube Analytics</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                        {/* Main Nav */}
                        {mainNavItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}

                        {/* Channel Nav */}
                        {channelNavItems.length > 0 && (
                            <>
                                {!isCollapsed && (
                                    <div className="mt-6 mb-2 px-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                            Channel
                                        </p>
                                    </div>
                                )}
                                {isCollapsed && <div className="my-4 border-t border-zinc-800" />}
                                {channelNavItems.map((item) => (
                                    <NavLink key={item.href} item={item} />
                                ))}
                            </>
                        )}
                    </nav>

                    {/* Collapse Button */}
                    <div className="border-t border-zinc-800 p-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                'w-full text-zinc-400 hover:text-white hover:bg-zinc-800',
                                isCollapsed && 'px-2'
                            )}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Collapse
                                </>
                            )}
                        </Button>
                    </div>
                </aside>
            </SidebarContext.Provider>
        </TooltipProvider>
    );
}

// Mobile sidebar
export function MobileSidebar({ channelId }: AppSidebarProps) {
    const pathname = usePathname();

    const navItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: channelId ? `/channel/${channelId}` : '/',
            icon: <LayoutDashboard className="h-4 w-4" />,
        },
        ...(channelId
            ? [
                {
                    title: 'Comments',
                    href: `/channel/${channelId}/comments`,
                    icon: <MessageSquare className="h-4 w-4" />,
                },
                {
                    title: 'Analytics',
                    href: `/channel/${channelId}/analytics`,
                    icon: <BarChart3 className="h-4 w-4" />,
                },
                {
                    title: 'Community',
                    href: `/channel/${channelId}/community`,
                    icon: <Users className="h-4 w-4" />,
                },
                {
                    title: 'Reports',
                    href: `/channel/${channelId}/reports`,
                    icon: <FileText className="h-4 w-4" />,
                },
                {
                    title: 'AI Chat',
                    href: `/channel/${channelId}/chat`,
                    icon: <Sparkles className="h-4 w-4" />,
                },
            ]
            : []),
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-zinc-950 border-zinc-800 p-0">
                <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-white">CreatorPulse</span>
                </div>
                <nav className="p-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                isActive(item.href)
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            )}
                        >
                            {item.icon}
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
