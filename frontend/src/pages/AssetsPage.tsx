// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assetsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import AssetsBulkUploadDialog from '../components/AssetsBulkUploadDialog';
import { Pagination } from '../components/ui/pagination';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2, Box, MapPin, Trash } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const { isManager } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    asset_type: 'movable',
    category: '',
    description: '',
    location: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    status: 'active',
  });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [recordStatus, setRecordStatus] = useState('active');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchAssets();
  }, [search, page, recordStatus]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await assetsApi.list({ search, record_status: recordStatus, skip: (page - 1) * 10, limit: 10 });
      setAssets(response.data.data);
      setTotal(response.data.total);
      setSelectedIds([]);
    } catch (error) {
      addNotification('error', 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      asset_tag: '',
      asset_type: 'movable',
      category: '',
      description: '',
      location: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      status: 'active',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.purchase_date) payload.purchase_date = null;
      if (!payload.warranty_expiry) payload.warranty_expiry = null;

      await assetsApi.create(payload);
      addNotification('success', 'Asset created');
      setCreateOpen(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.purchase_date) payload.purchase_date = null;
      if (!payload.warranty_expiry) payload.warranty_expiry = null;

      await assetsApi.update(selectedAsset.id, payload);
      addNotification('success', 'Asset updated');
      setEditOpen(false);
      setSelectedAsset(null);
      resetForm();
      fetchAssets();
    } catch (error) {
      addNotification('error', 'Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm(recordStatus === 'active' ? 'Delete this asset?' : 'Permanently delete this asset?')) return;
    try {
      await assetsApi.delete(assetId);
      addNotification('success', recordStatus === 'active' ? 'Asset deactivated' : 'Asset permanently deleted');
      fetchAssets();
    } catch (error) {
      addNotification('error', 'Failed to delete asset');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} assets?`)) return;
    
    setSubmitting(true);
    try {
      await assetsApi.bulkDelete({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} assets ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
      setSelectedIds([]);
      fetchAssets();
    } catch (error) {
      addNotification('error', 'Failed to bulk delete assets');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length && assets.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map((a) => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const openEditDialog = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      asset_tag: asset.asset_tag || '',
      asset_type: asset.asset_type,
      category: asset.category || '',
      description: asset.description || '',
      location: asset.location || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : '',
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().split('T')[0] : '',
      status: asset.status,
    });
    setEditOpen(true);
  };

  const renderAssetForm = ({ onSubmit, isEdit = false }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="asset-name-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset_tag">Asset Tag</Label>
          <Input
            id="asset_tag"
            value={formData.asset_tag}
            onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
            placeholder="Auto-generated if empty"
            data-testid="asset-tag-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
            <SelectTrigger data-testid="asset-type-select">
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
            <SelectTrigger data-testid="asset-category-select">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Fire safety">Fire safety</SelectItem>
              <SelectItem value="elevator">Elevator</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="it equipments">IT Equipments</SelectItem>
              <SelectItem value="others">Others</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Building A - Floor 1"
          data-testid="asset-location-input"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            data-testid="asset-manufacturer-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            data-testid="asset-model-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial_number">Serial Number</Label>
          <Input
            id="serial_number"
            value={formData.serial_number}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            data-testid="asset-serial-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Purchase Date</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            data-testid="asset-purchase-date-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warranty_expiry">Warranty Expire</Label>
          <Input
            id="warranty_expiry"
            type="date"
            value={formData.warranty_expiry}
            onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
            data-testid="asset-warranty-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          data-testid="asset-description-input"
        />
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger data-testid="asset-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Under Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => isEdit ? setEditOpen(false) : setCreateOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} data-testid="asset-submit-btn">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6" data-testid="assets-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage your facility equipment and infrastructure</p>
        </div>
        {isManager() && (
          <div className="flex items-center gap-2">
            <AssetsBulkUploadDialog onUploadSuccess={fetchAssets} />
            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="create-asset-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  New Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription>Enter the asset details</DialogDescription>
                </DialogHeader>
                {renderAssetForm({ onSubmit: handleCreate })}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Search & Table */}
      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-2 max-w-md w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets by name, tag, or location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              data-testid="asset-search-input"
            />
          </div>
          <div className="flex items-center gap-2">
            {isManager() && selectedIds.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} disabled={submitting}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="w-[180px]">
              <Select value={recordStatus} onValueChange={(v) => { setRecordStatus(v); setPage(1); }}>
                <SelectTrigger data-testid="filter-record-status">
                  <SelectValue placeholder="Record Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                {isManager() && (
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={assets.length > 0 && selectedIds.length === assets.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}>
                    {isManager() && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(asset.id)}
                          onCheckedChange={() => toggleSelect(asset.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-sm">{asset.asset_tag}</TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/assets/${asset.id}`} className="text-primary hover:underline">
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-muted-foreground">{asset.asset_type}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.category || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {asset.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${asset.status === 'active' ? 'status-completed' : asset.status === 'maintenance' ? 'status-in_progress' : 'status-cancelled'}`}>
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`asset-actions-${asset.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/assets/${asset.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedAsset(asset); setViewOpen(true); }}>
                            <Box className="mr-2 h-4 w-4" />Quick View
                          </DropdownMenuItem>
                          {isManager() && (
                            <DropdownMenuItem onClick={() => openEditDialog(asset)}>
                              <Edit className="mr-2 h-4 w-4" />Edit (Modal)
                            </DropdownMenuItem>
                          )}
                          {isManager() && (
                            <DropdownMenuItem onClick={() => handleDelete(asset.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />{recordStatus === 'active' ? 'Delete' : 'Delete Permanently'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={page}
            totalItems={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setSelectedAsset(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update the asset details</DialogDescription>
          </DialogHeader>
          {renderAssetForm({ onSubmit: handleEdit, isEdit: true })}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setSelectedAsset(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Name</span>
                <span className="font-medium">{selectedAsset?.name || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Asset Tag</span>
                <span className="font-medium">{selectedAsset?.asset_tag || '-'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Type</span>
                <span className="capitalize">{selectedAsset?.asset_type || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Category</span>
                <span className="capitalize">{selectedAsset?.category || '-'}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">Location</span>
              <span>{selectedAsset?.location || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Manufacturer</span>
                <span>{selectedAsset?.manufacturer || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Model</span>
                <span>{selectedAsset?.model || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Serial Number</span>
                <span>{selectedAsset?.serial_number || '-'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Purchase Date</span>
                <span>{selectedAsset?.purchase_date ? format(new Date(selectedAsset.purchase_date), 'MMM d, yyyy') : '-'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Warranty Expiry</span>
                <span>{selectedAsset?.warranty_expiry ? format(new Date(selectedAsset.warranty_expiry), 'MMM d, yyyy') : '-'}</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block">Description</span>
              <p className="text-sm">{selectedAsset?.description || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Status</span>
              <span className={`status-badge ${selectedAsset?.status === 'active' ? 'status-completed' : selectedAsset?.status === 'maintenance' ? 'status-in_progress' : 'status-cancelled'}`}>
                {selectedAsset?.status || '-'}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;
