// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Skeleton } from '../components/ui/skeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { CalendarIcon, TrendingUp, ClipboardList, Box, Calendar as CalIcon, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '../lib/utils';

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
const STATUS_COLORS = { new: '#94a3b8', open: '#3b82f6', in_progress: '#f59e0b', on_hold: '#f97316', completed: '#10b981', cancelled: '#ef4444' };

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.getDashboard({
        start_date: dateRange.from?.toISOString(),
        end_date: dateRange.to?.toISOString(),
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="analytics-loading">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const woByStatus = data?.wo_by_status?.filter(s => s.count > 0) || [];
  const woByPriority = data?.wo_by_priority || [];

  return (
    <div className="space-y-8" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start text-left font-normal" data-testid="date-range-picker">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover" data-testid="kpi-total-wo">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Work Orders</CardTitle>
            <ClipboardList className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.total_work_orders}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pending_work_orders} pending</p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="kpi-completion-rate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="stat-value text-emerald-600">{stats.completion_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.completed_work_orders} completed</p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="kpi-assets">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            <Box className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.total_assets}</div>
            <p className="text-xs text-muted-foreground mt-1">Being managed</p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="kpi-pm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PM Schedules</CardTitle>
            {stats.overdue_pms > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <CalIcon className="h-5 w-5 text-primary" />
            )}
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.active_pm_schedules}</div>
            <p className={cn("text-xs mt-1", stats.overdue_pms > 0 ? "text-amber-600" : "text-muted-foreground")}>
              {stats.overdue_pms > 0 ? `${stats.overdue_pms} overdue` : 'All on schedule'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Orders by Status - Pie Chart */}
        <Card data-testid="chart-status-pie">
          <CardHeader>
            <CardTitle>Work Orders by Status</CardTitle>
            <CardDescription>Distribution of current work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={woByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {woByStatus.map((entry, index) => (
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

        {/* Work Orders by Priority - Bar Chart */}
        <Card data-testid="chart-priority-bar">
          <CardHeader>
            <CardTitle>Work Orders by Priority</CardTitle>
            <CardDescription>Breakdown by urgency level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
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

      {/* Summary Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card data-testid="summary-status">
          <CardHeader>
            <CardTitle className="text-lg">Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.wo_by_status?.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: STATUS_COLORS[item.status] }}
                    />
                    <span className="text-sm capitalize">{item.status.replace('_', ' ')}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-priority">
          <CardHeader>
            <CardTitle className="text-lg">Priority Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {woByPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}
                    />
                    <span className="text-sm capitalize">{item.priority}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-metrics">
          <CardHeader>
            <CardTitle className="text-lg">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="font-medium">{stats.in_progress_work_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-medium">{stats.pending_work_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium text-emerald-600">{stats.completed_work_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue PM</span>
                <span className={cn("font-medium", stats.overdue_pms > 0 && "text-amber-600")}>
                  {stats.overdue_pms}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
