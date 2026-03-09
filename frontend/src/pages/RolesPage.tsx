// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useRoles, useCreateRole, useDeleteRole, useUpdateRoleAccesses, useAccesses } from '../hooks/api/useRBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNotification } from '../context/NotificationContext';
import { Loader2, Plus, Trash2, Shield, UserCog, Save, Lock } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';

export default function RolesPage() {
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: allAccesses = [], isLoading: isLoadingAccesses } = useAccesses();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const updateRoleAccesses = useUpdateRoleAccesses();
  const { addNotification } = useNotification();
  
  const [newRole, setNewRole] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Local state to keep track of toggled accesses before saving
  const [localAccesses, setLocalAccesses] = useState<Set<string>>(new Set());
  const [isEditingAccesses, setIsEditingAccesses] = useState(false);

  const selectedRole = useMemo(() => roles.find((r: any) => r.id === selectedRoleId), [roles, selectedRoleId]);

  // Group accesses by module
  const accessesByModule = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    allAccesses.forEach((access: any) => {
      const moduleName = access.module || 'General';
      if (!grouped[moduleName]) grouped[moduleName] = [];
      grouped[moduleName].push(access);
    });
    return grouped;
  }, [allAccesses]);

  // Handle role selection
  const handleSelectRole = (role: any) => {
    setSelectedRoleId(role.id);
    const assignedAccesses = role.Accesses || role.accesses || [];
    setLocalAccesses(new Set(assignedAccesses.map((a: any) => a.id)));
    setIsEditingAccesses(false);
  };

  const handleCreate = async () => {
    if (!newRole) return;
    try {
      await createRole.mutateAsync({ name: newRole });
      setNewRole('');
      addNotification('success', 'Role created successfully');
    } catch (e) {
      addNotification('error', 'Failed to create role');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteRole.mutateAsync(id);
      if (selectedRoleId === id) setSelectedRoleId(null);
      addNotification('success', 'Role deleted');
    } catch (e) {
      addNotification('error', 'Failed to delete role');
    }
  };

  const handleToggleAccess = (accessId: string) => {
    if (selectedRole?.is_system_role) return;
    
    setIsEditingAccesses(true);
    setLocalAccesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accessId)) {
        newSet.delete(accessId);
      } else {
        newSet.add(accessId);
      }
      return newSet;
    });
  };

  const handleSaveAccesses = async () => {
    if (!selectedRoleId) return;
    try {
      await updateRoleAccesses.mutateAsync({
        id: selectedRoleId.toString(),
        data: { access_ids: Array.from(localAccesses) }
      });
      setIsEditingAccesses(false);
      addNotification('success', 'Role permissions updated successfully');
    } catch (e) {
      addNotification('error', 'Failed to update permissions');
    }
  };

  const formatAccessName = (name: string) => {
    // Convert something like "work_order:create" to "Create"
    const parts = name.split(':');
    if (parts.length > 1) {
      const action = parts[1];
      return action.charAt(0).toUpperCase() + action.slice(1);
    }
    return name;
  };

  if (isLoadingRoles || isLoadingAccesses) return <Loader2 className="animate-spin m-8" />;

  const systemRoles = roles.filter((r: any) => r.is_system_role);
  const customRoles = roles.filter((r: any) => !r.is_system_role);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">Manage what users can see and do within the application.</p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left Sidebar - Roles List */}
        <Card className="w-1/3 flex flex-col shadow-sm max-w-[420px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Roles
            </CardTitle>
            <CardDescription>Select a role to configure permissions.</CardDescription>
            <div className="flex gap-2 pt-2">
              <Input 
                placeholder="New custom role..." 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)} 
                className="h-9"
              />
              <Button onClick={handleCreate} disabled={createRole.isPending || !newRole} size="sm" className="h-9">
                <Plus className="w-4 h-4 mr-1"/> Add
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Custom Roles First */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Custom Roles</h4>
                {customRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-lg border border-dashed">No custom roles created yet.</p>
                ) : (
                  <div className="space-y-1">
                    {customRoles.map((role: any) => (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedRoleId === role.id 
                            ? 'bg-primary/5 border-primary/20 text-foreground font-medium shadow-sm' 
                            : 'border-transparent hover:bg-muted text-foreground/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <UserCog className={`w-4 h-4 ${selectedRoleId === role.id ? 'text-primary' : 'opacity-70'}`} />
                          <span className="text-sm">{role.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(role.id, e)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Roles */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">System Roles</h4>
                <div className="space-y-1">
                  {systemRoles.map((role: any) => (
                    <div
                      key={role.id}
                      onClick={() => handleSelectRole(role)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedRoleId === role.id 
                          ? 'bg-primary/5 border-primary/20 text-foreground font-medium shadow-sm' 
                          : 'border-transparent hover:bg-muted text-foreground/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className={`w-4 h-4 ${selectedRoleId === role.id ? 'text-primary' : 'opacity-50'}`} />
                        <span className="text-sm">{role.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-medium uppercase px-2 py-0">System</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Right Panel - Permissions Configuration */}
        <Card className="flex-1 flex flex-col shadow-sm">
          {!selectedRole ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Shield className="w-16 h-16 mb-6 opacity-10 text-primary" />
              <h3 className="text-xl font-medium mb-2">No Role Selected</h3>
              <p className="text-sm max-w-sm text-center">Select a role from the sidebar to view its configured permissions and accesses.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      {selectedRole.name} 
                      {selectedRole.is_system_role && (
                        <Badge variant="secondary" className="font-normal text-xs bg-muted">System Role (Read-only)</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm">
                      {selectedRole.is_system_role 
                        ? "System roles have predefined permissions that cannot be modified. They are maintained by the platform."
                        : "Toggle the switches below to configure what users with this role can access."}
                    </CardDescription>
                  </div>
                  {!selectedRole.is_system_role && (
                    <Button 
                      onClick={handleSaveAccesses} 
                      disabled={!isEditingAccesses || updateRoleAccesses.isPending}
                      className={isEditingAccesses ? "animate-pulse" : ""}
                    >
                      {updateRoleAccesses.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  {Object.entries(accessesByModule).map(([moduleName, accesses]) => (
                    <div key={moduleName} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-foreground/90">{moduleName}</h3>
                        <Separator className="flex-1" />
                      </div>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {accesses.map((access: any) => {
                          const isChecked = localAccesses.has(access.id);
                          return (
                            <div 
                              key={access.id} 
                              className={`flex flex-row items-start justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 ${
                                isChecked ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/5' : 'bg-card'
                              } ${!selectedRole.is_system_role ? 'hover:border-primary/40' : ''}`}
                            >
                              <div className="space-y-1.5 flex-1 pr-4">
                                <label className="text-sm font-medium leading-none flex items-center gap-2">
                                  {formatAccessName(access.name)}
                                  {access.is_system && (
                                     <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase">Core</Badge>
                                  )}
                                </label>
                                {access.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2" title={access.description}>
                                    {access.description}
                                  </p>
                                )}
                              </div>
                              <div className="pt-0.5">
                                <Switch
                                  checked={isChecked}
                                  disabled={selectedRole.is_system_role}
                                  onCheckedChange={() => handleToggleAccess(access.id)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-8" /> {/* Bottom padding */}
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
