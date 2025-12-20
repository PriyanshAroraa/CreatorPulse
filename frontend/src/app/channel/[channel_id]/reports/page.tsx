'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { reportsApi, channelsApi } from '@/lib/api';
import { Report, Channel } from '@/lib/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';

export default function ReportsPage() {
    const params = useParams();
    const channelId = params.channel_id as string;

    const [channel, setChannel] = useState<Channel | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        loadData();
        // Set default dates
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        setDateTo(today.toISOString().split('T')[0]);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    }, [channelId]);

    const loadData = async () => {
        try {
            const [channelData, reportsData] = await Promise.all([
                channelsApi.get(channelId),
                reportsApi.list(channelId),
            ]);
            setChannel(channelData);
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
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <AppSidebar channelId={channelId} />

            <main className="ml-64 min-h-screen transition-all duration-300">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6" />
                            <h1 className="text-xl font-bold">Reports</h1>
                        </div>

                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Report
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Generate New Report</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <label className="text-sm font-medium">Title (optional)</label>
                                        <Input
                                            placeholder="Report title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">From Date</label>
                                            <Input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">To Date</label>
                                            <Input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCreate}
                                        disabled={creating || !dateFrom || !dateTo}
                                        className="w-full"
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

                <div className="p-6">
                    {reports.length === 0 ? (
                        <Card className="mx-auto max-w-md text-center bg-zinc-900/50 border-zinc-800">
                            <CardContent className="pt-10 pb-10">
                                <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">No reports yet</h2>
                                <p className="mt-2 text-muted-foreground">
                                    Generate your first report to share analytics with your team.
                                </p>
                                <Button className="mt-6" onClick={() => setDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Report
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {reports.map((report) => (
                                <Card key={report.id} className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1 text-lg">
                                            {report.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {formatDate(report.date_from)} - {formatDate(report.date_to)}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <MessageSquare className="mx-auto h-5 w-5 text-muted-foreground" />
                                                <p className="mt-1 text-lg font-semibold">
                                                    {report.data.total_comments.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Comments</p>
                                            </div>
                                            <div>
                                                <Video className="mx-auto h-5 w-5 text-muted-foreground" />
                                                <p className="mt-1 text-lg font-semibold">
                                                    {report.data.total_videos}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Videos</p>
                                            </div>
                                            <div>
                                                <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                                                <p className="mt-1 text-lg font-semibold">
                                                    {report.data.unique_commenters.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Users</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleDownload(report.id!)}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(report.id!)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Created {formatDate(report.created_at)}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
