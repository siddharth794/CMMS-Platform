// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateInventoryItem } from '../hooks/api/useInventory';
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
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const InventoryCreatePage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user, hasRole } = useAuth();
  const createMutation = useCreateInventoryItem();
  
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
    org_id: isSuperAdmin ? '' : user?.org_id,
    site_id: hasRole(['facility_manager']) ? user?.site_id : '',
  });

  const { data: orgsData } = useOrganizations({ limit: 1000, enabled: isSuperAdmin });
  const organizations = orgsData?.data || [];

  const { data: sitesData } = useSites({ 
    org_id: formData.org_id, 
    limit: 1000, 
    enabled: !!formData.org_id 
  });
  const sites = sitesData?.data || [];

  useEffect(() => {
    if (user) {
      setFormData(prev => {
        const updates = {};
        if (!isSuperAdmin && !prev.org_id) updates.org_id = user.org_id;
        
        // If site_id is missing and user is a manager, try to find it
        if (isManager && !prev.site_id) {
           if (user.site_id) {
             updates.site_id = user.site_id;
           } else if (sites.length > 0) {
             // Try to find a site where user is the manager, or just take the first one if only one available
             const targetSite = sites.find(s => s.manager_id === user.id) || (sites.length === 1 ? sites[0] : null);
             if (targetSite) {
               updates.site_id = targetSite.id;
             }
           }
        }
        
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [user, isSuperAdmin, isManager, sites, formData.site_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final attempt to resolve site_id for FM before validation
    let finalSiteId = formData.site_id;
    if (isManager && !finalSiteId) {
      finalSiteId = user?.site_id || sites.find(s => s.manager_id === user?.id)?.id || (sites.length === 1 ? sites[0].id : '');
    }

    // Validation
    if (isSuperAdmin && !formData.org_id) {
      addNotification('error', 'Organization is mandatory');
      return;
    }
    if (!finalSiteId) {
      addNotification('error', isManager ? 'Your assigned site information is missing. Please contact administrator.' : 'Site is mandatory');
      return;
    }

    try {
      await createMutation.mutateAsync({ ...formData, site_id: finalSiteId });
      addNotification('success', 'Inventory item created successfully');
      navigate('/inventory');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Item</h1>
            <p className="text-muted-foreground">Add a new item to the inventory</p>
          </div>
        </div>
        <Button type="submit" form="inventory-form" disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Create Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>Enter the information for the new inventory item. All fields marked with * are mandatory.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="inventory-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="org_id">Organization *</Label>
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
                </div>
              )}
              
              {!hasRole(['facility_manager']) && (
                <div className="space-y-2">
                  <Label htmlFor="site_id">Site *</Label>
                  <Select 
                    value={formData.site_id} 
                    onValueChange={(v) => setFormData({ ...formData, site_id: v })}
                    disabled={!formData.org_id}
                  >
                    <SelectTrigger data-testid="site-select">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
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
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_location">Storage Location *</Label>
                <Input
                  id="storage_location"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity On Hand *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_quantity">Min. Quantity *</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Unit Cost (₹) *</Label>
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
    </div>
  );
};

export default InventoryCreatePage;
