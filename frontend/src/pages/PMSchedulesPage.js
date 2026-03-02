import React, { useState, useEffect } from 'react';
import { pmSchedulesApi, assetsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, MoreHorizontal, Edit, Trash2, Loader2, CalendarIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore, addDays } from 'date-fns';
import { cn } from '../lib/utils';

const PMSchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { isManager } = useAuth();

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pmRes, assetsRes] = await Promise.all([
        pmSchedulesApi.list(),
        assetsApi.list(),
      ]);
      setSchedules(pmRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
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
      toast.success('PM Schedule created');
      setCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create schedule');
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
      toast.success('PM Schedule updated');
      setEditOpen(false);
      setSelectedPM(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pmId) => {
    if (!confirm('Delete this PM schedule?')) return;
    try {
      await pmSchedulesApi.delete(pmId);
      toast.success('PM Schedule deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const openEditDialog = (pm) => {
    setSelectedPM(pm);
    setFormData({
      name: pm.name,
      description: pm.description || '',
      asset_id: pm.asset_id,
      frequency_type: pm.frequency_type,
      frequency_value: pm.frequency_value,
      priority: pm.priority,
      estimated_hours: pm.estimated_hours || '',
      next_due: new Date(pm.next_due),
    });
    setEditOpen(true);
  };

  const isOverdue = (date) => isBefore(new Date(date), new Date());

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
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => isEdit ? setEditOpen(false) : setCreateOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} data-testid="pm-submit-btn">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
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
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="create-pm-btn">
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create PM Schedule</DialogTitle>
                <DialogDescription>Set up a recurring maintenance schedule</DialogDescription>
              </DialogHeader>
              <PMForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Next Due</TableHead>
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
                    <TableCell className="font-medium">{pm.name}</TableCell>
                    <TableCell className="text-muted-foreground">{pm.asset?.name || '-'}</TableCell>
                    <TableCell>{pm.frequency_value} {pm.frequency_type}</TableCell>
                    <TableCell>
                      <span className={`status-badge priority-${pm.priority}`}>{pm.priority}</span>
                    </TableCell>
                    <TableCell>{format(new Date(pm.next_due), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {isOverdue(pm.next_due) ? (
                        <span className="flex items-center gap-1 text-destructive text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Overdue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          On Track
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isManager() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`pm-actions-${pm.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(pm)}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(pm.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setSelectedPM(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit PM Schedule</DialogTitle>
            <DialogDescription>Update the maintenance schedule</DialogDescription>
          </DialogHeader>
          <PMForm onSubmit={handleEdit} isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PMSchedulesPage;
