import React, { useState, useEffect } from 'react';
import { workOrdersApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Loader2, Plus, ClipboardList, Clock, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        new: 'status-new',
        open: 'status-open',
        in_progress: 'status-in_progress',
        on_hold: 'status-on_hold',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
    };
    return (
        <span className={`status-badge ${statusConfig[status] || 'status-new'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
        low: 'priority-low',
        medium: 'priority-medium',
        high: 'priority-high',
        critical: 'priority-critical',
    };
    return (
        <span className={`status-badge ${priorityConfig[priority] || 'priority-medium'}`}>
            {priority}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
    <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`p-2 rounded-lg bg-${color}/10`}>
                <Icon className={`h-5 w-5 text-${color}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="stat-value">{value}</div>
        </CardContent>
    </Card>
);

const RequesterDashboardPage = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { addNotification } = useNotification();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'low',
        asset_id: '',
        location: ''
    });

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async () => {
        try {
            const response = await workOrdersApi.list({ limit: 100 });
            setWorkOrders(response.data || []);
        } catch (error) {
            console.error('Failed to fetch work orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title) {
            addNotification('error', 'Title is required');
            return;
        }

        setSubmitting(true);
        try {
            await workOrdersApi.create(formData);
            addNotification('success', 'Work order request submitted successfully');
            setCreateOpen(false);
            setFormData({ title: '', description: '', priority: 'low', asset_id: '', location: '' });
            fetchWorkOrders(); // Refresh list
        } catch (error) {
            addNotification('error', error.response?.data?.detail || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Ensure workOrders is an array before using array methods
    const safeWorkOrders = Array.isArray(workOrders) ? workOrders : (workOrders?.data || []);

    // Calculate stats based on fetched work orders
    const total = safeWorkOrders.length;
    const pending = safeWorkOrders.filter(wo => ['new', 'open'].includes(wo.status)).length;
    const inProgress = safeWorkOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = safeWorkOrders.filter(wo => wo.status === 'completed').length;

    const recentWorkOrders = [...safeWorkOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
                    <p className="text-muted-foreground">Track and submit maintenance requests</p>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button data-testid="create-wo-btn">
                            <Plus className="mr-2 h-4 w-4" />
                            New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Submit New Request</DialogTitle>
                            <DialogDescription>Describe the issue and we'll route it to our technicians.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Brief description (e.g., Leaking faucet)"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide more details..."
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., Room 101"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Requests" value={total} icon={ClipboardList} color="primary" />
                <StatCard title="Pending Review" value={pending} icon={Clock} color="amber" />
                <StatCard title="In Progress" value={inProgress} icon={MoreHorizontal} color="blue" />
                <StatCard title="Completed" value={completed} icon={CheckCircle2} color="emerald" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                    <CardDescription>Your 5 most recently submitted work orders</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>WO Number</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Submitted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentWorkOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        You haven't submitted any requests yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentWorkOrders.map((wo) => (
                                    <TableRow key={wo.id}>
                                        <TableCell>
                                            <span className="font-medium">{wo.wo_number}</span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">{wo.title}</TableCell>
                                        <TableCell><StatusBadge status={wo.status} /></TableCell>
                                        <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(wo.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default RequesterDashboardPage;
