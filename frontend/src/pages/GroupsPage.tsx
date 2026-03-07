// @ts-nocheck
import React, { useState } from 'react';
import { useGroups, useCreateGroup, useDeleteGroup } from '../hooks/api/useRBAC';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { useNotification } from '../context/NotificationContext';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function GroupsPage() {
  const { data: groups = [], isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const { addNotification } = useNotification();
  const [newGroup, setNewGroup] = useState('');

  const handleCreate = async () => {
    if (!newGroup) return;
    try {
      await createGroup.mutateAsync({ name: newGroup });
      setNewGroup('');
      addNotification('success', 'Group created');
    } catch (e) {
      addNotification('error', 'Failed to create group');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup.mutateAsync(id);
      addNotification('success', 'Group deleted');
    } catch (e) {
      addNotification('error', 'Failed to delete group');
    }
  };

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Groups</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-sm">
            <Input placeholder="New Group Name" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
            <Button onClick={handleCreate} disabled={createGroup.isPending}><Plus className="w-4 h-4 mr-2"/> Add</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
