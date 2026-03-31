// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCreateChecklist } from '../hooks/api/useChecklists';
import { useAssets } from '../hooks/api/useSharedQueries';
import { usePMSchedules } from '../hooks/api/usePMSchedules';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Save, Calendar } from 'lucide-react';

export default function CreateChecklistPage() {
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotification();
  const createMutation = useCreateChecklist();
  
  // Get pre-selected values from URL params
  const preselectedAssetId = searchParams.get('asset_id');
  const preselectedPMScheduleId = searchParams.get('pm_schedule_id');
  
  // Fetch assets for dropdown
  const { data: assets, isLoading: assetsLoading } = useAssets({ limit: 1000 });
  // Fetch PM schedules for dropdown
  const { data: pmSchedulesData } = usePMSchedules({ limit: 1000 });
  const pmSchedules = pmSchedulesData?.data || [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [assetId, setAssetId] = useState(preselectedAssetId || 'none');
  const [pmScheduleId, setPmScheduleId] = useState(preselectedPMScheduleId || 'none');
  const [items, setItems] = useState([{ id: Date.now().toString(), description: '' }]);

  if (!isManager()) {
    return <div className="p-12 text-center text-gray-500">You do not have permission.</div>;
  }

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '' }]);
  };

  const handleItemChange = (id: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, description: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validItems = items.filter(i => i.description.trim()).map((i, idx) => ({
      description: i.description.trim(),
      order_index: idx
    }));

    if (validItems.length === 0) {
      addNotification('error', 'Please add at least one task to the checklist.');
      return;
    }

    // Build payload - only include asset_id or pm_schedule_id if one is selected
    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      is_required: isRequired,
      is_template: true,
      items: validItems
    };
    
    if (assetId !== 'none') {
      payload.asset_id = assetId;
    }
    if (pmScheduleId !== 'none') {
      payload.pm_schedule_id = pmScheduleId;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        // Navigate back to PM schedule if that was the context
        if (preselectedPMScheduleId) {
          navigate(`/pm-schedules/${preselectedPMScheduleId}`);
        } else {
          navigate('/checklists');
        }
      }
    });
  };

  const isSaving = createMutation.isPending;
  const goBack = () => {
    if (preselectedPMScheduleId) {
      navigate(`/pm-schedules/${preselectedPMScheduleId}`);
    } else {
      navigate('/checklists');
    }
  };
  
  const linkedPMSchedule = pmSchedules.find((pm: any) => pm.id === pmScheduleId);

  return (
    <div className="space-y-6">
      {/* Page Header (Matches other Create pages) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Checklist Template</h1>
            <p className="text-muted-foreground">
              {linkedPMSchedule 
                ? `For PM Schedule: ${linkedPMSchedule.name}` 
                : 'Define a new standard operating procedure.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit" form="checklist-form" disabled={!name.trim() || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-4 space-y-6">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Provide a clear name and description for technicians.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="checklist-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Forklift Inspection"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Guidelines or context for this checklist..."
                  rows={3}
                />
              </div>

              {/* Link to Asset or PM Schedule */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="asset">Link to Asset (Optional)</Label>
                    <Select value={assetId} onValueChange={(v) => { setAssetId(v); if (v !== 'none') setPmScheduleId('none'); }}>
                      <SelectTrigger id="asset">
                        <SelectValue placeholder={assetsLoading ? "Loading assets..." : "Select an asset..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No asset (Standalone template)</SelectItem>
                        {assets?.map((asset: any) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name} {asset.asset_tag ? `(${asset.asset_tag})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      When linked, this checklist auto-attaches to work orders for this asset.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pm-schedule">Link to PM Schedule (Optional)</Label>
                    <Select value={pmScheduleId} onValueChange={(v) => { setPmScheduleId(v); if (v !== 'none') setAssetId('none'); }} disabled={assetId !== 'none'}>
                      <SelectTrigger id="pm-schedule">
                        <SelectValue placeholder="Select a PM schedule..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No PM schedule (Standalone template)</SelectItem>
                        {pmSchedules?.map((pm: any) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      When linked, this checklist auto-attaches when PM triggers a work order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-4 border-t">
                <Switch
                  id="is-required"
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="is-required" className="cursor-pointer font-medium text-base">
                    Mandatory for Work Order Completion
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    If enabled, technicians cannot mark a work order as "Pending Review" until every item is checked.
                  </p>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Checklist Tasks Card */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Tasks ({items.filter(i => i.description.trim()).length})</CardTitle>
            <CardDescription>List the individual steps required for this checklist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                <span className="text-sm font-medium text-gray-400 w-4 text-right">{index + 1}.</span>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                  placeholder="e.g., Check hydraulic fluid level"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4 w-full border-dashed"
              onClick={handleAddItem}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
