// @ts-nocheck
import React, { useState } from 'react';
import { useAccesses, useCreateAccess } from '../hooks/api/useRBAC';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { useNotification } from '../context/NotificationContext';
import { Loader2, Plus } from 'lucide-react';

export default function AccessesPage() {
  const { data: accesses = [], isLoading } = useAccesses();
  const createAccess = useCreateAccess();
  const { addNotification } = useNotification();
  const [newAccess, setNewAccess] = useState('');

  const handleCreate = async () => {
    if (!newAccess) return;
    try {
      await createAccess.mutateAsync({ name: newAccess });
      setNewAccess('');
      addNotification('success', 'Access created');
    } catch (e) {
      addNotification('error', 'Failed to create access');
    }
  };

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System & Custom Access Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-sm">
            <Input placeholder="Access Name (e.g. work_order:create)" value={newAccess} onChange={(e) => setNewAccess(e.target.value)} />
            <Button onClick={handleCreate} disabled={createAccess.isPending}><Plus className="w-4 h-4 mr-2"/> Add</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Access Key</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accesses.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium font-mono text-sm">{a.name}</TableCell>
                  <TableCell>{a.is_system ? 'System' : 'Custom'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
