// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventoryItem, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '../hooks/api/useInventory';
import { useOrganizations } from '../hooks/api/useOrganizations';
import { useSites } from '../hooks/api/useSites';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';
import { Loader2, ArrowLeft, Save, Trash2, Box, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const InventoryDetailPage = () => {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user, hasRole } = useAuth();
  const { data: item, isLoading, isError } = useInventoryItem(id);
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  const isSuperAdmin = hasRole(['super_admin']);
  const isOrgAdmin = hasRole(['org_admin']);
  const isManager = hasRole(['facility_manager']);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    storage_location: '',
    quantity: 0,
    min_quantity: 0,
    unit_cost: '0',
    org_id: '',
    site_id: '',
  });

  const { data: orgsData } = useOrganizations({ limit: 1000, enabled: isSuperAdmin && isNew });
  const organizations = orgsData?.data || [];

  const { data: sitesData } = useSites({ 
    org_id: formData.org_id, 
    limit: 1000, 
    enabled: (isSuperAdmin || isOrgAdmin) && isNew 
  });
  const sites = sitesData?.data || [];

  useEffect(() => {
    if (item && !isNew) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        description: item.description || '',
        category: item.category || '',
        storage_location: item.storage_location || '',
        quantity: item.quantity || 0,
        min_quantity: item.min_quantity || 0,
        unit_cost: item.unit_cost || 0,
        org_id: item.org_id || '',
        site_id: item.site_id || '',
      });
    }
  }, [item, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await createMutation.mutateAsync(formData);
        addNotification('success', 'Inventory item created successfully');
        navigate('/inventory');
      } else {
        await updateMutation.mutateAsync({
          id,
          data: formData
        });
        addNotification('success', 'Inventory item updated successfully');
      }
    } catch (error) {
      addNotification('error', error.response?.data?.detail || (isNew ? 'Failed to create item' : 'Failed to update item'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addNotification('success', 'Item deleted successfully');
      navigate('/inventory');
    } catch (error) {
      addNotification('error', 'Failed to delete item');
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((isError || !item) && !isNew) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Item not found</h2>
        <Button variant="link" onClick={() => navigate('/inventory')}>Back to Inventory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isNew ? 'Create New Item' : (item?.name || 'Loading...')}</h1>
            {!isNew && item && <p className="text-muted-foreground">SKU: {item.sku}</p>}
          </div>
        </div>
        <Button type="submit" form="inventory-form" disabled={(isNew ? createMutation.isPending : updateMutation.isPending)}>
          {(isNew ? createMutation.isPending : updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isNew ? 'Create Item' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={cn("space-y-6", isNew ? "md:col-span-4" : "md:col-span-3")}>
          <CardHeader>
            <CardTitle>{isNew ? 'New Item Details' : 'Item Details'}</CardTitle>
            <CardDescription>{isNew ? 'Enter basic information for the new inventory item' : 'Update inventory levels, cost, and location'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="inventory-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    {isNew ? (
                      <Select 
                          value={formData.org_id} 
                          onValueChange={(v) => setFormData({ ...formData, org_id: v, site_id: '' })}
                      >
                          <SelectTrigger>
                          <SelectValue placeholder="Select Organization" />
                          </SelectTrigger>
                          <SelectContent>
                          {organizations.map(o => (
                              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                    ) : (
                      <Input value={item?.org?.name || user?.org_name || '...'} readOnly className="bg-muted" />
                    )}
                  </div>
                )}
                
                {!isManager && (
                  <div className="space-y-2">
                    <Label>Site</Label>
                    {isNew && (isSuperAdmin || isOrgAdmin) ? (
                      <Select 
                          value={formData.site_id} 
                          onValueChange={(v) => setFormData({ ...formData, site_id: v })}
                          disabled={!formData.org_id}
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
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {item?.site?.name || 'Assigned Site'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="storage_location"
                    value={formData.storage_location}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity On Hand</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Min. Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Unit Cost (₹)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value.toString() })}
                    required
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
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Box className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {formData.quantity <= formData.min_quantity ? 'Low Stock' : 'In Stock'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isNew ? 'Adding to organization' : `Added ${item ? format(new Date(item.created_at), 'PP') : '...'}`}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Last Reordered</p>
                <p className="font-medium">-</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Value Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Unit Cost</Label>
                <p className="font-medium">₹{parseFloat(formData.unit_cost || 0).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Value</Label>
                <p className="font-medium">₹{(formData.quantity * parseFloat(formData.unit_cost || 0)).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDetailPage;
