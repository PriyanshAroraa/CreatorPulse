'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { channelsApi } from '@/lib/api';
import { Channel } from '@/lib/types';

interface ChannelsContextType {
    channels: Channel[];
    isLoading: boolean;
    loadChannels: (force?: boolean) => Promise<Channel[]>;
    addChannel: (channel: Channel) => void;
    removeChannel: (channelId: string) => void;
}

const ChannelsContext = createContext<ChannelsContextType>({
    channels: [],
    isLoading: false,
    loadChannels: async () => [],
    addChannel: () => { },
    removeChannel: () => { },
});

export const useChannels = () => useContext(ChannelsContext);

interface ChannelsProviderProps {
    children: ReactNode;
}

export function ChannelsProvider({ children }: ChannelsProviderProps) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const loadChannels = useCallback(async (force = false): Promise<Channel[]> => {
        // If already loaded and not forcing, return cached data
        if (hasLoaded && !force) {
            return channels;
        }

        // Prevent duplicate requests
        if (isLoading) {
            return channels;
        }

        setIsLoading(true);
        try {
            const data = await channelsApi.list();
            setChannels(data);
            setHasLoaded(true);
            return data;
        } catch (error) {
            console.error('Failed to load channels:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [channels, hasLoaded, isLoading]);

    const addChannel = useCallback((channel: Channel) => {
        setChannels(prev => [...prev, channel]);
    }, []);

    const removeChannel = useCallback((channelId: string) => {
        setChannels(prev => prev.filter(c => c.channel_id !== channelId));
    }, []);

    return (
        <ChannelsContext.Provider value={{ channels, isLoading, loadChannels, addChannel, removeChannel }}>
            {children}
        </ChannelsContext.Provider>
    );
}
