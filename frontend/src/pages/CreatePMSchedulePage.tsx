// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { pmSchedulesApi } from '../lib/api';
import { useAssetsData } from '../hooks/api/useAssets';

const CreatePMSchedulePage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [isPending, setIsPending] = useState(false);
  const { data: assetsData } = useAssetsData();
  const assets = assetsData?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_id: '',
    frequency: 'monthly',
    next_due_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await pmSchedulesApi.create(formData);
      addNotification('success', 'PM Schedule created successfully');
      navigate('/pm-schedules');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create PM schedule');
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
            <p className="text-muted-foreground">Define a new preventive maintenance schedule.</p>
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
            <CardTitle>Schedule Details</CardTitle>
            <CardDescription>Enter the primary details for the maintenance schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Monthly HVAC Inspection"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed instructions for the maintenance..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset_id">Asset</Label>
                <Select value={formData.asset_id} onValueChange={(v) => setFormData({ ...formData, asset_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {assets.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.asset_tag})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_due_date">First Due Date *</Label>
                <Input
                  id="next_due_date"
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreatePMSchedulePage;
