// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsset, useCreateAsset, useUpdateAsset, useDeleteAsset } from '../hooks/api/useAssets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft, Save, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { addNotification } = useNotification();
  const { data: asset, isLoading, isError } = useAsset(id);
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();

  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    asset_type: 'movable',
    description: '',
    location: '',
    category: '',
    serial_number: '',
    model: '',
    manufacturer: '',
    purchase_date: '',
    purchase_cost: '',
  });

  useEffect(() => {
    if (asset && !isNew) {
      setFormData({
        name: asset.name || '',
        asset_tag: asset.asset_tag || '',
        asset_type: asset.asset_type || 'movable',
        description: asset.description || '',
        location: asset.location || '',
        category: asset.category || '',
        serial_number: asset.serial_number || '',
        model: asset.model || '',
        manufacturer: asset.manufacturer || '',
        purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
        purchase_cost: asset.purchase_cost || '',
      });
    }
  }, [asset, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await createMutation.mutateAsync(formData);
        addNotification('success', 'Asset created successfully');
        navigate('/assets');
      } else {
        await updateMutation.mutateAsync({
          id,
          data: formData
        });
        addNotification('success', 'Asset updated successfully');
      }
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to save asset');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addNotification('success', 'Asset deleted successfully');
      navigate('/assets');
    } catch (error) {
      addNotification('error', 'Failed to delete asset');
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((isError || !asset) && !isNew) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Asset not found</h2>
        <Button variant="link" onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
    );
  }

  const isSaving = isNew ? createMutation.isPending : updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isNew ? 'Create New Asset' : asset.name}</h1>
            {!isNew && <p className="text-muted-foreground">Tag: {asset.asset_tag}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" form="asset-form" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isNew ? 'Create Asset' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>{isNew ? 'Enter details for the new asset' : 'Update asset details and specifications'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="asset-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset_tag">Asset Tag</Label>
                  <Input
                    id="asset_tag"
                    value={formData.asset_tag}
                    onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movable">Movable</SelectItem>
                      <SelectItem value="immovable">Immovable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HVAC">HVAC</SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Machinery">Machinery</SelectItem>
                      <SelectItem value="Vehicles">Vehicles</SelectItem>
                      <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Building">Building / Infrastructure</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model #</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial #</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block mb-2">Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.purchase_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.purchase_date ? format(new Date(formData.purchase_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.purchase_date ? new Date(formData.purchase_date) : undefined}
                        onSelect={(date) => setFormData({ ...formData, purchase_date: date ? date.toISOString() : '' })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_cost">Purchase Cost (₹)</Label>
                  <Input
                    id="purchase_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                  />
                </div>
              </div>

            </form>
          </CardContent>
        </Card>

        {!isNew && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{asset.status || 'Active'}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {format(new Date(asset.created_at), 'PP')}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Last Maintenance</p>
                  <p className="font-medium">-</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetailPage;
