// @ts-nocheck
import React from 'react';
import { useChecklists, useToggleChecklistItem } from '@/hooks/api/useChecklists';
import { Checklist, ChecklistItem } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ClipboardCheck } from 'lucide-react';

export function WorkOrderChecklists({ workOrderId }: { workOrderId: string }) {
  const { data: response, isLoading } = useChecklists({ work_order_id: workOrderId });
  const toggleItemMutation = useToggleChecklistItem();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const checklists = response?.data || [];

  if (checklists.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
          <ClipboardCheck className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No Checklists Attached</h3>
          <p className="mt-1 text-sm">There are no required checklists for this work order.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {checklists.map((checklist) => (
        <ChecklistCard 
          key={checklist.id} 
          checklist={checklist} 
          onToggle={(itemId, isCompleted) => toggleItemMutation.mutate({ checklistId: checklist.id, itemId, is_completed: isCompleted })}
          isToggling={toggleItemMutation.isPending}
        />
      ))}
    </div>
  );
}

function ChecklistCard({ checklist, onToggle, isToggling }: { checklist: Checklist, onToggle: (itemId: string, isCompleted: boolean) => void, isToggling: boolean }) {
  const items = checklist.items || [];
  const completedCount = items.filter(item => item.is_completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const isFullyComplete = progress === 100;

  return (
    <Card className={`border-l-4 ${isFullyComplete ? 'border-l-green-500' : (checklist.is_required ? 'border-l-red-500' : 'border-l-blue-500')}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {checklist.name}
              {checklist.is_required && !isFullyComplete && (
                <Badge variant="destructive" className="text-xs">Required for Completion</Badge>
              )}
              {isFullyComplete && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Completed</Badge>
              )}
            </CardTitle>
            {checklist.description && (
              <p className="text-sm text-gray-500 mt-1">{checklist.description}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-700">{completedCount} / {items.length} completed</span>
          </div>
        </div>
        <Progress value={progress} className={`h-2 mt-2 ${isFullyComplete ? '[&>div]:bg-green-500' : ''}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <Checkbox 
                id={`item-${item.id}`} 
                checked={item.is_completed} 
                onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
                disabled={isToggling}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <label 
                  htmlFor={`item-${item.id}`} 
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-900 cursor-pointer'}`}
                >
                  {item.description}
                </label>
                {item.is_completed && item.completer && (
                  <p className="text-xs text-gray-400">
                    Completed by {item.completer.first_name} {item.completer.last_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
