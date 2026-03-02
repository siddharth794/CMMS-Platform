import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClipboardList, Box, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

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

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'primary' }) => (
  <Card className="card-hover" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg bg-${color}/10`}>
        <Icon className={`h-5 w-5 text-${color}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="stat-value">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsApi.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const woByStatus = data?.wo_by_status || [];
  const woByPriority = data?.wo_by_priority || [];
  const recentWorkOrders = data?.recent_work_orders || [];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your facility operations</p>
        </div>
        <Button asChild data-testid="create-wo-btn">
          <Link to="/work-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Work Order
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Work Orders"
          value={stats.total_work_orders}
          icon={ClipboardList}
          description={`${stats.in_progress_work_orders} in progress`}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completion_rate}%`}
          icon={TrendingUp}
          description={`${stats.completed_work_orders} completed`}
        />
        <StatCard
          title="Total Assets"
          value={stats.total_assets}
          icon={Box}
        />
        <StatCard
          title="PM Schedules"
          value={stats.active_pm_schedules}
          icon={Calendar}
          description={stats.overdue_pms > 0 ? `${stats.overdue_pms} overdue` : 'All on track'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Orders by Status */}
        <Card data-testid="chart-wo-status">
          <CardHeader>
            <CardTitle>Work Orders by Status</CardTitle>
            <CardDescription>Distribution of current work orders</CardDescription>
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
                    label={({ status, count }) => `${status.replace('_', ' ')}: ${count}`}
                  >
                    {woByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders by Priority */}
        <Card data-testid="chart-wo-priority">
          <CardHeader>
            <CardTitle>Work Orders by Priority</CardTitle>
            <CardDescription>Priority breakdown of all work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={woByPriority} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="priority" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Work Orders */}
      <Card data-testid="recent-work-orders">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Work Orders</CardTitle>
            <CardDescription>Latest work orders in your facility</CardDescription>
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
                    No work orders yet. Create your first work order to get started.
                  </TableCell>
                </TableRow>
              ) : (
                recentWorkOrders.map((wo) => (
                  <TableRow key={wo.id} data-testid={`wo-row-${wo.id}`}>
                    <TableCell>
                      <Link to={`/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                        {wo.wo_number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{wo.title}</TableCell>
                    <TableCell><StatusBadge status={wo.status} /></TableCell>
                    <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                    <TableCell className="text-muted-foreground">{wo.asset?.name || '-'}</TableCell>
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

export default DashboardPage;
