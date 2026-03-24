// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi, inventoryApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  ClipboardList, Box, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Plus, ArrowRight, Users, Building2, MapPin, Package, Wrench, Shield,
  Zap, Target, Activity, BarChart3
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  new: '#94a3b8', open: '#3b82f6', in_progress: '#f59e0b',
  on_hold: '#f97316', pending_review: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444',
};
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

/* ── Animated Number Counter ── */
const AnimatedNumber = ({ value, suffix = '', prefix = '', duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (num === 0) { setDisplay(0); return; }
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(num * eased * 10) / 10);
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  const formatted = Number.isInteger(value) ? Math.round(display) : display.toFixed(1);
  return <span>{prefix}{formatted}{suffix}</span>;
};

/* ── Completion Gauge ── */
const CompletionGauge = ({ percentage = 0, size = 140, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="gauge-ring" style={{ '--gauge-circumference': circumference, '--gauge-offset': offset }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          <AnimatedNumber value={percentage} suffix="%" />
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
};

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const cfg = {
    new: 'status-new', open: 'status-open', in_progress: 'status-in_progress',
    on_hold: 'status-on_hold', pending_review: 'status-pending_review',
    completed: 'status-completed', cancelled: 'status-cancelled',
  };
  return <span className={`status-badge ${cfg[status] || 'status-new'}`}>{status?.replace(/_/g, ' ')}</span>;
};

const PriorityBadge = ({ priority }) => {
  const cfg = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };
  return <span className={`status-badge ${cfg[priority] || 'priority-medium'}`}>{priority}</span>;
};

/* ── Role Config ── */
const ROLE_CONFIG = {
  super_admin:       { label: 'Super Admin', icon: Shield,  color: 'text-violet-500', bg: 'bg-violet-500/10' },
  org_admin:         { label: 'Org Admin',   icon: Building2, color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  facility_manager:  { label: 'Facility Manager', icon: Wrench, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  technician:        { label: 'Technician',  icon: Zap,     color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  requestor:         { label: 'Requestor',   icon: ClipboardList, color: 'text-sky-500', bg: 'bg-sky-500/10' },
};

const getRoleName = (user) => {
  const r = (user?.role?.name || user?.Role?.name || '').toLowerCase();
  return r.replace(' ', '_');
};

/* ── Main ── */
const DashboardPage = () => {
  const { user, hasRole, isManager } = useAuth();
  const roleName = getRoleName(user);
  const roleCfg = ROLE_CONFIG[roleName] || ROLE_CONFIG.requestor;
  const RoleIcon = roleCfg.icon;

  const isSuperAdmin       = hasRole(['super_admin']);
  const isOrgAdmin         = hasRole(['org_admin']);
  const isFacilityManager  = hasRole(['facility_manager']);
  const isTechnician       = hasRole(['technician']);
  const isRequestor        = hasRole(['requestor', 'requester']);

  const [data, setData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes] = await Promise.all([analyticsApi.getDashboard()]);
        setData(dashRes.data);
        // Fetch inventory stats for managers
        if (!isTechnician && !isRequestor) {
          try {
            const invRes = await inventoryApi.getStats();
            setInventoryStats(invRes.data);
          } catch { /* inventory might not be accessible */ }
        }
      } catch (e) { console.error('Dashboard fetch failed:', e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-[300px]" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const woByStatus = (data?.wo_by_status || []).filter(s => s.count > 0);
  const woByPriority = data?.wo_by_priority || [];
  const recentWorkOrders = data?.recent_work_orders || [];

  /* Role-specific KPI card definitions */
  const getKpiCards = () => {
    if (isTechnician) return [
      { title: 'My Assigned',      value: stats.my_assigned    || stats.total_work_orders || 0,  icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-500/10' },
      { title: 'In Progress',      value: stats.my_in_progress || stats.in_progress_work_orders || 0, icon: Activity,   color: 'text-amber-500',  bg: 'bg-amber-500/10' },
      { title: 'Completed',        value: stats.my_completed   || stats.completed_work_orders || 0,   icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { title: 'Overdue',          value: stats.my_overdue     || stats.overdue_pms || 0,              icon: AlertTriangle, color: 'text-red-500',   bg: 'bg-red-500/10' },
    ];
    if (isRequestor) return [
      { title: 'My Requests',      value: stats.total_work_orders || 0, icon: ClipboardList, color: 'text-sky-500',    bg: 'bg-sky-500/10' },
      { title: 'Pending',          value: stats.pending_work_orders || 0, icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-500/10' },
      { title: 'In Progress',      value: stats.in_progress_work_orders || 0, icon: Activity, color: 'text-blue-500',   bg: 'bg-blue-500/10' },
      { title: 'Completed',        value: stats.completed_work_orders || 0,   icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];
    // Manager roles (SA, OA, FM)
    return [
      { title: 'Work Orders',      value: stats.total_work_orders || 0, icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-500/10', desc: `${stats.in_progress_work_orders || 0} in progress` },
      { title: 'Completion Rate',  value: stats.completion_rate || 0,   icon: TrendingUp,    color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: `${stats.completed_work_orders || 0} completed`, suffix: '%' },
      { title: 'Total Assets',     value: stats.total_assets || 0,      icon: Box,           color: 'text-blue-500',   bg: 'bg-blue-500/10' },
      { title: 'PM Schedules',     value: stats.active_pm_schedules || 0, icon: Calendar,    color: 'text-amber-500',  bg: 'bg-amber-500/10', desc: stats.overdue_pms > 0 ? `${stats.overdue_pms} overdue` : 'All on track' },
    ];
  };

  const kpiCards = getKpiCards();

  /* Quick actions based on role */
  const quickActions = [];
  if (isManager()) quickActions.push({ label: 'New Work Order', href: '/work-orders/new', icon: Plus });
  if (isSuperAdmin || isOrgAdmin) quickActions.push({ label: 'Manage Users', href: '/users', icon: Users });
  if (isFacilityManager) quickActions.push({ label: 'View Assets', href: '/assets', icon: Box });
  if (isTechnician) quickActions.push({ label: 'My Work Orders', href: '/work-orders', icon: ClipboardList });
  if (isRequestor) quickActions.push({ label: 'Submit Request', href: '/work-orders/new', icon: Plus });

  /* Insights */
  const insights = [];
  if (stats.pending_work_orders > 0) insights.push({ text: `${stats.pending_work_orders} work orders are pending action`, type: 'warning', icon: Clock });
  if (stats.overdue_pms > 0) insights.push({ text: `${stats.overdue_pms} PM schedules are overdue`, type: 'danger', icon: AlertTriangle });
  if (inventoryStats?.low_stock_count > 0) insights.push({ text: `${inventoryStats.low_stock_count} inventory items are low on stock`, type: 'warning', icon: Package });
  if (stats.completion_rate >= 90) insights.push({ text: `Great performance! ${stats.completion_rate}% completion rate`, type: 'success', icon: Target });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium capitalize">{payload[0]?.name?.replace(/_/g, ' ') || label}</p>
        <p className="text-lg font-bold text-primary">{payload[0]?.value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* ── Welcome Header ── */}
      <div className="animate-fade-in-up flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${roleCfg.bg}`}>
            <RoleIcon className={`h-7 w-7 ${roleCfg.color}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.first_name || 'User'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-badge ${roleCfg.bg} ${roleCfg.color} border-0`}>
                {roleCfg.label}
              </span>
              <span className="text-muted-foreground text-sm">
                {user?.managed_site?.name || user?.site?.name
                  ? `· ${user?.managed_site?.name || user?.site?.name}`
                  : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map((a, i) => (
            <Button key={i} asChild variant={i === 0 ? 'default' : 'outline'} size="sm">
              <Link to={a.href}>
                <a.icon className="mr-2 h-4 w-4" />{a.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* ── Inventory Alert Banner ── */}
      {inventoryStats?.low_stock_count > 0 && (
        <div className="animate-fade-in-up stagger-1 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="animate-pulse-amber">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-sm flex-1">
            <span className="font-semibold text-amber-600">{inventoryStats.low_stock_count} inventory items</span> are below minimum stock levels.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/inventory">View Inventory <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className={`card-hover insight-card animate-fade-in-up stagger-${i + 1}`}
                  data-testid={`stat-card-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="stat-value">
                  <AnimatedNumber value={kpi.value} suffix={kpi.suffix || ''} />
                </div>
                {kpi.desc && <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Quick Insights ── */}
      {insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight, i) => {
            const InsightIcon = insight.icon;
            const colorMap = { warning: 'text-amber-500', danger: 'text-red-500', success: 'text-emerald-500' };
            return (
              <div key={i} className={`animate-fade-in-up stagger-${i + 1} flex items-center gap-3 p-3 rounded-lg border bg-card`}>
                <InsightIcon className={`h-4 w-4 shrink-0 ${colorMap[insight.type]}`} />
                <span className="text-sm">{insight.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Charts + Gauge Row ── */}
      <div className="grid gap-6 lg:grid-cols-8">
        {/* WO by Status — Donut */}
        <Card className="lg:col-span-3 animate-fade-in-up stagger-3" data-testid="chart-wo-status">
          <CardHeader>
            <CardTitle className="text-lg">Work Orders by Status</CardTitle>
            <CardDescription>Distribution of current work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={woByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="count" nameKey="status"
                    animationBegin={200} animationDuration={1000}>
                    {woByStatus.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry.status] || COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => v.replace(/_/g, ' ')} wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion Gauge — center */}
        <Card className="lg:col-span-2 animate-fade-in-up stagger-4 flex flex-col items-center justify-center" data-testid="completion-gauge">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CompletionGauge percentage={stats.completion_rate || 0} size={120} />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {stats.completed_work_orders || 0} of {stats.total_work_orders || 0}
            </p>
          </CardContent>
        </Card>

        {/* WO by Priority — Bar Chart */}
        <Card className="lg:col-span-3 animate-fade-in-up stagger-5" data-testid="chart-wo-priority">
          <CardHeader>
            <CardTitle className="text-lg">Work Orders by Priority</CardTitle>
            <CardDescription>Breakdown by urgency level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={woByPriority} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="priority" type="category" width={70} tick={{ fontSize: 12 }}
                    tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} animationBegin={400} animationDuration={800}>
                    {woByPriority.map((entry, idx) => (
                      <Cell key={idx} fill={PRIORITY_COLORS[entry.priority] || COLORS[idx]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Status Flow (progress bars) ── */}
      {!isRequestor && (
        <Card className="animate-fade-in-up stagger-5" data-testid="status-flow">
          <CardHeader>
            <CardTitle className="text-lg">Status Flow</CardTitle>
            <CardDescription>Proportion of work orders across each status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.wo_by_status || []).map((item) => {
                const total = stats.total_work_orders || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <span className="text-xs capitalize w-24 text-muted-foreground truncate">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_COLORS[item.status] || '#94a3b8',
                        }} />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">{item.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Work Orders ── */}
      <Card className="animate-fade-in-up stagger-6" data-testid="recent-work-orders">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Work Orders</CardTitle>
            <CardDescription>Latest activity in your facility</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/work-orders">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                <TableHead>Assignee</TableHead>
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
                recentWorkOrders.map((wo, i) => (
                  <TableRow key={wo.id} className={`animate-slide-in-right stagger-${Math.min(i + 1, 6)}`}
                            data-testid={`wo-row-${wo.id}`}>
                    <TableCell>
                      <Link to={`/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                        {wo.wo_number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{wo.title}</TableCell>
                    <TableCell><StatusBadge status={wo.status} /></TableCell>
                    <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {wo.assignee
                        ? <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {(wo.assignee.first_name?.[0] || '')}{(wo.assignee.last_name?.[0] || '')}
                            </div>
                            {wo.assignee.first_name} {wo.assignee.last_name}
                          </div>
                        : <span className="italic text-xs">Unassigned</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(wo.created_at), { addSuffix: true })}
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
