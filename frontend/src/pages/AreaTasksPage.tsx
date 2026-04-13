// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAreaExecutions } from '../hooks/api/useAreas';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, MapPin, QrCode, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AreaTasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch pending and in_progress tasks
  const { data: executionsResponse, isLoading } = useAreaExecutions({ status: 'PENDING,IN_PROGRESS' });
  const rawExecutions = Array.isArray(executionsResponse) ? executionsResponse : (executionsResponse?.data || []);

  // Only show tasks that belong to the cleaner's assigned site, unless they are a Super Admin
  const executions = user?.site_id 
    ? rawExecutions.filter((exec: any) => {
        const siteId = exec.area?.Floor?.site_id || exec.area?.floor?.site_id || exec.area?.site_id;
        return siteId === user.site_id;
      }) 
    : rawExecutions;

  if (isLoading) return <div className="p-4 text-center">Loading your tasks...</div>;

  return (
    <div className="space-y-6" data-testid="area-tasks-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Area Tasks</h1>
          <p className="text-muted-foreground">Scan QR codes at locations to unlock and complete your assigned checklists</p>
        </div>
      </div>

      {(!executions || executions.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-medium">All Caught Up!</h3>
            <p className="text-muted-foreground mt-2">There are no pending area tasks right now.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {executions.map((exec: any) => (
                <div 
                  key={exec.id} 
                  className={`cursor-pointer transition-colors hover:bg-slate-50 flex items-center justify-between p-6 ${exec.status === 'IN_PROGRESS' ? 'bg-primary/5' : ''}`}
                  onClick={() => navigate(`/area-tasks/${exec.id}`)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-lg">{exec.area?.name}</span>
                      <Badge variant={exec.status === 'IN_PROGRESS' ? "default" : "outline"} className="ml-2">
                        {exec.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Clock className="w-4 h-4" />
                      Due: {format(new Date(exec.scheduled_for), 'h:mm a, MMM d')}
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <QrCode className="w-4 h-4" />
                      Scan to Unlock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}