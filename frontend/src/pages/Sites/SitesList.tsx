// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Trash, Trash2, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useSites, useDeleteSite, useBulkDeleteSites, useRestoreSite } from '../../hooks/api/useSites';
import { useOrganizations } from '../../hooks/api/useOrganizations';

export default function SitesList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [recordStatus, setRecordStatus] = useState('active');
  const [orgId, setOrgId] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useNotification();
  const { isManager, hasRole } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = hasRole(['super_admin']);

  const { data: orgsData } = useOrganizations({ limit: 1000 });
  const orgs = orgsData?.data || [];

  const { data: sitesData, isLoading: loading, isError } = useSites({
    search,
    record_status: recordStatus,
    org_id: orgId !== 'all' ? orgId : undefined,
    skip: (page - 1) * 10,
    limit: 10
  });

  const deleteMutation = useDeleteSite();
  const bulkDeleteMutation = useBulkDeleteSites();
  const restoreMutation = useRestoreSite();

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} sites?`)) return;
    
    setSubmitting(true);
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} sites ${recordStatus === 'active' ? 'deleted' : 'permanently deleted'} successfully`);
      setSelectedIds([]);
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || error.response?.data?.error || 'Failed to bulk delete sites');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    const sites = sitesData?.data || [];
    if (selectedIds.length === sites.length && sites.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sites.map((s: any) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(recordStatus === 'active' ? 'Delete this site?' : 'Permanently delete this site?')) {
      try {
        await deleteMutation.mutateAsync({ id, force: recordStatus === 'inactive' });
        addNotification('success', recordStatus === 'active' ? 'Site deleted' : 'Site permanently deleted');
      } catch (error: any) {
        addNotification('error', error.response?.data?.detail || error.response?.data?.error || 'Failed to delete site');
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      addNotification('success', 'Site restored');
    } catch (error: any) {
      addNotification('error', error.response?.data?.detail || error.response?.data?.error || 'Failed to restore site');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">Manage organization sites and facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/sites/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sites by name, city or state..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              {isManager() && selectedIds.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} disabled={submitting}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              {isSuperAdmin && (
                <div className="w-[200px]">
                  <Select value={orgId} onValueChange={(v) => { setOrgId(v); setPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Organizations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      {orgs.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {isManager() && (
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={sitesData?.data?.length > 0 && selectedIds.length === sitesData.data.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  {isSuperAdmin && <TableHead>Organization</TableHead>}
                  <TableHead>Location</TableHead>
                  <TableHead>Facility Manager</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError || !sitesData?.data || sitesData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager() ? (isSuperAdmin ? 6 : 5) : (isSuperAdmin ? 5 : 4)} className="text-center py-8 text-muted-foreground">
                      {isError ? 'Failed to load sites. Please try again.' : 'No sites found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sitesData?.data?.map((site: any) => (
                    <TableRow key={site.id}>
                      {isManager() && (
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(site.id)}
                            onCheckedChange={() => toggleSelect(site.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            <Link to={`/sites/${site.id}`} className="hover:underline flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {site.name}
                            </Link>
                          </span>
                        </div>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <span className="text-muted-foreground">
                            {site.Organization?.name || '-'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        {[site.city, site.state].filter(Boolean).join(', ') || site.address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {site.manager ? `${site.manager.first_name} ${site.manager.last_name}` : 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-right">
                        {isManager() && (
                          <div className="flex justify-end gap-2">
                            {recordStatus === 'inactive' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary h-8 w-8"
                                onClick={() => handleRestore(site.id)}
                                title="Restore Site"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-8 w-8"
                              onClick={() => handleDelete(site.id)}
                              title={recordStatus === 'active' ? 'Delete Site' : 'Delete Permanently'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            <div className="p-4 border-t">
              <Pagination
                currentPage={page}
                totalItems={sitesData?.total || 0}
                itemsPerPage={10}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
