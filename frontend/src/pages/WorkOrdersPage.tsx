// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, UserPlus, Trash2, Loader2, Download, Trash } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';
import { useWorkOrders, useCreateWorkOrder, useAssignWorkOrder, useUpdateWorkOrderStatus, useDeleteWorkOrder, useBulkDeleteWorkOrders } from '../hooks/api/useWorkOrders';
import { useAssets, useUsers } from '../hooks/api/useSharedQueries';
import { WO_STATUS, WO_PRIORITY, USER_ROLES } from '../lib/constants';
import { WorkOrder, PaginatedResponse, User } from '../types/models';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    new: 'status-new',
    open: 'status-open',
    in_progress: 'status-in_progress',
    on_hold: 'status-on_hold',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };
  return (
    <span className={`status-badge ${statusConfig[status] || 'status-new'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical',
  };
  return (
    <span className={`status-badge ${priorityConfig[priority] || 'priority-medium'}`}>
      {priority}
    </span>
  );
};

const WorkOrdersPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [recordStatus, setRecordStatus] = useState('active');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { isManager, isRequester } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_id: '',
    priority: WO_PRIORITY.MEDIUM as string,
    location: '',
  });

  const { data: woData, isLoading: loading } = useWorkOrders({
    ...filters,
    search,
    record_status: recordStatus,
    skip: (page - 1) * 10,
    limit: 10
  });

  const workOrders = woData?.data || [];
  const total = woData?.total || 0;

  const { data: assets = [] } = useAssets();
  const { data: users = [] } = useUsers();

  const createMutation = useCreateWorkOrder();
  const assignMutation = useAssignWorkOrder();
  const updateStatusMutation = useUpdateWorkOrderStatus();
  const deleteMutation = useDeleteWorkOrder();
  const bulkDeleteMutation = useBulkDeleteWorkOrders();

  const submitting = createMutation.isPending || bulkDeleteMutation.isPending;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, asset_id: formData.asset_id || undefined };
      await createMutation.mutateAsync(payload);
      addNotification('success', 'Work order created');
      setCreateOpen(false);
      setFormData({ title: '', description: '', asset_id: '', priority: WO_PRIORITY.MEDIUM, location: '' });
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to create work order');
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!selectedWO) return;
    try {
      await assignMutation.mutateAsync({ id: selectedWO.id, assignee_id: assigneeId });
      addNotification('success', 'Work order assigned');
      setAssignOpen(false);
      setSelectedWO(null);
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to assign work order');
    }
  };

  const handleStatusChange = async (woId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: woId, status });
      addNotification('success', 'Status updated');
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (woId: string) => {
    if (!window.confirm(recordStatus === 'active' ? 'Delete this work order?' : 'Permanently delete this work order?')) return;
    try {
      await deleteMutation.mutateAsync(woId);
      addNotification('success', recordStatus === 'active' ? 'Work order deactivated' : 'Work order permanently deleted');
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to delete work order');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} work orders?`)) return;
    
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} work orders ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
      setSelectedIds([]);
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to bulk delete work orders');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === workOrders.length && workOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(workOrders.map((wo) => wo.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (workOrders.length === 0) {
      addNotification('info', 'No work orders to export');
      return;
    }

    const exportData = workOrders.map((wo: WorkOrder) => ({
      'WO Number': wo.wo_number,
      'Title': wo.title,
      'Description': wo.description || '',
      'Status': wo.status?.replace('_', ' ') || '',
      'Priority': wo.priority || '',
      'Asset Name': wo.asset?.name || '',
      'Asset Tag': wo.asset?.asset_tag || '',
      'Location': wo.location || wo.asset?.location || '',
      'Assignee': wo.assignee ? `${wo.assignee.first_name || ''} ${wo.assignee.last_name || ''}`.trim() : 'Unassigned',
      'Created By': wo.creator ? `${wo.creator.first_name || ''} ${wo.creator.last_name || ''}`.trim() : '',
      'Created At': wo.created_at ? format(new Date(wo.created_at), 'MMM d, yyyy HH:mm') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Work Orders');
    XLSX.writeFile(wb, `Work_Orders_Export_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    addNotification('success', 'Work orders exported successfully');
  };

  return (
    <div className="space-y-6" data-testid="work-orders-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage maintenance requests and tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="export-wo-btn">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-wo-btn">
                <Plus className="mr-2 h-4 w-4" />
                New Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Work Order</DialogTitle>
                <DialogDescription>Fill in the details for the new work order</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    required
                    data-testid="wo-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description..."
                    rows={3}
                    data-testid="wo-description-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select value={formData.asset_id || "none"} onValueChange={(v) => setFormData({ ...formData, asset_id: v === "none" ? "" : v })}>
                      <SelectTrigger data-testid="wo-asset-select">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger data-testid="wo-priority-select">
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Room 101, Floor 2"
                    data-testid="wo-location-input"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} data-testid="wo-submit-btn">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters, Search & Table */}
      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                data-testid="wo-search-input"
              />
            </div>
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
                  <TableHead className="w-[50px] min-w-[50px]">
                    <Checkbox 
                      checked={workOrders.length > 0 && selectedIds.length === workOrders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className="min-w-[180px] whitespace-nowrap">WO Number</TableHead>
                <TableHead className="min-w-[250px]">Title</TableHead>
                <TableHead className="min-w-[160px]">
                  <Select value={filters.status || "all"} onValueChange={(v) => { setFilters({ ...filters, status: v === 'all' ? '' : v }); setPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none w-[140px] justify-between p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:ring-0 px-2 -ml-2">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="min-w-[160px]">
                  <Select value={filters.priority || "all"} onValueChange={(v) => { setFilters({ ...filters, priority: v === 'all' ? '' : v }); setPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none w-[140px] justify-between p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:ring-0 px-2 -ml-2">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="min-w-[200px]">Asset</TableHead>
                <TableHead className="min-w-[200px]">Assignee</TableHead>
                <TableHead className="min-w-[150px] whitespace-nowrap">Created</TableHead>
                {false && <TableHead className="w-[50px] min-w-[50px]"></TableHead>}
                {!isRequester() && <TableHead className="w-[50px] min-w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isRequester() ? 7 : 8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : workOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isRequester() ? 7 : 8} className="text-center text-muted-foreground py-8">
                    No work orders found
                  </TableCell>
                </TableRow>
              ) : (
                workOrders.map((wo) => (
                  <TableRow key={wo.id} data-testid={`wo-row-${wo.id}`}>
                    {isManager() && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(wo.id)}
                          onCheckedChange={() => toggleSelect(wo.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {isRequester() ? (
                        <span className="font-medium">{wo.wo_number}</span>
                      ) : (
                        <Link to={`/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                          {wo.wo_number}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{wo.title}</TableCell>
                    <TableCell><StatusBadge status={wo.status} /></TableCell>
                    <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                    <TableCell className="text-muted-foreground">{wo.asset?.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {wo.assignee ? `${wo.assignee.first_name} ${wo.assignee.last_name}` : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(wo.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    {!isRequester() && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`wo-actions-${wo.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/work-orders/${wo.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />View
                            </DropdownMenuItem>
                            {isManager() && (
                              <DropdownMenuItem onClick={() => { setSelectedWO(wo); setAssignOpen(true); }}>
                                <UserPlus className="mr-2 h-4 w-4" />Assign
                              </DropdownMenuItem>
                            )}
                            {!isManager() && !isRequester() && wo.status !== 'completed' && wo.status !== 'cancelled' && (
                              <>
                                {wo.status !== 'in_progress' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(wo.id, 'in_progress')}>
                                    Start Work
                                  </DropdownMenuItem>
                                )}
                                {wo.status === 'in_progress' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(wo.id, 'completed')}>
                                    Complete
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {isManager() && (
                              <DropdownMenuItem onClick={() => handleDelete(wo.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />{recordStatus === 'active' ? 'Delete' : 'Delete Permanently'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
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

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Work Order</DialogTitle>
            <DialogDescription>Select a technician to assign this work order to</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {users.filter(u => {
              const roleName = (u.role?.name || u.Role?.name)?.toLowerCase();
              return roleName === 'technician';
            }).map((user) => {
              const roleName = (user.role?.name || user.Role?.name)?.replace('_', ' ');
              return (
                <Button
                  key={user.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAssign(user.id)}
                  data-testid={`assign-user-${user.id}`}
                >
                  {user.first_name} {user.last_name} ({roleName})
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrdersPage;
