// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { analyticsApi, inventoryApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  CalendarIcon, TrendingUp, ClipboardList, Box, Calendar as CalIcon,
  AlertTriangle, Package, DollarSign, Activity, Target, BarChart3, CheckIcon
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '../lib/utils';

const STATUS_COLORS = {
  new: '#94a3b8', open: '#3b82f6', in_progress: '#f59e0b',
  on_hold: '#f97316', pending_review: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444',
};
const PRIORITY_COLORS = { low: '#94a3b8', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

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
  const color = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

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
      <p className="text-sm font-medium capitalize">{(payload[0]?.name || label || '').replace(/_/g, ' ')}</p>
      <p className="text-lg font-bold text-primary">{payload[0]?.value}</p>
    </div>
  );
};

/* ── Date Presets ── */
const DATE_PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const AnalyticsPage = () => {
  const { hasRole } = useAuth();
  const isTechnician = hasRole(['technician']);
  const isRequestor = hasRole(['requestor', 'requester']);
  const showInventory = !isTechnician && !isRequestor;

  const [data, setData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appliedRange, setAppliedRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [tempFrom, setTempFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [tempTo, setTempTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activePreset, setActivePreset] = useState(30);

  const parseDateString = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const applyDateRange = () => {
    const from = parseDateString(tempFrom);
    const to = parseDateString(tempTo);
    console.log('[Analytics] Applying date range:', tempFrom, 'to', tempTo);
    console.log('[Analytics] Parsed dates:', from, to);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      setAppliedRange({ from, to });
      setActivePreset(null);
    }
  };

  useEffect(() => {
    console.log('[Analytics] appliedRange changed:', appliedRange);
    fetchData();
  }, [appliedRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: appliedRange.from ? appliedRange.from.toISOString() : undefined,
        end_date: appliedRange.to ? appliedRange.to.toISOString() : undefined,
      };
      console.log('[Analytics] Fetching data with params:', params);
      const [dashRes] = await Promise.all([
        analyticsApi.getDashboard(params),
      ]);
      console.log('[Analytics] Received data:', dashRes.data);
      setData(dashRes.data);

      if (showInventory) {
        try {
          const invRes = await inventoryApi.getStats();
          setInventoryStats(invRes.data);
        } catch { /* ok */ }
      }
    } catch (e) { 
      console.error('Analytics fetch failed:', e); 
    }
    finally { 
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

  const stats = data?.stats || {};
  const woByStatus = (data?.wo_by_status || []).filter(s => s.count > 0);
  const woByPriority = data?.wo_by_priority || [];
  const allStatuses = data?.wo_by_status || [];

  return (
    <div className="space-y-8" data-testid="analytics-page">
      {/* ── Header + Date Range ── */}
      <div className="animate-fade-in-up flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground">Performance metrics and operational insights</p>
        </div>
        <div className="flex items-center gap-2">
          {DATE_PRESETS.map((p) => (
            <Button key={p.days} variant={activePreset === p.days ? 'default' : 'ghost'} size="sm"
              className="text-xs"
              onClick={() => {
                const fromDate = subDays(new Date(), p.days);
                const toDate = new Date();
                const from = format(fromDate, 'yyyy-MM-dd');
                const to = format(toDate, 'yyyy-MM-dd');
                setTempFrom(from);
                setTempTo(to);
                setActivePreset(p.days);
                setAppliedRange({ from: fromDate, to: toDate });
              }}>
              {p.label}
            </Button>
          ))}
          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              className="w-[140px] h-8 text-xs border-0 p-0 focus:ring-0"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              className="w-[140px] h-8 text-xs border-0 p-0 focus:ring-0"
            />
            <Button size="sm" variant="ghost" onClick={() => { console.log('[Analytics] Apply button clicked'); applyDateRange(); }} className="h-7 px-2">
              <CheckIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover insight-card animate-fade-in-up stagger-1" data-testid="kpi-total-wo">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Work Orders</CardTitle>
            <div className="p-2 rounded-lg bg-violet-500/10">
              <ClipboardList className="h-5 w-5 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value"><AnimatedNumber value={stats.total_work_orders || 0} /></div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pending_work_orders || 0} pending</p>
          </CardContent>
        </Card>

        <Card className="card-hover insight-card animate-fade-in-up stagger-2" data-testid="kpi-completion-rate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-emerald-600">
              <AnimatedNumber value={stats.completion_rate || 0} suffix="%" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.completed_work_orders || 0} completed</p>
          </CardContent>
        </Card>

        <Card className="card-hover insight-card animate-fade-in-up stagger-3" data-testid="kpi-assets">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Box className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value"><AnimatedNumber value={stats.total_assets || 0} /></div>
            <p className="text-xs text-muted-foreground mt-1">Being managed</p>
          </CardContent>
        </Card>

        <Card className="card-hover insight-card animate-fade-in-up stagger-4" data-testid="kpi-pm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PM Schedules</CardTitle>
            <div className={`p-2 rounded-lg ${stats.overdue_pms > 0 ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
              {stats.overdue_pms > 0
                ? <AlertTriangle className="h-5 w-5 text-amber-500" />
                : <CalIcon className="h-5 w-5 text-blue-500" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value"><AnimatedNumber value={stats.active_pm_schedules || 0} /></div>
            <p className={cn("text-xs mt-1", stats.overdue_pms > 0 ? "text-amber-600" : "text-muted-foreground")}>
              {stats.overdue_pms > 0 ? `${stats.overdue_pms} overdue` : 'All on schedule'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts + Gauge ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Donut */}
        <Card className="lg:col-span-2 animate-fade-in-up stagger-3" data-testid="chart-status-pie">
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Work orders by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={woByStatus} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                    paddingAngle={3} dataKey="count" nameKey="status"
                    animationBegin={200} animationDuration={1000}>
                    {woByStatus.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry.status] || COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => v.replace(/_/g, ' ')} wrapperStyle={{ paddingTop: 16, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion Gauge (center) */}
        <Card className="lg:col-span-1 animate-fade-in-up stagger-4 flex flex-col items-center justify-center" data-testid="analytics-gauge">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
            <CompletionGauge percentage={stats.completion_rate || 0} size={150} />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">{stats.completed_work_orders || 0} / {stats.total_work_orders || 0}</p>
              <p className="text-xs text-muted-foreground">Work orders completed</p>
            </div>
          </CardContent>
        </Card>

        {/* Priority Bar */}
        <Card className="lg:col-span-2 animate-fade-in-up stagger-5" data-testid="chart-priority-bar">
          <CardHeader>
            <CardTitle className="text-lg">Priority Breakdown</CardTitle>
            <CardDescription>Work orders by urgency level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
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

      {/* ── Status Flow + Summaries ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Flow */}
        <Card className="lg:col-span-2 animate-fade-in-up stagger-5" data-testid="status-flow">
          <CardHeader>
            <CardTitle className="text-lg">Status Flow</CardTitle>
            <CardDescription>Proportion of work orders across each lifecycle stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allStatuses.map((item) => {
                const total = stats.total_work_orders || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }} />
                      <span className="text-xs capitalize text-muted-foreground truncate">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: STATUS_COLORS[item.status] || '#94a3b8',
                        }} />
                    </div>
                    <span className="text-xs font-semibold w-16 text-right tabular-nums">{item.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="animate-fade-in-up stagger-6" data-testid="summary-metrics">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'In Progress', value: stats.in_progress_work_orders, color: 'text-amber-500', icon: '🔄' },
                { label: 'Pending', value: stats.pending_work_orders, color: 'text-blue-500', icon: '⏳' },
                { label: 'Completed', value: stats.completed_work_orders, color: 'text-emerald-500', icon: '✅' },
                { label: 'Overdue PM', value: stats.overdue_pms, color: stats.overdue_pms > 0 ? 'text-red-500' : 'text-muted-foreground', icon: '⚠️' },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{m.icon}</span>
                    <span className="text-sm text-muted-foreground">{m.label}</span>
                  </div>
                  <span className={cn("font-bold tabular-nums", m.color)}>
                    <AnimatedNumber value={m.value || 0} />
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Inventory Health (managers only) ── */}
      {showInventory && inventoryStats && (
        <div className="animate-fade-in-up stagger-6">
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Inventory Health
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-hover insight-card" data-testid="inv-total-items">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-3xl font-bold"><AnimatedNumber value={inventoryStats.total_items || 0} /></p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("card-hover insight-card", inventoryStats.low_stock_count > 0 && "border-amber-500/40")} data-testid="inv-low-stock">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                    <p className={cn("text-3xl font-bold", inventoryStats.low_stock_count > 0 && "text-amber-600")}>
                      <AnimatedNumber value={inventoryStats.low_stock_count || 0} />
                    </p>
                  </div>
                  <div className={cn("p-3 rounded-lg", inventoryStats.low_stock_count > 0 ? "bg-amber-500/10 animate-pulse-amber" : "bg-muted")}>
                    <AlertTriangle className={cn("h-8 w-8", inventoryStats.low_stock_count > 0 ? "text-amber-500" : "text-muted-foreground/50")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover insight-card" data-testid="inv-total-value">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-3xl font-bold">
                      ₹<AnimatedNumber value={inventoryStats.total_value || 0} />
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Auto-Generated Insights ── */}
      <Card className="animate-fade-in-up stagger-6" data-testid="auto-insights">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Quick Insights
          </CardTitle>
          <CardDescription>Auto-generated observations from your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {(() => {
              const items = [];
              if (stats.completion_rate >= 90)
                items.push({ icon: '🏆', text: `Excellent! Your completion rate of ${stats.completion_rate}% is outstanding.`, color: 'border-emerald-500/30 bg-emerald-500/5' });
              else if (stats.completion_rate >= 70)
                items.push({ icon: '👍', text: `Good progress — ${stats.completion_rate}% completion rate. Keep it up!`, color: 'border-blue-500/30 bg-blue-500/5' });
              else if (stats.total_work_orders > 0)
                items.push({ icon: '📈', text: `Completion rate is ${stats.completion_rate}%. Consider reviewing pending work orders.`, color: 'border-amber-500/30 bg-amber-500/5' });

              if (stats.pending_work_orders > 0)
                items.push({ icon: '⏳', text: `${stats.pending_work_orders} work orders are awaiting action.`, color: 'border-amber-500/30 bg-amber-500/5' });
              if (stats.overdue_pms > 0)
                items.push({ icon: '⚠️', text: `${stats.overdue_pms} preventive maintenance schedules are overdue.`, color: 'border-red-500/30 bg-red-500/5' });
              if (inventoryStats?.low_stock_count > 0)
                items.push({ icon: '📦', text: `${inventoryStats.low_stock_count} inventory items are below minimum stock.`, color: 'border-amber-500/30 bg-amber-500/5' });
              if (stats.in_progress_work_orders > 0)
                items.push({ icon: '🔧', text: `${stats.in_progress_work_orders} work orders are actively being worked on.`, color: 'border-blue-500/30 bg-blue-500/5' });
              if (stats.total_assets > 0)
                items.push({ icon: '🏗️', text: `Managing ${stats.total_assets} assets with ${stats.active_pm_schedules || 0} active PM schedules.`, color: 'border-violet-500/30 bg-violet-500/5' });

              if (items.length === 0)
                items.push({ icon: '✨', text: 'No notable alerts — everything looks good!', color: 'border-emerald-500/30 bg-emerald-500/5' });

              return items.slice(0, 6).map((item, i) => (
                <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", item.color)}>
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
