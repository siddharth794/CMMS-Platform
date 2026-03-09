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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Trash2, Loader2, Users, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useUsers, useCreateUser, useBulkDeleteUsers, useDeleteUser } from '../hooks/api/useUsers';
import { rolesApi } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '../components/ui/pagination';

const UsersPage = () => {
    const [editingUser, setEditingUser] = useState(null);
  const [recordStatus, setRecordStatus] = useState('active');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const { user: currentUser, isAdmin, isManager, hasRole } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const isSuperAdmin = (currentUser?.role?.name || currentUser?.Role?.name || '').toLowerCase() === 'super_admin';

  
  const { data: usersData, isLoading: loading } = useUsers({
    record_status: recordStatus,
    search,
    skip: (page - 1) * 10,
    limit: 10,
    ...(isSuperAdmin ? { org_id: 'all' } : {})
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await rolesApi.list();
      return data;
    }
  });

    const deleteUserMutation = useDeleteUser();
  const bulkDeleteMutation = useBulkDeleteUsers();

  const users = usersData?.data || [];
  const total = usersData?.total || 0;

  
  
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
    const selectableUsers = users.filter((u) => u.id !== currentUser?.id);
    if (selectedIds.length === selectableUsers.length && selectableUsers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableUsers.map((u) => u.id));
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
            <Button data-testid="add-user-btn" onClick={() => navigate('/users/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
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
                      checked={users.length > 0 && selectedIds.length === users.filter((u) => u.id !== currentUser?.id).length && selectedIds.length > 0}
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
                users.filter(u => !roleFilter || roleFilter === 'all' || (u.role?.name || u.Role?.name) === roleFilter).map((u) => (
                  <TableRow key={u.id}>
                    {isAdmin() && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(u.id)}
                          onCheckedChange={() => toggleSelect(u.id)}
                          disabled={u.id === currentUser?.id}
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
                    <TableCell className="text-right">
                      {(isAdmin() || isManager()) && u.id !== currentUser?.id && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive h-8 w-8 hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
