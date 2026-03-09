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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import AssetsBulkUploadDialog from '../components/AssetsBulkUploadDialog';
import { Pagination } from '../components/ui/pagination';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Loader2, MapPin, Trash, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const { isManager } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  
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
      setAssets(response.data.data || response.data || []);
      setTotal(response.data.total || (response.data.data || response.data || []).length);
      setSelectedIds([]);
    } catch (error) {
      addNotification('error', 'Failed to fetch assets');
    } finally {
      setLoading(false);
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
      setSelectedIds((assets || []).map((a) => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  
  

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
            <Button onClick={() => navigate('/assets/new')} data-testid="create-asset-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  New Asset
                </Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Asset Tag</TableHead>
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
                (assets || []).map((asset) => (
                  <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}>
                    {isManager() && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(asset.id)}
                          onCheckedChange={() => toggleSelect(asset.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <Link to={`/assets/${asset.id}`} className="text-primary hover:underline">
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{asset.asset_tag}</TableCell>
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
                    <TableCell className="text-right">
                      {isManager() && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive h-8 w-8"
                          onClick={() => handleDelete(asset.id)}
                          data-testid={`delete-asset-btn-${asset.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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

      

      
    </div>
  );
};

export default AssetsPage;
