// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNotification } from '../context/NotificationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, Users, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useUsers, useCreateUser, useBulkDeleteUsers, useDeleteUser } from '../hooks/api/useUsers';
import { rolesApi } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '../components/ui/pagination';

const UsersPage = () => {
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [recordStatus, setRecordStatus] = useState('active');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const { user: currentUser, isAdmin, hasRole } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
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

  const { data: usersData, isLoading: loading } = useUsers({
    record_status: recordStatus,
    search,
    skip: (page - 1) * 10,
    limit: 10
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await rolesApi.list();
      return data;
    }
  });

  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const bulkDeleteMutation = useBulkDeleteUsers();

  const users = usersData?.data || [];
  const total = usersData?.total || 0;

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
    try {
      await createUserMutation.mutateAsync({ ...userForm, role_id: parseInt(userForm.role_id) });
      addNotification('success', 'User created');
      setUserDialogOpen(false);
      resetUserForm();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(recordStatus === 'active' ? 'Deactivate this user?' : 'Permanently delete this user?')) return;
    try {
      await deleteUserMutation.mutateAsync(userId);
      addNotification('success', recordStatus === 'active' ? 'User deactivated' : 'User permanently deleted');
    } catch (error) {
      addNotification('error', 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'deactivate' : 'permanently delete'} ${selectedIds.length} users?`)) return;
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} users ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
      setSelectedIds([]);
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to bulk delete users');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-2">
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
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required
                      data-testid="user-password-input"
                    />
                  </div>
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
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {isAdmin() && selectedIds.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="w-[180px]">
              <Select value={recordStatus} onValueChange={(v) => { setRecordStatus(v); setPage(1); }}>
                <SelectTrigger>
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
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin() && (
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  <Select value={roleFilter || "all"} onValueChange={(v) => { setRoleFilter(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none w-[140px] p-0 h-auto font-medium text-muted-foreground hover:text-foreground focus:ring-0">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.name}>{role.name.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin() ? 7 : 6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin() ? 7 : 6} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.filter(u => !roleFilter || (u.role?.name || u.Role?.name) === roleFilter).map((u) => (
                  <TableRow key={u.id}>
                    {isAdmin() && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(u.id)}
                          onCheckedChange={() => toggleSelect(u.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Link to={`/users/${u.id}`} className="font-medium text-primary hover:underline">
                        {u.first_name} {u.last_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className="status-badge status-open">
                        {(u.role?.name || u.Role?.name || '').replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${u.is_active ? 'status-completed' : 'status-cancelled'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.last_login ? format(new Date(u.last_login), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {isAdmin() && u.id !== currentUser?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/users/${u.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="text-destructive">
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
          <Pagination 
            currentPage={page}
            totalItems={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
