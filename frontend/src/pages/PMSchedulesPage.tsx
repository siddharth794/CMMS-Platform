// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { pmSchedulesApi, assetsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Pagination } from '../components/ui/pagination';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Trash, Loader2, AlertTriangle, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOrganizations } from '../hooks/api/useOrganizations';
import { useSites } from '../hooks/api/useSites';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { MapPin, RefreshCw } from 'lucide-react';

const PMSchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [recordStatus, setRecordStatus] = useState('active');
  const [orgId, setOrgId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  const navigate = useNavigate();
  const { isManager, hasRole, user } = useAuth();
  const { addNotification } = useNotification();

  const isSuperAdmin = hasRole(['super_admin']);
  const isOrgAdmin = hasRole(['org_admin']);
  const isFacilityManager = hasRole(['facility_manager']);

  const { data: orgsData } = useOrganizations({ limit: 1000 });
  const organizations = orgsData?.data || [];
  const { data: sitesData } = useSites({ 
    org_id: isSuperAdmin ? (orgId || '') : user?.org_id, 
    limit: 1000,
    enabled: !!(isSuperAdmin ? orgId : user?.org_id)
  });
  const sites = sitesData?.data || [];
  
  const [assets, setAssets] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_id: '',
    frequency_type: 'days',
    frequency_value: 30,
    priority: 'medium',
    estimated_hours: '',
    next_due: new Date(),
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState(null);

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, [search, page, recordStatus, orgId, siteId]);

  const fetchAssets = async () => {
    try {
      const res = await assetsApi.list();
      setAssets(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch assets', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const payload = {
        search,
        record_status: recordStatus,
        skip: (page - 1) * 10,
        limit: 10
      };

      if (isSuperAdmin) {
        payload.org_id = orgId;
        payload.site_id = siteId;
      } else if (isOrgAdmin) {
        payload.org_id = user?.org_id;
        payload.site_id = siteId;
      } else if (isFacilityManager) {
        payload.org_id = user?.org_id;
        payload.site_id = user?.managed_site?.id || user?.site_id;
      }

      const res = await pmSchedulesApi.list(payload);
      setSchedules(res.data.data || res.data || []);
      setTotal(res.data.total || (res.data.data || res.data || []).length);
      setSelectedIds([]);
    } catch (error) {
      addNotification('error', 'Failed to fetch PM schedules');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      asset_id: '',
      frequency_type: 'days',
      frequency_value: 30,
      priority: 'medium',
      estimated_hours: '',
      next_due: addDays(new Date(), 30),
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        frequency_value: parseInt(formData.frequency_value),
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        next_due: formData.next_due.toISOString(),
      };
      await pmSchedulesApi.create(data);
      addNotification('success', 'PM Schedule created');
      setCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedPM) return;
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        frequency_value: parseInt(formData.frequency_value),
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        next_due: formData.next_due.toISOString(),
      };
      await pmSchedulesApi.update(selectedPM.id, data);
      addNotification('success', 'PM Schedule updated');
      setEditOpen(false);
      setSelectedPM(null);
      resetForm();
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pmId) => {
    if (!confirm(recordStatus === 'active' ? 'Delete this PM schedule?' : 'Permanently delete this PM schedule?')) return;
    try {
      await pmSchedulesApi.delete(pmId);
      addNotification('success', recordStatus === 'active' ? 'PM Schedule deactivated' : 'PM Schedule permanently deleted');
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to delete schedule');
    }
  };

  const handleRestore = async (pmId) => {
    try {
      await pmSchedulesApi.restore(pmId);
      addNotification('success', 'PM Schedule restored');
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to restore schedule');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} schedules?`)) return;
    
    setSubmitting(true);
    try {
      await pmSchedulesApi.bulkDelete({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} schedules ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to bulk delete schedules');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === schedules.length && schedules.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds((schedules || []).map((a) => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const PMForm = ({ onSubmit, isEdit = false }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Monthly HVAC Filter Change"
          required
          data-testid="pm-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Asset *</Label>
        <Select value={formData.asset_id} onValueChange={(v) => setFormData({ ...formData, asset_id: v })} required>
          <SelectTrigger data-testid="pm-asset-select">
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={formData.frequency_value}
              onChange={(e) => setFormData({ ...formData, frequency_value: e.target.value })}
              min="1"
              className="w-20"
              data-testid="pm-frequency-input"
            />
            <Select value={formData.frequency_type} onValueChange={(v) => setFormData({ ...formData, frequency_type: v })}>
              <SelectTrigger data-testid="pm-frequency-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
            <SelectTrigger data-testid="pm-priority-select">
              <SelectValue />
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

      <div className="space-y-2">
        <Label>Next Due Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !formData.next_due && "text-muted-foreground")}
              data-testid="pm-date-picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.next_due ? format(formData.next_due, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.next_due}
              onSelect={(date) => setFormData({ ...formData, next_due: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated_hours">Estimated Hours</Label>
        <Input
          id="estimated_hours"
          type="number"
          value={formData.estimated_hours}
          onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
          min="0"
          data-testid="pm-hours-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          data-testid="pm-description-input"
        />
      </div>

      
    </form>
  );

  return (
    <div className="space-y-6" data-testid="pm-schedules-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preventive Maintenance</h1>
          <p className="text-muted-foreground">Schedule recurring maintenance tasks</p>
        </div>
        {isManager() && (
          <Button data-testid="create-pm-btn" onClick={() => navigate('/pm-schedules/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        )}
      </div>

      {/* Filters, Search & Table */}
      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap gap-4 items-center w-full">
            <div className="flex-1 min-w-[250px] flex items-center gap-2 rounded-lg border px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-primary">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schedules..."
                className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent flex-1"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {isSuperAdmin && (
              <div className="w-[180px]">
                <Select value={orgId || 'all'} onValueChange={(v) => { setOrgId(v === 'all' ? '' : v); setSiteId(''); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(isSuperAdmin || isOrgAdmin) && (
              <div className="w-[180px]">
                <Select value={siteId || 'all'} onValueChange={(v) => { setSiteId(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={isSuperAdmin && !orgId ? "Select organization" : "All Sites"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isManager() && selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={submitting}>
                <Trash className="mr-2 h-4 w-4" />
                Delete ({selectedIds.length})
              </Button>
            )}
            <div className="w-[180px]">
              <Select value={recordStatus} onValueChange={(v) => { setRecordStatus(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
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
                      checked={schedules.length > 0 && selectedIds.length === schedules.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                {(isSuperAdmin || isOrgAdmin) && <TableHead>Site</TableHead>}
                <TableHead>Asset</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>WO Priority</TableHead>
                <TableHead>Logic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No PM schedules found
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((pm) => (
                  <TableRow key={pm.id} data-testid={`pm-row-${pm.id}`}>
                    {isManager() && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(pm.id)}
                          onCheckedChange={() => toggleSelect(pm.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Link to={`/pm-schedules/${pm.id}`} className="font-medium text-primary hover:underline">
                        {pm.name}
                      </Link>
                    </TableCell>
                    {(isSuperAdmin || isOrgAdmin) && (
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-xs">{pm.Asset?.Site?.name || pm.Asset?.site?.name || '-'}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Link to={`/assets/${pm.asset_id}`} className="text-primary hover:underline">
                        {pm.Asset?.name || pm.asset?.name || '-'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {pm.Triggers?.[0]?.trigger_type === 'TIME' || pm.triggers?.[0]?.trigger_type === 'TIME' ? (
                        <span className="text-sm border px-2 py-1 rounded bg-muted">Cron: {pm.Triggers?.[0]?.cron_expression || pm.triggers?.[0]?.cron_expression}</span>
                      ) : (
                        <span className="text-sm border px-2 py-1 rounded bg-muted">Meter-based</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge priority-${pm.Template?.priority || pm.template?.priority || 'medium'}`}>
                        {pm.Template?.priority || pm.template?.priority || 'medium'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {pm.schedule_logic === 'FIXED' ? 'Strict Calendar' : 'Floating'}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${pm.is_paused ? 'status-cancelled' : 'status-completed'}`}>
                        {pm.is_paused ? 'Paused' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isManager() && (
                        <div className="flex justify-end gap-2">
                          {recordStatus === 'inactive' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary h-8 w-8"
                              onClick={() => handleRestore(pm.id)}
                              title="Restore PM Schedule"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive h-8 w-8"
                            onClick={() => handleDelete(pm.id)}
                            data-testid={`delete-pm-btn-${pm.id}`}
                            title={recordStatus === 'active' ? 'Delete PM Schedule' : 'Delete Permanently'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Edit Dialog */}
      
    </div>
  );
};

export default PMSchedulesPage;
