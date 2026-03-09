// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useAccesses, useCreateAccess } from '../hooks/api/useRBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { useNotification } from '../context/NotificationContext';
import { Loader2, Plus, Key } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function AccessesPage() {
  const { data: accesses = [], isLoading } = useAccesses();
  const createAccess = useCreateAccess();
  const { addNotification } = useNotification();
  
  const [newAccessName, setNewAccessName] = useState('');
  const [newAccessModule, setNewAccessModule] = useState('');

  const handleCreate = async () => {
    if (!newAccessName || !newAccessModule) return;
    try {
      await createAccess.mutateAsync({ name: newAccessName, module: newAccessModule });
      setNewAccessName('');
      setNewAccessModule('');
      addNotification('success', 'Custom permission key created successfully');
    } catch (e) {
      addNotification('error', 'Failed to create permission key');
    }
  };

  const accessesByModule = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    accesses.forEach((access: any) => {
      const mod = access.module || 'General';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(access);
    });
    return grouped;
  }, [accesses]);

  if (isLoading) return <Loader2 className="animate-spin m-8" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Permissions Reference</h1>
          <p className="text-muted-foreground mt-1">
            A raw dictionary of all system and custom permission keys available. 
            Use the <a href="/roles" className="text-primary hover:underline transition-all">Roles</a> page to assign these to user roles.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Create Custom Permission Key
          </CardTitle>
          <CardDescription>
            Developers or Integrators can define custom granular permission keys to be toggled in the Roles UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Permission Key</label>
              <Input 
                placeholder="e.g. custom_app:export" 
                value={newAccessName} 
                onChange={(e) => setNewAccessName(e.target.value)} 
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Module / Category</label>
              <div className="flex gap-2">
                 <Input 
                   placeholder="e.g. Analytics" 
                   value={newAccessModule} 
                   onChange={(e) => setNewAccessModule(e.target.value)} 
                   className="flex-1"
                 />
                 <Button onClick={handleCreate} disabled={createAccess.isPending || !newAccessName || !newAccessModule}>
                   {createAccess.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2"/>} Add
                 </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(accessesByModule).map(([moduleName, moduleAccesses]) => (
          <Card key={moduleName} className="shadow-md border border-border/60 overflow-hidden flex flex-col">
            <CardHeader className="py-5 px-6 border-b bg-muted/20">
              <CardTitle className="text-lg font-semibold text-foreground/90">{moduleName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-2/3 px-6 py-3">Permission Key</TableHead>
                    <TableHead className="w-1/3 px-6 py-3 text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleAccesses.map((a: any) => (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="px-6 py-4 font-medium font-mono text-xs text-foreground/80">
                        <span className="bg-muted/50 px-2 py-1 rounded-md border border-border/50">{a.name}</span>
                        {a.description && (
                          <p className="font-sans text-xs text-muted-foreground mt-2 leading-relaxed opacity-80">
                            {a.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {a.is_system ? (
                          <Badge variant="secondary" className="text-[10px] font-medium uppercase px-2.5 py-0.5">Core</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-medium uppercase px-2.5 py-0.5 border-primary/30 text-primary">Custom</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
