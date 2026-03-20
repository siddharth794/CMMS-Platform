// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { pmSchedulesApi } from '../lib/api';
import { useAssetsData } from '../hooks/api/useAssets';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useOrganizations } from '../hooks/api/useOrganizations';
import { useSites } from '../hooks/api/useSites';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';

const CreatePMSchedulePage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [isPending, setIsPending] = useState(false);
  const { hasRole, user } = useAuth();
  
  const isSuperAdmin = hasRole(['super_admin']);
  const isOrgAdmin = hasRole(['org_admin']);
  const isFacilityManager = hasRole(['facility_manager']);

  const { data: orgsData } = useOrganizations({ limit: 1000, enabled: isSuperAdmin });
  const organizations = orgsData?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_id: '',
    org_id: isSuperAdmin ? '' : user?.org_id,
    site_id: isFacilityManager ? (user?.managed_site?.id || user?.site_id || '') : '',
    schedule_logic: 'FIXED',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    estimated_hours: '',
    tasks: ['']
  });

  const { data: sitesData } = useSites({ 
    org_id: formData.org_id, 
    limit: 1000, 
    enabled: !!formData.org_id && (isSuperAdmin || isOrgAdmin)
  });
  const sites = sitesData?.data || [];

  const { data: assetsData } = useAssetsData({
    org_id: formData.org_id || undefined,
    site_id: formData.site_id || undefined
  });
  const assets = assetsData?.data || [];

  useEffect(() => {
    if (user && !isSuperAdmin && !formData.org_id) {
       setFormData(prev => ({ ...prev, org_id: user.org_id }));
    }
    if (user && isFacilityManager && !formData.site_id) {
       setFormData(prev => ({ ...prev, site_id: user?.managed_site?.id || user?.site_id }));
    }
  }, [user, isSuperAdmin, isFacilityManager]);

  const getCronFromFrequency = (freq, startDateStr) => {
    const date = new Date(startDateStr);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    
    try {
      // Basic validation
      if (isSuperAdmin && (!formData.org_id || formData.org_id === 'none')) {
        throw new Error('Please select an organization');
      }
      
      if (!formData.site_id || formData.site_id === 'none') {
        throw new Error('Please select a site');
      }

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
        is_paused: false,
        triggers: [
          {
            trigger_type: 'TIME',
            cron_expression: getCronFromFrequency(formData.frequency, formData.startDate),
            lead_time_days: 7 // Generate WO 7 days before due date
          }
        ],
        template: {
          priority: formData.priority,
          estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined
        },
        tasks: formData.tasks.filter(t => t.trim() !== '').map(t => ({ description: t }))
      };

      await pmSchedulesApi.create(payload);
      addNotification('success', 'PM Schedule created successfully');
      navigate('/pm-schedules');
    } catch (error) {
      addNotification('error', error.message || error.response?.data?.detail || 'Failed to create PM schedule');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pm-schedules')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create PM Schedule</h1>
            <p className="text-muted-foreground">Define a robust preventive maintenance schedule.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/pm-schedules')}>
            Cancel
          </Button>
          <Button type="submit" form="pm-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Schedule
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
                  <Label>Organization *</Label>
                  <Select 
                      value={formData.org_id} 
                      onValueChange={(v) => setFormData({ ...formData, org_id: v, site_id: '', asset_id: '' })}
                  >
                      <SelectTrigger>
                      <SelectValue placeholder="Select Organization" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {organizations.map(o => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                </div>
              )}

              {isSuperAdmin || isOrgAdmin ? (
                <div className="space-y-2">
                  <Label>Site *</Label>
                  <Select 
                      value={formData.site_id} 
                      onValueChange={(v) => setFormData({ ...formData, site_id: v, asset_id: '' })}
                      disabled={isSuperAdmin && !formData.org_id}
                  >
                      <SelectTrigger>
                      <SelectValue placeholder="Select Site" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {sites.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Site</Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user?.managed_site?.name || user?.site?.name || 'Assigned Site'}</span>
                  </div>
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
                  value={formData.asset_id} 
                  onValueChange={(v) => setFormData({ ...formData, asset_id: v })} 
                  required
                  disabled={!formData.site_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.site_id ? "Select site first" : "Select an asset"} />
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
                <Select value={formData.schedule_logic} onValueChange={(v) => setFormData({ ...formData, schedule_logic: v })}>
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
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })} required>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(new Date(formData.startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? new Date(formData.startDate) : undefined}
                      onSelect={(date) => setFormData({ ...formData, startDate: date ? date.toISOString().split('T')[0] : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.schedule_logic === 'FIXED' 
                    ? 'Used to set the recurring day (e.g., if you pick 15th, it repeats on 15th).' 
                    : 'The very first work order will start based on this date.'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Work Order Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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

export default CreatePMSchedulePage;
