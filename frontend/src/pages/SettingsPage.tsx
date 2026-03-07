// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNotification } from '../context/NotificationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, MoreHorizontal, Edit, Trash2, Trash, Loader2, Users, Shield, Building2, User } from 'lucide-react';
import { format } from 'date-fns';

const SettingsPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [recordStatus, setRecordStatus] = useState('active');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const { user: currentUser, isAdmin, hasRole } = useAuth();
  const { addNotification } = useNotification();
  const isRestricted = hasRole(['technician', 'requestor', 'facility_manager']);
  const isSuperAdmin = (currentUser?.role?.name || currentUser?.Role?.name || '').toLowerCase() === 'super_admin';

  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [recordStatus]);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersApi.list({ record_status: recordStatus }),
        rolesApi.list(),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setSelectedIds([]);
    } catch (error) {
      addNotification('error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role_id: '',
    });
    setEditingUser(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.create({ ...userForm, role_id: parseInt(userForm.role_id) });
      addNotification('success', 'User created');
      setUserDialogOpen(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const updateData = { ...userForm };
      delete updateData.password;
      if (updateData.role_id) updateData.role_id = parseInt(updateData.role_id);
      await usersApi.update(editingUser.id, updateData);
      toast.success('User updated');
      setUserDialogOpen(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(recordStatus === 'active' ? 'Deactivate this user?' : 'Permanently delete this user?')) return;
    try {
      await usersApi.delete(userId);
      addNotification('success', recordStatus === 'active' ? 'User deactivated' : 'User permanently deleted');
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'deactivate' : 'permanently delete'} ${selectedIds.length} users?`)) return;
    
    setSubmitting(true);
    try {
      await usersApi.bulkDelete({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} users ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to bulk delete users');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((a) => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const openEditUserDialog = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      username: user.username,
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role_id: user.role_id?.toString() || '',
    });
    setUserDialogOpen(true);
  };

  // Profile-only view for technicians/requestors
  if (isRestricted) {
    return (
      <div className="space-y-8" data-testid="settings-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Your account information</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Your personal account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{currentUser?.first_name} {currentUser?.last_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Username</Label>
                <p className="font-medium">{currentUser?.username}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="font-medium">{(currentUser?.role?.name || currentUser?.Role?.name || '').replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{currentUser?.phone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage users, roles, and system configuration</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="roles" data-testid="tab-roles">
              <Shield className="mr-2 h-4 w-4" />
              Roles
            </TabsTrigger>
          )}
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Management</h2>
            <div className="flex items-center gap-2">
              {isAdmin() && selectedIds.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} disabled={submitting}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              {isAdmin() && (
                <Dialog open={userDialogOpen} onOpenChange={(open) => { setUserDialogOpen(open); if (!open) resetUserForm(); }}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-user-btn">
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Update user details' : 'Create a new user account'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={userForm.first_name}
                          onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                          data-testid="user-firstname-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={userForm.last_name}
                          onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                          data-testid="user-lastname-input"
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
                        data-testid="user-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        required
                        data-testid="user-username-input"
                      />
                    </div>
                    {!editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          required={!editingUser}
                          data-testid="user-password-input"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Select value={userForm.role_id} onValueChange={(v) => setUserForm({ ...userForm, role_id: v })} required>
                        <SelectTrigger data-testid="user-role-select">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles
                              .filter(role => {
                                const roleName = role.name.toLowerCase();
                                if (isSuperAdmin) {
                                  return roleName !== 'super_admin';
                                }
                                return !['super_admin', 'org_admin'].includes(roleName);
                              })
                            .map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name.replace('_', ' ')}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        data-testid="user-phone-input"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} data-testid="user-submit-btn">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingUser ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <div className="w-[180px]">
              <Select value={recordStatus} onValueChange={(v) => { setRecordStatus(v); }}>
                <SelectTrigger data-testid="filter-record-status">
                  <SelectValue placeholder="Record Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin() && (
                      <TableHead className="w-[50px] min-w-[50px]">
                        <Checkbox 
                          checked={users.length > 0 && selectedIds.length === users.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[250px]">Email</TableHead>
                    <TableHead className="min-w-[200px]">
                      <Select value={roleFilter || "all"} onValueChange={(v) => { setRoleFilter(v === "all" ? "" : v); }}>
                        <SelectTrigger className="border-0 bg-transparent shadow-none w-[160px] justify-between p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:ring-0 px-2 -ml-2">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {roles
                            .filter(role => {
                              const roleName = role.name.toLowerCase();
                              if (isSuperAdmin) {
                                return true;
                              }
                              return !['super_admin', 'org_admin'].includes(roleName);
                            })
                            .map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name.replace('_', ' ')}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[150px]">Status</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap">Last Login</TableHead>
                    <TableHead className="w-[50px] min-w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    users
                      .filter((user) => {
                        if (!roleFilter || roleFilter === 'all') return true;
                        const roleName = user.role?.name || user.Role?.name || '';
                        return roleName === roleFilter;
                      })
                      .map((user) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        {isAdmin() && (
                          <TableCell>
                            <Checkbox 
                              checked={selectedIds.includes(user.id)}
                              onCheckedChange={() => toggleSelect(user.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span className="status-badge status-open">
                            {(user.role?.name || user.Role?.name || '').replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`status-badge ${user.is_active ? 'status-completed' : 'status-cancelled'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {isAdmin() && user.id !== currentUser?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`user-actions-${user.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                                  <Edit className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />{recordStatus === 'active' ? 'Deactivate' : 'Delete Permanently'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab - Super Admin only */}
        {isSuperAdmin && (
          <TabsContent value="roles" className="space-y-4">
            <h2 className="text-xl font-semibold">Role Management</h2>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id} data-testid={`role-row-${role.id}`}>
                        <TableCell className="font-medium">{role.name.replace('_', ' ')}</TableCell>
                        <TableCell className="text-muted-foreground">{role.description || '-'}</TableCell>
                        <TableCell>
                          <span className={`status-badge ${role.is_system_role ? 'status-open' : 'status-new'}`}>
                            {role.is_system_role ? 'System' : 'Custom'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {users.filter(u => u.role_id === role.id).length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{currentUser?.first_name} {currentUser?.last_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{currentUser?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="font-medium">{currentUser?.username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium">{(currentUser?.role?.name || currentUser?.Role?.name || '').replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
