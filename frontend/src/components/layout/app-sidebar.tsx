'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GridCorner } from '@/components/ui/grid-corner';
import { useChannels } from '@/contexts/channels-context';
import { Channel } from '@/lib/types';
import { subscriptionApi } from '@/lib/api';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    LayoutDashboard,
    MessageSquare,
    BarChart3,
    Users,
    FileText,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Menu,
    Plus,
    ChevronsUpDown,
    Check,
    LogOut,
    Crown,
    User,
    Loader2,
} from 'lucide-react';

// Sidebar context - exported for use in pages
interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

// Provider component to wrap the app
interface SidebarProviderProps {
    children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

// Main content wrapper that responds to sidebar state
interface MainContentProps {
    children: ReactNode;
    className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
    const { isCollapsed } = useSidebar();

    return (
        <main
            className={cn(
                'min-h-screen transition-all duration-300',
                isCollapsed ? 'ml-16' : 'ml-64',
                className
            )}
        >
            {children}
        </main>
    );
}

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
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [upgrading, setUpgrading] = useState(false);

    // Use cached channels from context instead of local API call
    const { channels, loadChannels } = useChannels();
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

    useEffect(() => {
        // Load channels only once on mount (cached)
        loadChannels();
    }, [loadChannels]);

    useEffect(() => {
        // Update current channel when channelId or channels change
        if (channelId && channels.length > 0) {
            const current = channels.find(c => c.channel_id === channelId);
            if (current) setCurrentChannel(current);
        }
    }, [channelId, channels]);

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: channelId ? `/channel/${channelId}` : '/dashboard',
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
        if (href === '/dashboard') return pathname === '/dashboard';

        // Strictly match channel root
        if (channelId && href === `/channel/${channelId}`) {
            return pathname === href;
        }

        return pathname === href || pathname.startsWith(href + '/');
    };

    const NavLink = ({ item }: { item: NavItem }) => {
        const active = isActive(item.href);

        const linkContent = (
            <Link
                href={item.href}
                className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all border-l-2',
                    'hover:bg-white/[0.02] hover:border-neutral-600',
                    active
                        ? 'bg-white/[0.02] border-[#e5e5e5] text-[#e5e5e5]'
                        : 'border-transparent text-neutral-500 hover:text-[#e5e5e5]',
                    isCollapsed && 'justify-center px-2 border-l-0'
                )}
            >
                <span className={cn(active && 'text-[#e5e5e5]')}>{item.icon}</span>
                {!isCollapsed && (
                    <>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                            <span className="border border-neutral-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
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
                    <TooltipContent side="right" className="bg-[#0f0f0f] text-[#e5e5e5] border-neutral-800">
                        <p>{item.title}</p>
                    </TooltipContent>
                </Tooltip>
            );
        }

        return linkContent;
    };

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-800 bg-[#0f0f0f] transition-all duration-300',
                    isCollapsed ? 'w-16' : 'w-64'
                )}
            >
                {/* Logo / Dropdown Section + Collapse Button */}
                <div className={cn(
                    'relative flex h-16 items-center border-b border-neutral-800 px-4',
                    isCollapsed ? 'justify-center' : 'justify-between'
                )}>
                    <GridCorner corner="top-left" />

                    {isCollapsed ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-700">
                            {currentChannel?.thumbnail_url ? (
                                <img src={currentChannel.thumbnail_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <Plus className="h-4 w-4 text-neutral-400" />
                            )}
                        </div>
                    ) : (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex-1 justify-between px-2 hover:bg-white/[0.02] h-auto py-2"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden text-left">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-700 overflow-hidden">
                                                {currentChannel?.thumbnail_url ? (
                                                    <img src={currentChannel.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Plus className="h-4 w-4 text-neutral-400" />
                                                )}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="font-serif text-base text-[#e5e5e5] truncate leading-none mb-1">
                                                    {currentChannel ? currentChannel.name : 'CreatorPulse'}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                                    {currentChannel ? 'Channel' : 'Platform'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5]">
                                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-neutral-500">
                                        Switch Channel
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-neutral-800" />
                                    <DropdownMenuItem
                                        className="cursor-pointer focus:bg-white/[0.05] focus:text-[#e5e5e5]"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 border border-neutral-700 flex items-center justify-center">
                                                <LayoutDashboard className="h-3 w-3" />
                                            </div>
                                            <span>All Channels</span>
                                        </div>
                                        {!currentChannel && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-neutral-800" />
                                    {channels.map((channel) => (
                                        <DropdownMenuItem
                                            key={channel.channel_id}
                                            className="cursor-pointer focus:bg-white/[0.05] focus:text-[#e5e5e5]"
                                            onClick={() => router.push(`/channel/${channel.channel_id}`)}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <img
                                                    src={channel.thumbnail_url}
                                                    alt=""
                                                    className="h-6 w-6 border border-neutral-700 object-cover"
                                                />
                                                <span className="truncate">{channel.name}</span>
                                                {currentChannel?.channel_id === channel.channel_id && (
                                                    <Check className="ml-auto h-4 w-4 shrink-0" />
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator className="bg-neutral-800" />
                                    <DropdownMenuItem
                                        className="cursor-pointer focus:bg-white/[0.05] focus:text-[#e5e5e5]"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Channel
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Collapse button in header */}
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsCollapsed(!isCollapsed)}
                                        className="ml-2 h-8 w-8 shrink-0 text-neutral-500 hover:text-[#e5e5e5] hover:bg-white/[0.02]"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-[#0f0f0f] text-[#e5e5e5] border-neutral-800">
                                    <p>Collapse sidebar</p>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}

                    {/* Expand button when collapsed */}
                    {isCollapsed && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCollapsed(false)}
                                    className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#0f0f0f] border border-neutral-700 text-neutral-500 hover:text-[#e5e5e5] hover:bg-neutral-800"
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-[#0f0f0f] text-[#e5e5e5] border-neutral-800">
                                <p>Expand sidebar</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 space-y-1">
                    {/* Main Nav */}
                    {!isCollapsed && (
                        <div className="mb-2 px-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                                Navigation
                            </p>
                        </div>
                    )}
                    {mainNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}

                    {/* Channel Nav */}
                    {channelNavItems.length > 0 && (
                        <>
                            {isCollapsed && <div className="my-4 border-t border-neutral-800" />}
                            {channelNavItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </>
                    )}
                </nav>

                {/* Profile / Account Section - matches channel dropdown style */}
                <div className={cn(
                    'relative flex h-16 items-center border-t border-neutral-800 px-4',
                    isCollapsed ? 'justify-center' : ''
                )}>
                    {isCollapsed ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-700 overflow-hidden">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-neutral-800 flex items-center justify-center">
                                            <User className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-[#0f0f0f] text-[#e5e5e5] border-neutral-800">
                                <p>{session?.user?.name || 'Account'}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between px-2 hover:bg-white/[0.02] h-auto py-2"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden text-left">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-700 overflow-hidden">
                                            {session?.user?.image ? (
                                                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-neutral-800 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-neutral-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="font-serif text-base text-[#e5e5e5] truncate leading-none mb-1">
                                                {session?.user?.name || 'Account'}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                                Free Plan
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-56 bg-[#0f0f0f] border-neutral-800 p-0"
                                side="top"
                                align="start"
                            >
                                <div className="p-3 border-b border-neutral-800">
                                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                                        Account
                                    </p>
                                    <p className="text-sm text-[#e5e5e5] mt-1 truncate">
                                        {session?.user?.email || 'Not signed in'}
                                    </p>
                                </div>

                                <div className="p-2 space-y-1">
                                    <div className="px-2 py-2 text-sm text-neutral-400">
                                        <div className="flex items-center justify-between">
                                            <span>Current Plan</span>
                                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">
                                                Free
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-neutral-500 mt-1">
                                            1/1 channels used
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start gap-2 text-neutral-400 hover:text-[#e5e5e5] hover:bg-white/[0.02]"
                                        disabled={upgrading}
                                        onClick={async () => {
                                            setUpgrading(true);
                                            try {
                                                const { checkout_url } = await subscriptionApi.createCheckout(session?.user?.email || '');
                                                window.open(checkout_url, '_blank');
                                            } catch (e) {
                                                console.error('Checkout failed:', e);
                                                alert('Failed to open checkout. Please try again.');
                                            } finally {
                                                setUpgrading(false);
                                            }
                                        }}
                                    >
                                        {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                                        {upgrading ? 'Loading...' : 'Upgrade to Pro'}
                                    </Button>

                                    <div className="border-t border-neutral-800 my-1" />

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start gap-2 text-neutral-400 hover:text-[#e5e5e5] hover:bg-white/[0.02]"
                                        onClick={() => router.push('/api/auth/signout')}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </aside>
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
                <Button variant="ghost" size="icon" className="md:hidden border border-neutral-800">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#0f0f0f] border-neutral-800 p-0">
                <div className="flex h-16 items-center gap-3 border-b border-neutral-800 px-4">
                    <div className="flex h-8 w-8 items-center justify-center border border-neutral-700">
                        <Plus className="h-4 w-4 text-neutral-400" />
                    </div>
                    <span className="font-serif text-lg text-[#e5e5e5]">CreatorPulse</span>
                </div>
                <nav className="p-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all border-l-2',
                                isActive(item.href)
                                    ? 'bg-white/[0.02] border-[#e5e5e5] text-[#e5e5e5]'
                                    : 'border-transparent text-neutral-500 hover:bg-white/[0.02] hover:text-[#e5e5e5]'
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
