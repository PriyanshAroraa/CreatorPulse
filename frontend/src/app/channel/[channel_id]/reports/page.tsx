'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { useChannel } from '@/hooks/use-cached-data';
import { Report } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GridCorner } from '@/components/ui/grid-corner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    FileText,
    Plus,
    Download,
    Trash2,
    Loader2,
    Calendar,
    MessageSquare,
    Users,
    Video,
    ArrowLeft,
} from 'lucide-react';

export default function ReportsPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    // SWR for channel data (cached)
    const { data: channel } = useChannel(channelId);

    // Local state for reports (dynamic with CRUD)
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        loadReports();
        // Set default dates
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        setDateTo(today.toISOString().split('T')[0]);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    }, [channelId]);

    const loadReports = async () => {
        try {
            const reportsData = await reportsApi.list(channelId);
            setReports(reportsData);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!dateFrom || !dateTo) return;

        setCreating(true);
        try {
            const report = await reportsApi.create(
                channelId,
                new Date(dateFrom).toISOString(),
                new Date(dateTo).toISOString(),
                title || undefined
            );
            setReports((prev) => [report, ...prev]);
            setDialogOpen(false);
            setTitle('');
        } catch (error) {
            console.error('Failed to create report:', error);
            alert('Failed to create report. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        try {
            await reportsApi.delete(reportId);
            setReports((prev) => prev.filter((r) => r.id !== reportId));
        } catch (error) {
            console.error('Failed to delete report:', error);
        }
    };

    const handleDownload = (reportId: string) => {
        window.open(reportsApi.download(reportId), '_blank');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

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
                            <FileText className="h-5 w-5 text-neutral-500" />
                            <h1 className="font-serif text-lg text-[#e5e5e5]">Reports</h1>
                        </div>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-[#e5e5e5] transition-colors">
                                <Plus size={14} /> Generate Report
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0f0f0f] border-neutral-800">
                            <DialogHeader>
                                <DialogTitle className="font-serif text-xl text-[#e5e5e5]">Generate New Report</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-neutral-600">Title (optional)</label>
                                    <Input
                                        placeholder="Report title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="mt-2 bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5] placeholder:text-neutral-600"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-neutral-600">From Date</label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="mt-2 bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-neutral-600">To Date</label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="mt-2 bg-[#0f0f0f] border-neutral-800 text-[#e5e5e5]"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreate}
                                    disabled={creating || !dateFrom || !dateTo}
                                    className="w-full bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Report'
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="p-8">
                {reports.length === 0 ? (
                    <div className="relative border border-neutral-800">
                        <GridCorner corner="top-left" />
                        <GridCorner corner="top-right" />
                        <GridCorner corner="bottom-left" />
                        <GridCorner corner="bottom-right" />
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="h-16 w-16 border border-neutral-800 flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-neutral-600" />
                            </div>
                            <h2 className="font-serif text-xl text-[#e5e5e5] mb-2">No reports yet</h2>
                            <p className="text-neutral-500 text-sm text-center max-w-sm mb-6">
                                Generate your first report to share analytics with your team.
                            </p>
                            <Button
                                onClick={() => setDialogOpen(true)}
                                className="bg-[#e5e5e5] text-[#0f0f0f] hover:bg-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3 border border-neutral-800">
                        {reports.map((report, index) => (
                            <div
                                key={report.id}
                                className={`relative p-6 hover:bg-white/[0.02] transition-colors ${index % 3 !== 2 ? 'lg:border-r' : ''
                                    } ${index % 2 !== 1 ? 'md:border-r lg:border-r-0' : 'md:border-r-0'} ${index < reports.length - (reports.length % 3 || 3) ? 'border-b' : ''
                                    } border-neutral-800`}
                            >
                                {index === 0 && <GridCorner corner="top-left" />}
                                {index === 2 || (reports.length < 3 && index === reports.length - 1) ? <GridCorner corner="top-right" /> : null}

                                <h3 className="font-serif text-lg text-[#e5e5e5] line-clamp-1 mb-2">
                                    {report.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-neutral-600 mb-4">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        {formatDate(report.date_from)} - {formatDate(report.date_to)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-neutral-800">
                                    <div>
                                        <MessageSquare className="mx-auto h-4 w-4 text-neutral-600" />
                                        <p className="font-serif text-lg text-[#e5e5e5] mt-1">
                                            {report.data.total_comments.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-neutral-600">Comments</p>
                                    </div>
                                    <div>
                                        <Video className="mx-auto h-4 w-4 text-neutral-600" />
                                        <p className="font-serif text-lg text-[#e5e5e5] mt-1">
                                            {report.data.total_videos}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-neutral-600">Videos</p>
                                    </div>
                                    <div>
                                        <Users className="mx-auto h-4 w-4 text-neutral-600" />
                                        <p className="font-serif text-lg text-[#e5e5e5] mt-1">
                                            {report.data.unique_commenters.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-neutral-600">Users</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-neutral-800 text-neutral-400 hover:bg-white/[0.02]"
                                        onClick={() => handleDownload(report.id!)}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-neutral-800 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                                        onClick={() => handleDelete(report.id!)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <p className="mt-4 text-[10px] uppercase tracking-widest text-neutral-600">
                                    Created {formatDate(report.created_at)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
