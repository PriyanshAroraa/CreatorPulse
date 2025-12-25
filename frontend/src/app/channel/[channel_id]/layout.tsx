'use client';

import { AppSidebar, MainContent } from '@/components/layout/app-sidebar';
import { useParams } from 'next/navigation';

export default function ChannelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const channelId = params.channel_id as string;

    return (
        <>
            <AppSidebar channelId={channelId} />
            <MainContent>{children}</MainContent>
        </>
    );
}
