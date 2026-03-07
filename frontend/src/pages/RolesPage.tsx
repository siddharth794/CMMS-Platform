// @ts-nocheck
import React, { useState } from 'react';
import { useRoles, useCreateRole, useDeleteRole } from '../hooks/api/useRBAC';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { useNotification } from '../context/NotificationContext';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function RolesPage() {
  const { data: roles = [], isLoading } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const { addNotification } = useNotification();
  const [newRole, setNewRole] = useState('');

  const handleCreate = async () => {
    if (!newRole) return;
    try {
      await createRole.mutateAsync({ name: newRole });
      setNewRole('');
      addNotification('success', 'Role created');
    } catch (e) {
      addNotification('error', 'Failed to create role');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRole.mutateAsync(id);
      addNotification('success', 'Role deleted');
    } catch (e) {
      addNotification('error', 'Failed to delete role');
    }
  };

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Roles Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System & Custom Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-sm">
            <Input placeholder="New Role Name" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
            <Button onClick={handleCreate} disabled={createRole.isPending}><Plus className="w-4 h-4 mr-2"/> Add</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.is_system_role ? 'System' : 'Custom'}</TableCell>
                  <TableCell className="text-right">
                    {!r.is_system_role && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
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
