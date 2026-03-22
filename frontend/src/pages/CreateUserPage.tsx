// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNotification } from '../context/NotificationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { useCreateUser } from '../hooks/api/useUsers';
import { useGroups, useUpdateGroupMembers } from '../hooks/api/useRBAC';
import { useOrganizations } from '../hooks/api/useOrganizations';
import { rolesApi } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '../components/ui/checkbox';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const isSuperAdmin = (currentUser?.role?.name || currentUser?.Role?.name || '').toLowerCase() === 'super_admin';

  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_id: '',
    org_id: '',
    site_id: '',
  });

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: orgsData, isLoading: isLoadingOrgs } = useOrganizations({ limit: 100 });
  const organizations = orgsData?.data || [];

  const selectedOrgId = isSuperAdmin ? userForm.org_id : currentUser?.org_id;
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['sites', { org_id: selectedOrgId, limit: 100 }],
    queryFn: async () => {
      const { sitesApi } = await import('../lib/api');
      const { data } = await sitesApi.list({ org_id: selectedOrgId, limit: 100 });
      return data;
    },
    enabled: !!selectedOrgId
  });
  const sites = sitesData?.data || [];

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await rolesApi.list();
      return data;
    }
  });

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups();
  const createUserMutation = useCreateUser();
  const updateGroupMembers = useUpdateGroupMembers();

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the user
      const payload = { ...userForm, role_id: parseInt(userForm.role_id) };
      // Omit org_id if not super admin to let backend default to their own
      if (!isSuperAdmin) delete payload.org_id;
      if (payload.site_id === 'none') delete payload.site_id;
      
      const createdUser = await createUserMutation.mutateAsync(payload);
      const newUserId = createdUser.id;

      // 2. Assign the user to selected groups
      if (selectedGroups.length > 0) {
        const groupPromises = selectedGroups.map(groupId => {
          const group = groups.find(g => g.id === groupId);
          if (group) {
            const existingUserIds = (group.Users || group.users || []).map(u => u.id);
            return updateGroupMembers.mutateAsync({
              id: groupId,
              data: { user_ids: [...existingUserIds, newUserId] }
            });
          }
          return Promise.resolve();
        });
        await Promise.all(groupPromises);
      }

      addNotification('success', 'User created successfully');
      navigate('/users');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
            <p className="text-muted-foreground">Add a new user to the system.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/users')}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={createUserMutation.isPending || updateGroupMembers.isPending || !userForm.role_id}>
            {(createUserMutation.isPending || updateGroupMembers.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create User
          </Button>
        </div>
      </div>

      <form id="user-form" onSubmit={handleCreateUser} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Enter the basic information and assign a core role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  placeholder="johndoe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>Organization *</Label>
                {isLoadingOrgs ? (
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md opacity-50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading organizations...
                  </div>
                ) : (
                  <Select value={userForm.org_id} onValueChange={(v) => setUserForm({ ...userForm, org_id: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground mt-1">Super Admins can place users in specific organizations.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Core Role *</Label>
                {isLoadingRoles ? (
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md opacity-50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading roles...
                  </div>
                ) : (
                  <Select value={userForm.role_id} onValueChange={(v) => setUserForm({ ...userForm, role_id: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter(role => {
                          const roleName = role.name.toLowerCase();
                          if (isSuperAdmin) return roleName !== 'super_admin';
                          return !['super_admin', 'org_admin'].includes(roleName);
                        })
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name.replace('_', ' ')}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {userForm.role_id && (() => {
                const selectedRole = roles.find(r => r.id.toString() === userForm.role_id);
                const roleName = selectedRole?.name?.toLowerCase() || '';
                if (roleName === 'technician' || roleName === 'facility manager') {
                  return (
                    <div className="space-y-2">
                      <Label>Assigned Site</Label>
                      {isLoadingSites ? (
                        <div className="flex items-center h-10 px-3 py-2 border rounded-md opacity-50">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading sites...
                        </div>
                      ) : (
                        <Select value={userForm.site_id} onValueChange={(v) => setUserForm({ ...userForm, site_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a site" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Unassigned --</SelectItem>
                            {sites.map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional. Links this user directly to a specific site.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Team & Group Assignment</CardTitle>
            </div>
            <CardDescription>
              Assign the user to groups. They will automatically inherit all roles assigned to these groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No groups available. You can create groups later in the Groups page.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group: any) => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <button 
                      type="button"
                      key={group.id}
                      onClick={() => handleToggleGroup(group.id)}
                      className={`text-left flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20' : 'hover:border-primary/30 bg-card'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="space-y-1 leading-none flex-1">
                        <div className="font-medium">{group.name}</div>
                        <p className="text-xs text-muted-foreground">
                          {group.Users?.length || 0} Member{(group.Users?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateUserPage;
