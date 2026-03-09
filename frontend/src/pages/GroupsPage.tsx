// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useGroups, useCreateGroup, useDeleteGroup, useUpdateGroupMembers, useUpdateGroupRoles, useRoles } from '../hooks/api/useRBAC';
import { useUsers } from '../hooks/api/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNotification } from '../context/NotificationContext';
import { Loader2, Plus, Trash2, Users, Shield, Save, User as UserIcon } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function GroupsPage() {
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups();
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: usersData, isLoading: isLoadingUsers } = useUsers();
  
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const updateGroupMembers = useUpdateGroupMembers();
  const updateGroupRoles = useUpdateGroupRoles();
  const { addNotification } = useNotification();
  
  const [newGroup, setNewGroup] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Local state for editing
  const [localUsers, setLocalUsers] = useState<Set<string>>(new Set());
  const [localRoles, setLocalRoles] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  const users = usersData?.data || [];
  const selectedGroup = useMemo(() => groups.find((g: any) => g.id === selectedGroupId), [groups, selectedGroupId]);

  const handleSelectGroup = (group: any) => {
    setSelectedGroupId(group.id);
    const assignedUsers = group.Users || group.users || [];
    const assignedRoles = group.Roles || group.roles || [];
    
    setLocalUsers(new Set(assignedUsers.map((u: any) => u.id)));
    setLocalRoles(new Set(assignedRoles.map((r: any) => r.id)));
    setIsEditing(false);
  };

  const handleCreate = async () => {
    if (!newGroup) return;
    try {
      await createGroup.mutateAsync({ name: newGroup });
      setNewGroup('');
      addNotification('success', 'Group created successfully');
    } catch (e) {
      addNotification('error', 'Failed to create group');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteGroup.mutateAsync(id);
      if (selectedGroupId === id) setSelectedGroupId(null);
      addNotification('success', 'Group deleted');
    } catch (e) {
      addNotification('error', 'Failed to delete group');
    }
  };

  const handleToggleUser = (userId: string) => {
    setIsEditing(true);
    setLocalUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  };

  const handleToggleRole = (roleId: string) => {
    setIsEditing(true);
    setLocalRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) newSet.delete(roleId);
      else newSet.add(roleId);
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedGroupId) return;
    try {
      // We run both updates. Ideally this is a single endpoint, but we have two based on API.
      const promises = [];
      
      promises.push(
        updateGroupMembers.mutateAsync({
          id: selectedGroupId,
          data: { user_ids: Array.from(localUsers) }
        })
      );
      
      promises.push(
        updateGroupRoles.mutateAsync({
          id: selectedGroupId,
          data: { role_ids: Array.from(localRoles) }
        })
      );
      
      await Promise.all(promises);
      setIsEditing(false);
      addNotification('success', 'Group assignments saved successfully');
    } catch (e) {
      addNotification('error', 'Failed to update group assignments');
    }
  };

  const isSaving = updateGroupMembers.isPending || updateGroupRoles.isPending;
  const isLoading = isLoadingGroups || isLoadingRoles || isLoadingUsers;

  if (isLoading) return <Loader2 className="animate-spin m-8" />;

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teams & Groups</h1>
        <p className="text-muted-foreground mt-1">Organize users into groups and assign bulk roles.</p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left Sidebar - Groups List */}
        <Card className="w-1/3 flex flex-col shadow-sm max-w-[350px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Groups
            </CardTitle>
            <CardDescription>Select a group to manage members and roles.</CardDescription>
            <div className="flex gap-2 pt-2">
              <Input 
                placeholder="New group name..." 
                value={newGroup} 
                onChange={(e) => setNewGroup(e.target.value)} 
                className="h-9"
              />
              <Button onClick={handleCreate} disabled={createGroup.isPending || !newGroup} size="sm" className="h-9">
                <Plus className="w-4 h-4 mr-1"/> Add
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-lg border border-dashed text-center mt-4">
                  No groups created yet.
                </p>
              ) : (
                groups.map((group: any) => (
                  <div
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedGroupId === group.id 
                        ? 'bg-primary/5 border-primary/20 text-foreground font-medium shadow-sm' 
                        : 'border-transparent hover:bg-muted text-foreground/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-4 h-4 ${selectedGroupId === group.id ? 'text-primary' : 'opacity-70'}`} />
                      <span>{group.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(group.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right Panel - Group Configuration */}
        <Card className="flex-1 flex flex-col shadow-sm">
          {!selectedGroup ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="w-16 h-16 mb-6 opacity-10 text-primary" />
              <h3 className="text-xl font-medium mb-2">No Group Selected</h3>
              <p className="text-sm max-w-sm text-center">Select a group from the sidebar to manage its members and assigned roles.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      {selectedGroup.name}
                      <Badge variant="outline" className="font-normal">
                        {localUsers.size} Member{localUsers.size !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm">
                      Users in this group will automatically inherit all roles assigned to the group.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={!isEditing || isSaving}
                    className={isEditing ? "animate-pulse" : ""}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="members" className="flex-1 flex flex-col">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="members">Members ({localUsers.size})</TabsTrigger>
                    <TabsTrigger value="roles">Assigned Roles ({localRoles.size})</TabsTrigger>
                  </TabsList>
                </div>
                
                <Separator className="mt-4" />

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <TabsContent value="members" className="m-0 space-y-4 outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {users.map((user: any) => {
                          const isAssigned = localUsers.has(user.id);
                          return (
                            <div 
                              key={user.id} 
                              className={`flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 cursor-pointer hover:border-primary/40 ${
                                isAssigned ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/5' : 'bg-card'
                              }`}
                              onClick={() => handleToggleUser(user.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border text-muted-foreground">
                                  {user.first_name?.[0] || <UserIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                                </div>
                              </div>
                              <Switch
                                checked={isAssigned}
                                onCheckedChange={() => handleToggleUser(user.id)}
                                onClick={(e) => e.stopPropagation()} // Prevent double firing
                              />
                            </div>
                          );
                        })}
                      </div>
                      {users.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
                          No users found in the system.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="roles" className="m-0 space-y-4 outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {roles.map((role: any) => {
                          const isAssigned = localRoles.has(role.id);
                          return (
                            <div 
                              key={role.id} 
                              className={`flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 cursor-pointer hover:border-primary/40 ${
                                isAssigned ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/5' : 'bg-card'
                              }`}
                              onClick={() => handleToggleRole(role.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-md ${isAssigned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                  <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium leading-none">{role.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {role.is_system_role ? 'System Role' : 'Custom Role'}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={isAssigned}
                                onCheckedChange={() => handleToggleRole(role.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
