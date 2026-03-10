// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useCreateWorkOrder } from '../hooks/api/useWorkOrders';
import { useAssetsData } from '../hooks/api/useAssets';

const CreateWorkOrderPage = () => {
  const navigate = useNavigate();
  const { isRequester } = useAuth();
  const { addNotification } = useNotification();
  const createMutation = useCreateWorkOrder();
  const { data: assetsData } = useAssetsData();
  const assets = assetsData?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    asset_id: '',
    location: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.asset_id === 'none') {
        delete payload.asset_id;
      }
      const wo = await createMutation.mutateAsync(payload);
      addNotification('success', 'Work order created successfully');
      navigate('/work-orders');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create work order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/work-orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRequester() ? 'New Request' : 'Create Work Order'}
            </h1>
            <p className="text-muted-foreground">Submit a new maintenance request or issue.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/work-orders')}>
            Cancel
          </Button>
          <Button type="submit" form="wo-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRequester() ? 'Submit Request' : 'Create Work Order'}
          </Button>
        </div>
      </div>

      <form id="wo-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Work Order Details</CardTitle>
            <CardDescription>Provide details about the issue or requested work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of the problem..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })} required>
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

              <div className="space-y-2">
                <Label htmlFor="asset_id">Related Asset</Label>
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Building A, Room 101"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateWorkOrderPage;
