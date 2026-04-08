import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-nocheck
import { useAreaDetails, useAreaSchedules, useAreaExecutions } from '../hooks/api/useAreas';
import { useChecklists } from '../hooks/api/useChecklists';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { areasApi } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';

export default function AreaDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: areaResponse, isLoading } = useAreaDetails(id);
  const area = areaResponse?.data || areaResponse;
  
  const { data: schedulesResponse } = useAreaSchedules(id);
  const schedules = Array.isArray(schedulesResponse) ? schedulesResponse : (schedulesResponse?.data || []);
  
  // Get executions for this area specifically
  const { data: executionsResponse } = useAreaExecutions({ area_id: id });
  const executions = Array.isArray(executionsResponse) ? executionsResponse : (executionsResponse?.data || []);

  if (isLoading) return <div className="p-8">Loading Area...</div>;
  if (!area) return <div className="p-8">Area not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{area.name}</h1>
          <p className="text-muted-foreground capitalize">{area.type?.replace('_', ' ')} Area</p>
        </div>
      </div>

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">Scheduled Checklists</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-between items-center mt-4">
            <h3 className="text-lg font-medium">Active Schedules</h3>
            <CreateScheduleDialog areaId={area.id} />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Checklist Template</TableHead>
                  <TableHead>Schedule (Cron)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!schedules || schedules.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No schedules attached. Add a checklist template to automatically generate tasks.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.template?.name}</TableCell>
                      <TableCell className="font-mono text-sm">{schedule.cron_expression}</TableCell>
                      <TableCell>
                        <Badge variant={schedule.is_active ? "default" : "secondary"}>
                          {schedule.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Log</CardTitle>
              <CardDescription>History of generated tasks and their completion status.</CardDescription>
            </CardHeader>
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
                {(!executions || executions.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No execution history.
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
  
  const { data: checklistsData } = useChecklists({ is_template: 'true' });
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