// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useUpdateUser, useDeleteUser } from '../hooks/api/useUsers';
import { rolesApi } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft, Save, User as UserIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { data: user, isLoading, isError } = useUser(id);
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const { user: currentUser } = useAuth();

  const isSuperAdmin = (currentUser?.role?.name || currentUser?.Role?.name || '').toLowerCase() === 'super_admin';
  const isOwnProfile = currentUser?.id === id;

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await rolesApi.list();
      return data;
    }
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    role_id: '',
  });

  useEffect(() => {
    if (user && roles.length > 0) {
      // Find role ID from nested user object
      const roleObj = user.Role || (user.Roles?.[0]) || user.role;
      const assignedRoleId = (user.role_id || roleObj?.id)?.toString() || '';
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        role_id: assignedRoleId,
      });
    } else if (user) {
      // Fallback if roles aren't loaded yet
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
      }));
    }
  }, [user, roles]);

  const handleDelete = async () => {
    if (!window.confirm(user.is_active ? 'Deactivate this user?' : 'Permanently delete this user?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addNotification('success', user.is_active ? 'User deactivated' : 'User permanently deleted');
      navigate('/users');
    } catch (error) {
      addNotification('error', 'Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...formData,
          role_id: parseInt(formData.role_id)
        }
      });
      addNotification('success', 'User updated successfully');
      navigate('/users');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to update user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">User not found</h2>
        <Button variant="link" onClick={() => navigate('/users')}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.first_name} {user.last_name}</h1>
            <p className="text-muted-foreground">User ID: {user.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" form="user-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit User Profile</CardTitle>
            <CardDescription>Update personal information and role</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    key={`${formData.role_id}-${roles.length}`}
                    value={formData.role_id || undefined} 
                    onValueChange={(v) => setFormData({ ...formData, role_id: v })} 
                    required
                    disabled={formData.role_id === '2' && !isSuperAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.role_id === '2' && !roles.some((r) => r.id.toString() === '2') && (
                        <SelectItem value="2">
                          {((user?.Role?.name || user?.role?.name) || 'Org Admin').replace('_', ' ')}
                        </SelectItem>
                      )}
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground opacity-50">
                    ID: {formData.role_id || 'None'} | Available: {roles.length}
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user.is_active ? 'Active' : 'Deactivated'}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {user.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium">
                {user.last_login ? (() => {
                  try {
                    return format(new Date(user.last_login), 'PPP p');
                  } catch (e) {
                    return 'Invalid Date';
                  }
                })() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetailPage;
