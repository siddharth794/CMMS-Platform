// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2, Trash } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from '../hooks/api/useOrganizations';
import { Organization } from '../types/models';

const OrganizationsPage = () => {
      const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [recordStatus, setRecordStatus] = useState('active');
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    is_active: true,
  });

  const { data: orgData, isLoading: loading } = useOrganizations({
    name: search,
    record_status: recordStatus,
    skip: (page - 1) * 10,
    limit: 10
  });

  const organizations = orgData?.data || [];
  const total = orgData?.total || 0;

  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      addNotification('success', 'Organization created');
      setCreateOpen(false);
      setFormData({ name: '', description: '', address: '', is_active: true });
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to create organization');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await updateMutation.mutateAsync({ id: selectedOrg.id, data: formData });
      addNotification('success', 'Organization updated');
      setEditOpen(false);
      setSelectedOrg(null);
      setFormData({ name: '', description: '', address: '', is_active: true });
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to update organization');
    }
  };

  const handleDelete = async (org: Organization) => {
    const isHardDelete = recordStatus === 'inactive';
    if (!window.confirm(isHardDelete ? `Permanently delete ${org.name}?` : `Deactivate ${org.name}?`)) return;
    
    try {
      await deleteMutation.mutateAsync({ id: org.id, force: isHardDelete });
      addNotification('success', isHardDelete ? 'Organization permanently deleted' : 'Organization deactivated');
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || 'Failed to delete organization');
    }
  };

  const openEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      address: org.address || '',
      is_active: org.is_active,
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage system organizations</p>
        </div>
        
      </div>

      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
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
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <Link to={`/organizations/${org.id}`} className="text-primary hover:underline">
                        {org.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{org.description}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[250px] truncate">{org.address || '-'}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${org.is_active ? 'status-open' : 'status-cancelled'}`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/organizations/${org.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(org)}>
                            <Edit className="mr-2 h-4 w-4" />Edit (Modal)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(org)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />{recordStatus === 'active' ? 'Deactivate' : 'Delete Permanently'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Edit Dialog */}
      
    </div>
  );
};

export default OrganizationsPage;
