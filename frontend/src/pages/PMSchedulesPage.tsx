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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Trash, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';

const PMSchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [recordStatus, setRecordStatus] = useState('active');
  const [selectedIds, setSelectedIds] = useState([]);
  
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, [search, page, recordStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await pmSchedulesApi.list({ 
        search, 
        record_status: recordStatus, 
        skip: (page - 1) * 10, 
        limit: 10 
      });
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
          <div className="flex items-center gap-2 max-w-md w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedules by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              data-testid="pm-search-input"
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
                      checked={schedules.length > 0 && selectedIds.length === schedules.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive h-8 w-8"
                          onClick={() => handleDelete(pm.id)}
                          data-testid={`delete-pm-btn-${pm.id}`}
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

      {/* Edit Dialog */}
      
    </div>
  );
};

export default PMSchedulesPage;
