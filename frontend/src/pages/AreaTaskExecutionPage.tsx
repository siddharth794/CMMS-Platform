import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAreaExecutions, useMutateAreaTask } from '../hooks/api/useAreas';
import { useChecklist } from '../hooks/api/useChecklists';
import { checklistsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useNotification } from '../context/NotificationContext';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AreaTaskExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { verifyQrMutation, completeTaskMutation } = useMutateAreaTask();
  
  const { data: executions = [] } = useAreaExecutions();
  const execution = executions.find((e: any) => e.id === id);
  
  const { data: checklist, refetch: refetchChecklist } = useChecklist(execution?.checklist_id || '');

  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render(async (decodedText) => {
        // Success callback
        scanner.clear();
        setScanning(false);
        try {
          await verifyQrMutation.mutateAsync({ id: id as string, qr_code_hash: decodedText });
          addNotification('success', 'Location Verified! Checklist Unlocked.');
        } catch (err: any) {
          addNotification('error', err.response?.data?.error || 'Invalid QR Code');
        }
      }, (error) => {
        // Ignore continuous scanning errors
      });

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scanning, id, verifyQrMutation, addNotification]);

  if (!execution) return <div className="p-8 text-center">Loading task...</div>;

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      await checklistsApi.toggleItem(execution.checklist_id, itemId, isCompleted);
      refetchChecklist();
    } catch (err) {
      addNotification('error', 'Failed to update item status');
    }
  };

  const handleCompleteTask = async () => {
    try {
      await completeTaskMutation.mutateAsync(id as string);
      addNotification('success', 'Area cleaning task completed!');
      navigate('/area-tasks');
    } catch (err: any) {
      addNotification('error', err.response?.data?.error || 'Failed to complete task');
    }
  };

  const isPending = execution.status === 'PENDING';
  const isComplete = execution.status === 'COMPLETED';

  const items = checklist?.items || [];
  const allChecked = items.length > 0 && items.every((i: any) => i.is_completed);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/area-tasks')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{execution.area?.name}</h1>
          <p className="text-sm text-muted-foreground">Area Checklist</p>
        </div>
      </div>

      {isPending && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <div className="bg-primary/20 p-4 rounded-full">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Verify Location</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                To start this checklist, you must scan the QR code located at <strong>{execution.area?.name}</strong>.
              </p>
            </div>
            
            {scanning ? (
              <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-lg"></div>
            ) : (
              <Button size="lg" className="w-full max-w-sm" onClick={() => setScanning(true)}>
                Scan QR Code to Unlock
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {(execution.status === 'IN_PROGRESS' || isComplete) && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{checklist?.name}</CardTitle>
              {checklist?.description && <CardDescription>{checklist.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                  <Checkbox 
                    id={item.id} 
                    checked={item.is_completed}
                    disabled={isComplete}
                    onCheckedChange={(checked) => handleToggleItem(item.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label 
                      htmlFor={item.id}
                      className={`text-sm font-medium leading-tight cursor-pointer ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.description}
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {!isComplete && (
            <Button 
              size="lg" 
              className="w-full" 
              disabled={!allChecked || completeTaskMutation.isPending}
              onClick={handleCompleteTask}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Mark Area Complete
            </Button>
          )}

          {isComplete && (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center justify-center font-medium">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              This task has been completed
            </div>
          )}
        </>
      )}
    </div>
  );
}