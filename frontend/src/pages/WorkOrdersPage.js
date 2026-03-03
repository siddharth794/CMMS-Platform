import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workOrdersApi, assetsApi, usersApi } from '../lib/api';
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
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const { isManager } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_id: '',
    priority: 'medium',
    location: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [woRes, assetsRes, usersRes] = await Promise.all([
        workOrdersApi.list({ ...filters }),
        assetsApi.list(),
        usersApi.list(),
      ]);
      setWorkOrders(woRes.data);
      setAssets(assetsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await workOrdersApi.create(formData);
      toast.success('Work order created');
      setCreateOpen(false);
      setFormData({ title: '', description: '', asset_id: '', priority: 'medium', location: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (assigneeId) => {
    if (!selectedWO) return;
    try {
      await workOrdersApi.assign(selectedWO.id, { assignee_id: assigneeId });
      toast.success('Work order assigned');
      setAssignOpen(false);
      setSelectedWO(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign work order');
    }
  };

  const handleStatusChange = async (woId, status) => {
    try {
      await workOrdersApi.updateStatus(woId, { status });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (woId) => {
    if (!confirm('Cancel this work order?')) return;
    try {
      await workOrdersApi.delete(woId);
      toast.success('Work order cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel work order');
    }
  };

  return (
    <div className="space-y-6" data-testid="work-orders-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage maintenance requests and tasks</p>
        </div>
        {isManager() && (
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
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={filters.priority || "all"} onValueChange={(v) => setFilters({ ...filters, priority: v === "all" ? "" : v })}>
                <SelectTrigger data-testid="filter-priority">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WO Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Created</TableHead>
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
              ) : workOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No work orders found
                  </TableCell>
                </TableRow>
              ) : (
                workOrders.map((wo) => (
                  <TableRow key={wo.id} data-testid={`wo-row-${wo.id}`}>
                    <TableCell>
                      <Link to={`/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                        {wo.wo_number}
                      </Link>
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
                          {wo.status !== 'completed' && wo.status !== 'cancelled' && (
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
                          {isManager() && wo.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => handleDelete(wo.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Cancel
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
