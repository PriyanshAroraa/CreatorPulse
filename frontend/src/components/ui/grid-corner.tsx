import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface GridCornerProps {
    corner?: Corner;
    className?: string;
}

const cornerPositions: Record<Corner, string> = {
    'top-left': '-top-[5px] -left-[5px]',
    'top-right': '-top-[5px] -right-[5px]',
    'bottom-left': '-bottom-[5px] -left-[5px]',
    'bottom-right': '-bottom-[5px] -right-[5px]',
};

export function GridCorner({ corner = 'top-left', className }: GridCornerProps) {
    return (
        <div
            className={cn(
                'absolute z-10 text-neutral-600 bg-[#0f0f0f]',
                cornerPositions[corner],
                className
            )}
        >
            <Plus size={10} strokeWidth={3} />
        </div>
    );
}

// Utility component for adding all four corners at once
interface GridCornersProps {
    className?: string;
}

export function GridCorners({ className }: GridCornersProps) {
    return (
        <>
            <GridCorner corner="top-left" className={className} />
            <GridCorner corner="top-right" className={className} />
            <GridCorner corner="bottom-left" className={className} />
            <GridCorner corner="bottom-right" className={className} />
        </>
    );
}
