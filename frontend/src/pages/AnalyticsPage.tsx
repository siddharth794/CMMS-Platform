// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { analyticsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  CalendarIcon, TrendingUp, ClipboardList, Box, Calendar as CalIcon,
  AlertTriangle, Package, DollarSign, Activity, Target, BarChart3, CheckIcon,
  Users, UserPlus, Clock, Wrench, FileText, CheckCircle2
} from 'lucide-react';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';

const STATUS_COLORS = {
  new: '#94a3b8', open: '#3b82f6', in_progress: '#f59e0b',
  on_hold: '#f97316', pending_review: '#06b6d4', completed: '#22c55e', cancelled: '#ef4444',
};
const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

/* ── Animated Number Counter ── */
const AnimatedNumber = ({ value, suffix = '', prefix = '', duration = 1000 }) => {
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
const CompletionGauge = ({ percentage = 0, size = 160, strokeWidth = 14 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 75 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="gauge-ring" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          <AnimatedNumber value={percentage} suffix="%" />
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Completion</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium capitalize mb-2">{String(payload[0]?.name || label || '').replace(/_/g, ' ')}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm text-muted-foreground capitalize">{entry.name?.replace(/_/g, ' ')}:</span>
          <span className="text-sm font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Date Presets ── */
const DATE_PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export default function AnalyticsPage() {
  const { hasRole } = useAuth();
  
  // Roles
  const isSuperAdmin = hasRole(['super_admin']);
  const isOrgAdmin = hasRole(['org_admin']);
  const isFacilityManager = hasRole(['facility_manager']);
  const isTechnician = hasRole(['technician']);
  const isRequestor = hasRole(['requestor', 'requester']);
  
  const showFullDashboard = isSuperAdmin || isOrgAdmin || isFacilityManager;
  const isManagerLevel = isFacilityManager;
  const showInventory = !isTechnician && !isRequestor;

  const [loading, setLoading] = useState(true);
  
  // Data State
  const [data, setData] = useState({
    dashboard: null,
    comprehensive: null,
    woTrend: [],
    woBySite: [],
    topAssets: [],
    techPerformance: [],
    siteComparison: [],
    overdueTrend: [],
    workloadByDay: [],
    estimatedVsActual: [],
    woByCategory: [],
    inventoryTopParts: [],
    inventoryByCategory: [],
    inventoryCostTrend: [],
    usersByRole: [],
    userGrowth: [],
    siteTechCounts: [],
    topRequesters: [],
    auditActivity: [],
    myRequests: null
  });

  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [appliedRange, setAppliedRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [monthsFilter, setMonthsFilter] = useState(12);
  const [activePreset, setActivePreset] = useState(30);
  
  const abortController = useRef(null);

  useEffect(() => {
    fetchData();
    return () => abortController.current?.abort();
  }, [appliedRange, monthsFilter]);

  const fetchData = async () => {
    setLoading(true);
    
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    
    try {
      const params = {
        start_date: appliedRange.from ? startOfDay(appliedRange.from).toISOString() : undefined,
        end_date: appliedRange.to ? endOfDay(appliedRange.to).toISOString() : undefined,
        months: monthsFilter
      };

      if (isRequestor && !showFullDashboard) {
        // Requestor Dashboard
        const res = await analyticsApi.getMyRequests(params);
        setData(prev => ({ ...prev, myRequests: res.data }));
      } else if (isTechnician && !showFullDashboard) {
        // Technician Dashboard
        const res = await analyticsApi.getDashboard(params);
        setData(prev => ({ ...prev, dashboard: res.data }));
      } else {
        // Full Dashboard (Admin / Manager)
        const [
          dashboard, comprehensive, woTrend, woBySite, topAssets, 
          techPerformance, siteComparison, overdueTrend, workloadByDay,
          estimatedVsActual, woByCategory, inventoryTopParts, inventoryByCategory,
          inventoryCostTrend, usersByRole, userGrowth, siteTechCounts,
          topRequesters, auditActivity
        ] = await Promise.all([
          analyticsApi.getDashboard(params).then(r => r.data).catch(() => null),
          analyticsApi.getComprehensive(params).then(r => r.data).catch(() => null),
          analyticsApi.getWorkOrdersTrend(params).then(r => { console.debug('WO Trend response:', r.data); return r.data; }).catch((e) => { console.error('WO Trend API error:', e.response?.status, e.response?.data); return []; }),
          analyticsApi.getWorkOrdersBySite(params).then(r => r.data).catch(() => []),
          analyticsApi.getTopAssets({ ...params, limit: 10 }).then(r => r.data).catch(() => []),
          analyticsApi.getTechnicianPerformance(params).then(r => r.data).catch(() => []),
          analyticsApi.getSiteComparison(params).then(r => r.data).catch(() => []),
          analyticsApi.getOverdueTrend(params).then(r => r.data).catch(() => []),
          analyticsApi.getWorkloadByDay(params).then(r => r.data).catch(() => []),
          analyticsApi.getEstimatedVsActual(params).then(r => r.data).catch(() => []),
          analyticsApi.getWorkOrdersByCategory(params).then(r => r.data).catch(() => []),
          analyticsApi.getInventoryTopParts({ ...params, limit: 10 }).then(r => r.data).catch(() => []),
          analyticsApi.getInventoryByCategory(params).then(r => r.data).catch(() => []),
          analyticsApi.getInventoryCostTrend(params).then(r => r.data).catch(() => []),
          analyticsApi.getUsersByRole(params).then(r => r.data).catch(() => []),
          analyticsApi.getUserGrowth(params).then(r => r.data).catch(() => []),
          analyticsApi.getSiteTechnicianCounts(params).then(r => r.data).catch(() => []),
          analyticsApi.getTopRequesters({ ...params, limit: 10 }).then(r => r.data).catch(() => []),
          analyticsApi.getAuditActivity({ days: 30 }).then(r => r.data).catch(() => [])
        ]);

        setData({
          dashboard, comprehensive, woTrend, woBySite, topAssets, techPerformance, 
          siteComparison, overdueTrend, workloadByDay, estimatedVsActual, woByCategory, 
          inventoryTopParts, inventoryByCategory, inventoryCostTrend, usersByRole, 
          userGrowth, siteTechCounts, topRequesters, auditActivity, myRequests: null
        });
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        console.error('Analytics fetch failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="analytics-loading">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-[420px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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

  // Common components definition inside render to use variables
  const renderHeader = () => (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          {isRequestor && !showFullDashboard ? 'My Requests Analytics' : isTechnician && !showFullDashboard ? 'My Dashboard' : 'Analytics'}
        </h1>
        <p className="text-muted-foreground">Performance metrics and operational insights</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {showFullDashboard && (
          <div className="flex bg-muted p-1 rounded-md mr-2">
            {[6, 12, 24].map(m => (
              <Button key={m} variant={monthsFilter === m ? 'default' : 'ghost'} size="sm"
                className="h-7 text-xs px-2" onClick={() => setMonthsFilter(m)}>
                {m}m
              </Button>
            ))}
          </div>
        )}
        {DATE_PRESETS.map((p) => (
          <Button key={p.days} variant={activePreset === p.days ? 'default' : 'ghost'} size="sm"
            className="text-xs"
            onClick={() => {
              const fromDate = subDays(new Date(), p.days);
              const toDate = new Date();
              setDate({ from: fromDate, to: toDate });
              setActivePreset(p.days);
              setAppliedRange({ from: fromDate, to: toDate });
            }}>
            {p.label}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal bg-background",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
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
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                if (newDate?.from && newDate?.to) {
                  setAppliedRange(newDate);
                  setActivePreset(null);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  // --- RENDERING VIEWS BASED ON ROLE ---

  if (isRequestor && !showFullDashboard) {
    const stats = data.myRequests?.stats || {};
    const trend = data.myRequests?.trend || [];
    const statusPie = (data.myRequests?.wo_by_status || []).filter(s => s.count > 0);
    const priorityPie = (data.myRequests?.wo_by_priority || []).filter(p => p.count > 0);

    return (
      <div className="space-y-8" data-testid="analytics-requestor">
        {renderHeader()}
        
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="card-hover insight-card animate-fade-in-up stagger-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">My Requests</CardTitle><ClipboardList className="h-5 w-5 text-violet-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold"><AnimatedNumber value={stats.total_requests || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle><CheckCircle2 className="h-5 w-5 text-emerald-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-600"><AnimatedNumber value={stats.completed || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle><Wrench className="h-5 w-5 text-amber-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600"><AnimatedNumber value={stats.in_progress || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle><Clock className="h-5 w-5 text-blue-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600"><AnimatedNumber value={stats.pending || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Res Time</CardTitle><Activity className="h-5 w-5 text-indigo-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold"><AnimatedNumber value={stats.avg_resolution_hours || 0} suffix="h" /></div></CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 animate-fade-in-up flex items-center justify-center p-6">
            <CompletionGauge percentage={stats.completion_rate || 0} size={180} />
          </Card>
          <Card className="md:col-span-2 animate-fade-in-up">
            <CardHeader><CardTitle>My Request Trend</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-fade-in-up">
            <CardHeader><CardTitle>Org-wide Priority Distribution</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={priorityPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="priority">{priorityPie.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.priority] || COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up">
            <CardHeader><CardTitle>Org-wide Status Distribution</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="status">{statusPie.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.status] || COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isTechnician && !showFullDashboard) {
    const stats = data.dashboard?.stats || {};
    const statusPie = (data.dashboard?.wo_by_status || []).filter(s => s.count > 0);
    const priorityPie = (data.dashboard?.wo_by_priority || []).filter(p => p.count > 0);
    const recentWOs = data.dashboard?.recent_work_orders || [];

    return (
      <div className="space-y-8" data-testid="analytics-technician">
        {renderHeader()}

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="card-hover insight-card animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Assigned</CardTitle><ClipboardList className="h-5 w-5 text-violet-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold"><AnimatedNumber value={stats.my_assigned || stats.total_work_orders || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle><CheckCircle2 className="h-5 w-5 text-emerald-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-600"><AnimatedNumber value={stats.my_completed || stats.completed_work_orders || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle><Wrench className="h-5 w-5 text-amber-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600"><AnimatedNumber value={stats.my_in_progress || stats.in_progress_work_orders || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle><Clock className="h-5 w-5 text-blue-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600"><AnimatedNumber value={stats.my_pending || stats.pending_work_orders || 0} /></div></CardContent>
          </Card>
          <Card className="card-hover insight-card animate-fade-in-up stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle><AlertTriangle className="h-5 w-5 text-red-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600"><AnimatedNumber value={stats.my_overdue || stats.overdue_pms || 0} /></div></CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 animate-fade-in-up flex flex-col items-center justify-center py-8">
             <CompletionGauge percentage={stats.my_completion_rate || stats.completion_rate || 0} size={180} />
             <p className="mt-4 font-medium text-sm text-muted-foreground">Personal Completion Rate</p>
          </Card>
          <Card className="md:col-span-2 animate-fade-in-up">
            <CardHeader><CardTitle>Recent Assigned Work Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWOs.length === 0 ? <p className="text-muted-foreground text-sm">No recent assignments.</p> : 
                  recentWOs.slice(0, 5).map(wo => (
                  <div key={wo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{wo.wo_number} - {wo.title}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(wo.created_at), 'MMM dd, yyyy')}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-1 rounded-full border uppercase font-bold" style={{ borderColor: STATUS_COLORS[wo.status], color: STATUS_COLORS[wo.status] }}>{wo.status.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] px-2 py-1 rounded-full border uppercase font-bold" style={{ borderColor: PRIORITY_COLORS[wo.priority], color: PRIORITY_COLORS[wo.priority] }}>{wo.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-fade-in-up">
            <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="status">{statusPie.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.status] || COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up">
            <CardHeader><CardTitle>Priority Breakdown</CardTitle></CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={priorityPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="priority">{priorityPie.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.priority] || COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- FULL DASHBOARD (Org Admin / Super Admin / Facility Manager) ---
  
  const comp = data.comprehensive || {};
  const dash = data.dashboard || { stats: {} };
  const dstats = dash.stats;

  return (
    <div className="space-y-8 pb-10" data-testid="analytics-full">
      {renderHeader()}

      {/* 1. TOP KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-5 animate-fade-in-up">
        <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total WOs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={dstats.total_work_orders || 0} /></div></CardContent></Card>
        <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600"><AnimatedNumber value={dstats.completed_work_orders || 0} /></div></CardContent></Card>
        <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600"><AnimatedNumber value={dstats.in_progress_work_orders || 0} /></div></CardContent></Card>
        <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600"><AnimatedNumber value={dstats.overdue_pms || 0} /></div></CardContent></Card>
        <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Resolution</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-indigo-600"><AnimatedNumber value={comp.avg_resolution_hours || 0} suffix="h" /></div></CardContent></Card>
      </div>

      {/* 2. MAIN CHARTS (Trend & Status) */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up stagger-1">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Work Order Trend (Created vs Completed)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {data.woTrend && data.woTrend.some(d => (d.created_count || 0) > 0 || (d.completed_count || 0) > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.woTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="created_count" name="Created" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                  <Line type="monotone" dataKey="completed_count" name="Completed" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No work order data available</div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>WO by Status</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={(dash.wo_by_status || []).filter(s => s.count > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="status">
                  {(dash.wo_by_status || []).filter(s => s.count > 0).map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.status] || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. BREAKDOWNS (Site, Preventive vs Reactive) */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up stagger-2">
        <Card>
          <CardHeader><CardTitle>Work Orders by Site</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {data.woBySite.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.woBySite}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="site_name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Preventive vs Reactive</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {comp.preventive_vs_reactive ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{name: 'Preventive', value: comp.preventive_vs_reactive.preventive || 0}, {name: 'Reactive', value: comp.preventive_vs_reactive.reactive || 0}]} 
                       cx="50%" cy="50%" innerRadius={0} outerRadius={100} dataKey="value" label>
                    <Cell fill="#22c55e" />
                    <Cell fill="#f97316" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>}
          </CardContent>
        </Card>
      </div>

      {/* 4. ASSETS & PRIORITY */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up stagger-3">
        <Card>
          <CardHeader><CardTitle>Top Problematic Assets</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {data.topAssets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topAssets} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="asset_name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="wo_count" name="Work Orders" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground">No assets data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>WO by Priority</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={(dash.wo_by_priority || []).filter(p => p.count > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="priority">
                  {(dash.wo_by_priority || []).filter(p => p.count > 0).map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.priority] || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 5. TECH PERF & PM COMPLIANCE */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up stagger-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Technician Performance Leaderboard</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr><th className="px-4 py-3">Technician</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">In Progress</th><th className="px-4 py-3">Overdue</th><th className="px-4 py-3">Rate</th></tr>
                </thead>
                <tbody>
                  {data.techPerformance.length > 0 ? data.techPerformance.slice(0, 5).map(t => (
                    <tr key={t.technician_id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{t.first_name} {t.last_name}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">{t.completed}</td>
                      <td className="px-4 py-3 text-amber-600">{t.in_progress}</td>
                      <td className="px-4 py-3 text-red-600">{t.overdue}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${t.completion_rate}%` }} /></div>
                          <span className="text-xs">{t.completion_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No performance data found</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6 text-center">
          <CardHeader className="p-0 mb-6"><CardTitle>PM Compliance</CardTitle></CardHeader>
          <CompletionGauge percentage={comp.pm_compliance?.rate || 0} size={160} />
          <div className="mt-6 flex justify-between w-full px-6 text-sm">
            <div className="text-center"><div className="font-bold text-emerald-600">{comp.pm_compliance?.completed || 0}</div><div className="text-xs text-muted-foreground">Completed</div></div>
            <div className="text-center"><div className="font-bold text-amber-600">{comp.pm_compliance?.skipped || 0}</div><div className="text-xs text-muted-foreground">Skipped</div></div>
            <div className="text-center"><div className="font-bold text-blue-600">{comp.pm_compliance?.generated || 0}</div><div className="text-xs text-muted-foreground">Generated</div></div>
          </div>
        </Card>
      </div>

      {/* 6. SITE COMPARISON & OVERDUE TREND */}
      {(!isManagerLevel) && data.siteComparison.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle>Site Comparison</CardTitle></CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.siteComparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="site_name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" />
                <Bar dataKey="in_progress" stackId="a" fill="#f59e0b" />
                <Bar dataKey="pending" stackId="a" fill="#3b82f6" />
                <Bar dataKey="overdue" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 7. MORE TRENDS */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up">
        <Card>
          <CardHeader><CardTitle>Overdue Trend</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.overdueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" fill="#fee2e2" stroke="#ef4444" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Workload by Day</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workloadByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 8. ESTIMATED VS ACTUAL & WO BY CATEGORY */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up">
        <Card>
          <CardHeader><CardTitle>Estimated vs Actual Hours</CardTitle><CardDescription>Points above the diagonal line indicate overruns</CardDescription></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="estimated_hours" name="Estimated Hours" unit="h" />
                <YAxis type="number" dataKey="actual_hours" name="Actual Hours" unit="h" />
                <ZAxis type="category" dataKey="title" name="Task" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Work Orders" data={data.estimatedVsActual} fill="#8884d8">
                  {data.estimatedVsActual.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.actual_hours > entry.estimated_hours ? '#ef4444' : '#22c55e'} />
                  ))}
                </Scatter>
                {/* Reference line y=x can be drawn with a dummy line chart or by plotting points. Recharts ReferenceLine could be used here */}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>WO by Category</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.woByCategory} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 9. INVENTORY */}
      {showInventory && comp.inventory_stats && (
        <div className="animate-fade-in-up space-y-6">
          <h2 className="text-2xl font-bold tracking-tight mt-8 flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Inventory Analytics</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={comp.inventory_stats.totalItems || 0} /></div></CardContent></Card>
            <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Quantity</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={comp.inventory_stats.totalQuantity || 0} /></div></CardContent></Card>
            <Card className="card-hover insight-card border-amber-500/30"><CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Low Stock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600"><AnimatedNumber value={comp.inventory_stats.lowStockCount || 0} /></div></CardContent></Card>
            <Card className="card-hover insight-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">₹<AnimatedNumber value={comp.inventory_stats.totalValue || 0} /></div></CardContent></Card>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Top Consumed Parts</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inventoryTopParts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total_used" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Inventory by Category</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inventoryByCategory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" tick={{fontSize: 12}} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="item_count" name="Items" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="total_quantity" name="Quantity" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Inventory Cost Trend</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.inventoryCostTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total_cost" name="Total Cost" fill="#d1fae5" stroke="#10b981" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 10. OTHER METRICS */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up">
        <Card>
          <CardHeader><CardTitle>Asset Stats</CardTitle></CardHeader>
          <CardContent className="h-[250px] flex items-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{name: 'Movable', value: comp.assets_by_type?.movable || 0}, {name: 'Immovable', value: comp.assets_by_type?.immovable || 0}]} 
                       cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                    <Cell fill="#6366f1" />
                    <Cell fill="#06b6d4" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>PM Schedule Status</CardTitle></CardHeader>
          <CardContent className="h-[250px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    {name: 'Active', value: comp.pm_status?.active || 0}, 
                    {name: 'Paused', value: comp.pm_status?.paused || 0},
                    {name: 'Inactive', value: comp.pm_status?.inactive || 0}
                  ]} 
                       cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 11. USER AND AUDIT ANALYTICS (Super Admin / Org Admin ONLY) */}
      {!isManagerLevel && (
        <div className="animate-fade-in-up space-y-6">
          <h2 className="text-2xl font-bold tracking-tight mt-8 flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> User & Audit Analytics</h2>
          <div className="grid gap-6 lg:grid-cols-3">
             <Card>
               <CardHeader><CardTitle>Users by Role</CardTitle></CardHeader>
               <CardContent className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.usersByRole}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="role_name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
             <Card className="lg:col-span-2">
               <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
               <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
               </CardContent>
             </Card>
          </div>
          <Card>
             <CardHeader><CardTitle>Audit Activity (Last 30 Days)</CardTitle></CardHeader>
             <CardContent className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.auditActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} minTickGap={20} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" fill="#e0e7ff" stroke="#6366f1" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}