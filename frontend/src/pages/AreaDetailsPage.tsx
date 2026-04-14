// @ts-nocheck
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-nocheck
import { useAreaDetails, useAreaSchedules, useAreaExecutions, useMutateAreaTask } from '../hooks/api/useAreas';
import { useChecklists } from '../hooks/api/useChecklists';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {  ArrowLeft, Plus, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Search , CalendarClock, History, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { areasApi } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Pagination } from '../components/ui/pagination';
import { Checkbox } from '../components/ui/checkbox';

export default function AreaDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: areaResponse, isLoading } = useAreaDetails(id);
  const area = areaResponse?.data || areaResponse;
  
  // States for Schedules Tab
  const [scheduleRecordStatus, setScheduleRecordStatus] = useState('active');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [schedulePage, setSchedulePage] = useState(1);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  const { data: schedulesResponse } = useAreaSchedules(id, scheduleRecordStatus);
  const schedules = Array.isArray(schedulesResponse) ? schedulesResponse : (schedulesResponse?.data || []);

  // States for History Tab
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] = useState('all');

  // Get executions for this area specifically
  const { data: executionsResponse, isLoading: isLoadingExecutions } = useAreaExecutions({ 
    area_id: id,
    skip: (historyPage - 1) * 10,
    limit: 10,
    search: historySearch,
    status: historyStatus !== 'all' ? historyStatus : undefined
  });
    const rawExecutions = Array.isArray(executionsResponse) ? executionsResponse : (executionsResponse?.data || []);
  const isServerPaginated = executionsResponse && typeof executionsResponse.total === 'number';
  
  let filteredExecutions = rawExecutions;
  if (!isServerPaginated) {
    if (historySearch) {
      filteredExecutions = filteredExecutions.filter((e: any) => 
        e.completer?.first_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
        e.completer?.last_name?.toLowerCase().includes(historySearch.toLowerCase())
      );
    }
    if (historyStatus !== 'all') {
      filteredExecutions = filteredExecutions.filter((e: any) => e.status === historyStatus);
    }
  }

  const totalExecutions = isServerPaginated ? executionsResponse.total : filteredExecutions.length;
  const executions = isServerPaginated ? rawExecutions : filteredExecutions.slice((historyPage - 1) * 10, historyPage * 10);

  const { deleteScheduleMutation, restoreScheduleMutation } = useMutateAreaTask();
  const { addNotification } = useNotification();
  
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm(scheduleRecordStatus === 'active' ? "Are you sure you want to delete this schedule?" : "Are you sure you want to permanently delete this schedule?")) return;
    try {
      await deleteScheduleMutation.mutateAsync({ id: scheduleId, force: scheduleRecordStatus === 'inactive' });
      addNotification("success", scheduleRecordStatus === 'active' ? "Schedule deleted" : "Schedule permanently deleted");
      setSelectedScheduleIds((prev) => prev.filter((id) => id !== scheduleId));
    } catch (err: any) {
      addNotification("error", err.response?.data?.error || "Failed to delete schedule");
    }
  };

  const handleBulkDeleteSchedules = async () => {
    if (!window.confirm(scheduleRecordStatus === 'active' ? `Are you sure you want to delete ${selectedScheduleIds.length} schedules?` : `Are you sure you want to permanently delete ${selectedScheduleIds.length} schedules?`)) return;
    try {
      for (const scheduleId of selectedScheduleIds) {
        await deleteScheduleMutation.mutateAsync({ id: scheduleId, force: scheduleRecordStatus === 'inactive' });
      }
      addNotification("success", `${selectedScheduleIds.length} schedules ${scheduleRecordStatus === 'active' ? 'deleted' : 'permanently deleted'}`);
      setSelectedScheduleIds([]);
    } catch (err: any) {
      addNotification("error", err.response?.data?.error || "Failed to delete some schedules");
    }
  };

  const handleRestoreSchedule = async (scheduleId: string) => {
    try {
      await restoreScheduleMutation.mutateAsync(scheduleId);
      addNotification("success", "Schedule restored");
      setSelectedScheduleIds((prev) => prev.filter((id) => id !== scheduleId));
    } catch (err: any) {
      addNotification("error", err.response?.data?.error || "Failed to restore schedule");
    }
  };

  if (isLoading) return <div className="p-8">Loading Area...</div>;
  if (!area) return <div className="p-8">Area not found.</div>;

  const filteredSchedules = schedules.filter((s: any) => 
    !scheduleSearch || s.template?.name?.toLowerCase().includes(scheduleSearch.toLowerCase())
  );
  const paginatedSchedules = filteredSchedules.slice((schedulePage - 1) * 10, schedulePage * 10);

  const toggleSelectAllSchedules = () => {
    if (selectedScheduleIds.length === paginatedSchedules.length && paginatedSchedules.length > 0) {
      setSelectedScheduleIds([]);
    } else {
      setSelectedScheduleIds(paginatedSchedules.map((s: any) => s.id));
    }
  };

  const toggleSelectSchedule = (scheduleId: string) => {
    setSelectedScheduleIds((prev) => 
      prev.includes(scheduleId) ? prev.filter((id) => id !== scheduleId) : [...prev, scheduleId]
    );
  };

  return (
    <div className="space-y-6" data-testid="area-details-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{area.name}</h1>
            <p className="text-muted-foreground capitalize">{area.type?.replace('_', ' ')} Area</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="schedules" className="space-y-6">
        <TabsList className="flex w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6">
          <TabsTrigger value="schedules" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <CalendarClock className="h-4 w-4" />
            <span className="font-medium">Scheduled Checklists</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 px-1 py-3 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <History className="h-4 w-4" />
            <span className="font-medium">Execution History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end items-center mt-4 mb-4"><CreateScheduleDialog areaId={area.id} /></div>

          <Card>
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
              <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schedules by template name..."
                    value={scheduleSearch}
                    onChange={(e) => { setScheduleSearch(e.target.value); setSchedulePage(1); }}
                  />
                </div>
                <div className="w-[180px]">
                  <Select value={scheduleRecordStatus} onValueChange={(v) => { setScheduleRecordStatus(v); setSchedulePage(1); setSelectedScheduleIds([]); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Record Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedScheduleIds.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDeleteSchedules}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedScheduleIds.length})
                  </Button>
                )}
              </div>
            </div>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={paginatedSchedules.length > 0 && selectedScheduleIds.length === paginatedSchedules.length}
                        onCheckedChange={toggleSelectAllSchedules}
                      />
                    </TableHead>
                    <TableHead>Checklist Template</TableHead>
                    <TableHead>Schedule (Cron)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {scheduleSearch ? 'No schedules match your search.' : 'No schedules attached. Add a checklist template to automatically generate tasks.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSchedules.map((schedule: any) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedScheduleIds.includes(schedule.id)}
                            onCheckedChange={() => toggleSelectSchedule(schedule.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{schedule.template?.name}</TableCell>
                        <TableCell className="font-mono text-sm">{schedule.cron_expression}</TableCell>
                        <TableCell>
                          <Badge variant={schedule.is_active ? "default" : "secondary"}>
                            {schedule.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {scheduleRecordStatus === 'inactive' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary h-8 w-8"
                                onClick={() => handleRestoreSchedule(schedule.id)}
                                title="Restore schedule"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-8 w-8"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              title={scheduleRecordStatus === 'inactive' ? 'Permanently delete schedule' : 'Delete schedule'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination
                currentPage={schedulePage}
                totalItems={filteredSchedules.length}
                onPageChange={setSchedulePage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          
          <Card>
            <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
              <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search executions..."
                    value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                  />
                </div>
                <div className="w-[180px]">
                  <Select value={historyStatus} onValueChange={(v) => { setHistoryStatus(v); setHistoryPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="MISSED">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed By</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingExecutions ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading executions...
                      </TableCell>
                    </TableRow>
                  ) : (!executions || executions.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {historySearch || historyStatus !== 'all' ? 'No executions match your filters.' : 'No execution history.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    executions.map((exec: any) => (
                      <TableRow key={exec.id}>
                        <TableCell>{format(new Date(exec.scheduled_for), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          {exec.status === 'COMPLETED' && <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>}
                          {exec.status === 'MISSED' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Missed</Badge>}
                          {exec.status === 'PENDING' && <Badge variant="outline"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                          {exec.status === 'IN_PROGRESS' && <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1"/> In Progress</Badge>}
                        </TableCell>
                        <TableCell>
                          {exec.completer ? `${exec.completer.first_name} ${exec.completer.last_name}` : '-'}
                        </TableCell>
                        <TableCell>
                          {exec.completed_at ? format(new Date(exec.completed_at), 'MMM d, yyyy HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination
                currentPage={historyPage}
                totalItems={totalExecutions}
                onPageChange={setHistoryPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateScheduleDialog({ areaId }: { areaId: string }) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [cronExp, setCronExp] = useState('0 */2 * * *');
  
  const { data: checklistsData } = useChecklists({ is_template: 'true', standalone_only: 'true', limit: 100 });
  const templates = checklistsData?.data || [];
  
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return addNotification('error', 'Select a template');
    
    try {
      await areasApi.createSchedule(areaId, {
        checklist_template_id: templateId,
        cron_expression: cronExp,
        is_active: true
      });
      addNotification('success', 'Schedule added');
      queryClient.invalidateQueries({ queryKey: ['area_schedules', areaId] });
      setOpen(false);
    } catch (error: any) {
      addNotification('error', error.response?.data?.error || 'Failed to add schedule');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Schedule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Checklist Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Checklist Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
              <SelectContent>
                {templates.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cron Expression (Frequency)</Label>
            <Input value={cronExp} onChange={e => setCronExp(e.target.value)} placeholder="0 */2 * * *" required />
            <p className="text-xs text-muted-foreground">Default: '0 */2 * * *' runs every 2 hours.</p>
          </div>
          <Button type="submit" className="w-full">Create Schedule</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
