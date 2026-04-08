// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAreaExecutions } from '../hooks/api/useAreas';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, MapPin, QrCode, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AreaTasksPage() {
  const navigate = useNavigate();
  // Fetch pending and in_progress tasks
  const { data: executionsResponse, isLoading } = useAreaExecutions({ status: 'PENDING,IN_PROGRESS' });
  const executions = Array.isArray(executionsResponse) ? executionsResponse : (executionsResponse?.data || []);

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
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-medium">All Caught Up!</h3>
            <p className="text-muted-foreground">There are no pending area tasks right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {executions.map((exec: any) => (
            <Card 
              key={exec.id} 
              className={`cursor-pointer transition-shadow hover:shadow-md ${exec.status === 'IN_PROGRESS' ? 'border-primary ring-1 ring-primary' : ''}`}
              onClick={() => navigate(`/area-tasks/${exec.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{exec.area?.name}</span>
                    <Badge variant={exec.status === 'IN_PROGRESS' ? "default" : "outline"}>
                      {exec.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Clock className="w-3 h-3" />
                    Due: {format(new Date(exec.scheduled_for), 'h:mm a, MMM d')}
                  </div>
                </div>
                <div>
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}