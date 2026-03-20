// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { usePMSchedule, useUpdatePMSchedule, useDeletePMSchedule } from '../hooks/api/usePMSchedules';
import { useAssetsData } from '../hooks/api/useAssets';
import { useAuth } from '../context/AuthContext';
import { useOrganizations } from '../hooks/api/useOrganizations';
import { useSites } from '../hooks/api/useSites';
import { MapPin } from 'lucide-react';

const PMScheduleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { data: assetsData } = useAssetsData();
  const assets = assetsData?.data || [];

  const { data: pm, isLoading, isError } = usePMSchedule(id);
  const updateMutation = useUpdatePMSchedule();
  
  const { hasRole, user: currentUser } = useAuth();
  const isSuperAdmin = hasRole(['super_admin']);
  const isOrgAdmin = hasRole(['org_admin']);
  const isFacilityManager = hasRole(['facility_manager']);

  const { data: orgsData } = useOrganizations({ limit: 1000, enabled: isSuperAdmin });
  const organizations = orgsData?.data || [];
  
  const { data: sitesData } = useSites({ 
    org_id: pm?.org_id, 
    limit: 1000, 
    enabled: !!pm?.org_id
  });
  const sites = sitesData?.data || [];


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_id: '',
    org_id: '',
    site_id: '',
    schedule_logic: 'FIXED',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    estimated_hours: '',
    tasks: ['']
  });

  const getInitialDateFromCron = (cron, freq) => {
    // Reverse engineer a safe date string for the picker
    // Default to today if we can't parse perfectly, but we extract what we can
    const parts = cron.split(' ');
    const now = new Date();
    let d = now.getDate();
    let m = now.getMonth();
    
    if (parts.length >= 5) {
      if (freq === 'monthly' || freq === 'quarterly' || freq === 'semi_annual') {
        d = parseInt(parts[2]) || d;
      } else if (freq === 'annual') {
        d = parseInt(parts[2]) || d;
        m = (parseInt(parts[3]) - 1) || m;
      }
    }
    
    const date = new Date(now.getFullYear(), m, d);
    return date.toISOString().split('T')[0];
  };

  const getFrequencyFromCron = (cron) => {
    if (cron === '0 0 * * *') return 'daily';
    if (cron.match(/^0 0 \* \* \d$/)) return 'weekly';
    if (cron.match(/^0 0 \d+ \* \*$/)) return 'monthly';
    if (cron.match(/^0 0 \d+ \*\/\d+ \*$/)) return 'quarterly'; // matches 1/3, 1/6
    if (cron.match(/^0 0 \d+ \d+ \*$/)) return 'annual';
    return 'monthly';
  };

  const getCronFromFrequency = (freq, startDateStr) => {
    const date = new Date(startDateStr);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();

    switch(freq) {
      case 'daily': return '0 0 * * *';
      case 'weekly': return `0 0 * * ${dayOfWeek}`;
      case 'monthly': return `0 0 ${dayOfMonth} * *`;
      case 'quarterly': return `0 0 ${dayOfMonth} */3 *`;
      case 'semi_annual': return `0 0 ${dayOfMonth} */6 *`;
      case 'annual': return `0 0 ${dayOfMonth} ${date.getMonth() + 1} *`;
      default: return '0 0 1 * *';
    }
  };

  useEffect(() => {
    if (pm) {
      const triggers = pm.triggers || pm.Triggers;
      const freq = triggers?.[0]?.cron_expression ? getFrequencyFromCron(triggers[0].cron_expression) : 'monthly';
      setFormData({
        name: pm.name || '',
        description: pm.description || '',
        org_id: pm.org_id || '',
        site_id: pm.site_id || '',
        asset_id: pm.asset_id || '',
        schedule_logic: pm.schedule_logic || 'FIXED',
        frequency: freq,
        startDate: triggers?.[0]?.cron_expression ? getInitialDateFromCron(triggers[0].cron_expression, freq) : new Date().toISOString().split('T')[0],
        priority: (pm.template?.priority || pm.Template?.priority || (Array.isArray(pm.template) ? pm.template[0]?.priority : null) || (Array.isArray(pm.Template) ? pm.Template[0]?.priority : null) || 'medium'),
        estimated_hours: (pm.template?.estimated_hours || pm.Template?.estimated_hours || (Array.isArray(pm.template) ? pm.template[0]?.estimated_hours : null) || (Array.isArray(pm.Template) ? pm.Template[0]?.estimated_hours : null))?.toString() || '',
        tasks: (pm.tasks || pm.Tasks) && (pm.tasks || pm.Tasks).length > 0 ? (pm.tasks || pm.Tasks).map(t => t.description) : ['']
      });
    }
  }, [pm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.asset_id || formData.asset_id === 'none') {
        throw new Error('Please select an asset for this PM schedule');
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        org_id: formData.org_id,
        site_id: formData.site_id,
        asset_id: formData.asset_id,
        schedule_logic: formData.schedule_logic,
        triggers: [
          {
            trigger_type: 'TIME',
            cron_expression: getCronFromFrequency(formData.frequency, formData.startDate),
            lead_time_days: 7 
          }
        ],
        template: {
          priority: formData.priority,
          estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined
        },
        tasks: formData.tasks.filter(t => t.trim() !== '').map(t => ({ description: t }))
      };

      await updateMutation.mutateAsync({ id, data: payload });
      addNotification('success', 'PM Schedule updated successfully');
    } catch (error) {
      const errorMsg = error.response?.data?.errors 
        ? Object.entries(error.response.data.errors).map(([field, msgs]) => `${field}: ${msgs}`).join(', ')
        : error.response?.data?.detail || error.message || 'Failed to update PM schedule';
      addNotification('error', errorMsg);
    }
  };



  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !pm) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">PM Schedule not found</h2>
        <Button variant="link" onClick={() => navigate('/pm-schedules')}>Back to PM Schedules</Button>
      </div>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pm-schedules')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pm.name}</h1>
            <p className="text-muted-foreground">Edit recurrence and maintenance rules.</p>
          </div>
        </div>
        <div className="flex gap-2">

          <Button type="submit" form="pm-form" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <form id="pm-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>Enter the primary details and recurrence logic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
                    <span className="text-sm font-medium">{pm.organization?.name || 'Assigned Organization'}</span>
                  </div>
                </div>
              )}

              {isSuperAdmin || isOrgAdmin ? (
                <div className="space-y-2">
                  <Label>Site</Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pm.site?.name || 'Assigned Site'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Site *</Label>
                  <Select 
                      key={formData.site_id}
                      value={formData.site_id} 
                      onValueChange={(v) => setFormData({ ...formData, site_id: v, asset_id: '' })}
                  >
                      <SelectTrigger>
                      <SelectValue placeholder="Select Site" />
                      </SelectTrigger>
                      <SelectContent>
                      {sites.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Title *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Monthly HVAC Inspection"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="asset_id">Target Asset *</Label>
                <Select 
                  key={formData.asset_id}
                  value={formData.asset_id} 
                  onValueChange={(v) => setFormData({ ...formData, asset_id: v })} 
                  required
                  disabled={!formData.site_id && !isSuperAdmin && !isOrgAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.site_id && isFacilityManager ? "Select site first" : "Select an asset"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select an asset</SelectItem>
                    {assets.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.asset_tag})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="High-level details about this maintenance procedure..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label>Schedule Logic</Label>
                <Select key={formData.schedule_logic} value={formData.schedule_logic} onValueChange={(v) => setFormData({ ...formData, schedule_logic: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed (Strict Calendar)</SelectItem>
                    <SelectItem value="FLOATING">Floating (From last completion)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Fixed logic will always trigger on the exact date. Floating logic adjusts based on delays.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Time Frequency *</Label>
                <Select key={formData.frequency} value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Work Orders generate automatically 7 days before due date.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">
                  {formData.schedule_logic === 'FIXED' ? 'Start Date / Reference Date' : 'First Service Date'}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.schedule_logic === 'FIXED' 
                    ? 'Used to set the recurring day (e.g., if you pick 15th, it repeats on 15th).' 
                    : 'The very first work order will start based on this date.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Work Order Priority</Label>
                <Select key={formData.priority} value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Checklist (Optional)</CardTitle>
            <CardDescription>Define step-by-step tasks for the generated Work Order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground w-6">{idx + 1}.</span>
                <Input 
                  value={task} 
                  onChange={(e) => {
                    const newTasks = [...formData.tasks];
                    newTasks[idx] = e.target.value;
                    setFormData({ ...formData, tasks: newTasks });
                  }} 
                  placeholder="e.g., Inspect drive belts for wear and tear"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive shrink-0"
                  onClick={() => {
                    const newTasks = formData.tasks.filter((_, i) => i !== idx);
                    setFormData({ ...formData, tasks: newTasks.length ? newTasks : [''] });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setFormData({ ...formData, tasks: [...formData.tasks, ''] })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Task Step
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default PMScheduleDetailPage;