'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GridCorner } from '@/components/ui/grid-corner';
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
    ChevronLeft,
    ChevronRight,
    Menu,
    Plus,
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
                {/* Logo Section */}
                <div className={cn(
                    'relative flex h-16 items-center border-b border-neutral-800 px-4',
                    isCollapsed ? 'justify-center' : 'gap-3'
                )}>
                    <GridCorner corner="top-left" />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-700">
                        <Plus className="h-4 w-4 text-neutral-400" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-serif text-lg text-[#e5e5e5]">CreatorPulse</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">Analytics Platform</span>
                        </div>
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
                            {!isCollapsed && (
                                <div className="mt-6 mb-2 px-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                                        Channel
                                    </p>
                                </div>
                            )}
                            {isCollapsed && <div className="my-4 border-t border-neutral-800" />}
                            {channelNavItems.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </>
                    )}
                </nav>

                {/* Version / Collapse Button */}
                <div className="border-t border-neutral-800 p-3">
                    {!isCollapsed && (
                        <div className="mb-3 px-1">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                System v0.1
                            </p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            'w-full text-neutral-500 hover:text-[#e5e5e5] hover:bg-white/[0.02] border border-neutral-800',
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
