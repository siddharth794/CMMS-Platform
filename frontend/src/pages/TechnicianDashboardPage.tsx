// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClipboardList, TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
const STATUS_COLORS = { new: '#94a3b8', open: '#3b82f6', in_progress: '#f59e0b', on_hold: '#f97316', completed: '#10b981', cancelled: '#ef4444' };
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

const StatusBadge = ({ status }) => {
    const statusConfig = {
        new: 'status-new', open: 'status-open', in_progress: 'status-in_progress',
        on_hold: 'status-on_hold', completed: 'status-completed', cancelled: 'status-cancelled',
    };
    return (
        <span className={`status-badge ${statusConfig[status] || 'status-new'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
        low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical',
    };
    return (
        <span className={`status-badge ${priorityConfig[priority] || 'priority-medium'}`}>
            {priority}
        </span>
    );
};

const TechnicianDashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await analyticsApi.getTechnicianDashboard();
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch technician dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6" data-testid="tech-dashboard-loading">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const woByStatus = data?.my_wo_by_status || [];
    const woByPriority = data?.my_wo_by_priority || [];
    const recentWorkOrders = data?.my_recent_work_orders || [];

    return (
        <div className="space-y-8" data-testid="tech-dashboard-page">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {user?.first_name || 'Technician'} 👋
                    </h1>
                    <p className="text-muted-foreground">Here's an overview of your assigned work</p>
                </div>
                <Button asChild data-testid="view-all-wo-btn">
                    <Link to="/work-orders">
                        View All Work Orders
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover" data-testid="kpi-my-assigned">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">My Assigned</CardTitle>
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="stat-value">{stats.my_assigned}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.my_pending} pending</p>
                    </CardContent>
                </Card>

                <Card className="card-hover" data-testid="kpi-my-in-progress">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="stat-value text-amber-600">{stats.my_in_progress}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently working on</p>
                    </CardContent>
                </Card>

                <Card className="card-hover" data-testid="kpi-my-completed">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="stat-value text-emerald-600">{stats.my_completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stats.my_completion_rate}% completion rate</p>
                    </CardContent>
                </Card>

                <Card className="card-hover" data-testid="kpi-my-overdue">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                        <div className={cn("p-2 rounded-lg", stats.my_overdue > 0 ? "bg-red-500/10" : "bg-emerald-500/10")}>
                            {stats.my_overdue > 0 ? (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("stat-value", stats.my_overdue > 0 ? "text-red-600" : "text-emerald-600")}>
                            {stats.my_overdue}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.my_overdue > 0 ? 'Need attention' : 'All on schedule'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* My WOs by Status */}
                <Card data-testid="chart-my-wo-status">
                    <CardHeader>
                        <CardTitle>My Work Orders by Status</CardTitle>
                        <CardDescription>Distribution of your assigned work orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={woByStatus.filter(s => s.count > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="count"
                                        nameKey="status"
                                    >
                                        {woByStatus.filter(s => s.count > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value, name.replace('_', ' ')]}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend
                                        formatter={(value) => value.replace('_', ' ')}
                                        wrapperStyle={{ paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* My WOs by Priority */}
                <Card data-testid="chart-my-wo-priority">
                    <CardHeader>
                        <CardTitle>My Work Orders by Priority</CardTitle>
                        <CardDescription>Priority breakdown of your work orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={woByPriority} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        dataKey="priority"
                                        type="category"
                                        width={80}
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {woByPriority.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || COLORS[index]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* My Recent Work Orders */}
            <Card data-testid="my-recent-work-orders">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Recent Work Orders</CardTitle>
                        <CardDescription>Latest work orders assigned to you</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/work-orders">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>WO Number</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Asset</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentWorkOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No work orders assigned to you yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentWorkOrders.map((wo) => (
                                    <TableRow key={wo.id} data-testid={`my-wo-row-${wo.id}`}>
                                        <TableCell>
                                            <Link to={`/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                                                {wo.wo_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">{wo.title}</TableCell>
                                        <TableCell><StatusBadge status={wo.status} /></TableCell>
                                        <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                                        <TableCell className="text-muted-foreground">{wo.Asset?.name || '-'}</TableCell>
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

export default TechnicianDashboardPage;
