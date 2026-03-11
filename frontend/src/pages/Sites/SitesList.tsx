// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Trash, Trash2, Loader2, MapPin } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useSites, useDeleteSite, useBulkDeleteSites } from '../../hooks/api/useSites';

export default function SitesList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [recordStatus, setRecordStatus] = useState('active');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useNotification();
  const { isManager } = useAuth();
  const navigate = useNavigate();

  const { data: sitesData, isLoading: loading, isError } = useSites({
    search,
    record_status: recordStatus,
    skip: (page - 1) * 10,
    limit: 10
  });

  const deleteMutation = useDeleteSite();
  const bulkDeleteMutation = useBulkDeleteSites();

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} sites?`)) return;
    
    setSubmitting(true);
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification(`${selectedIds.length} sites ${recordStatus === 'active' ? 'deleted' : 'permanently deleted'} successfully`, 'success');
      setSelectedIds([]);
    } catch (error: any) {
      addNotification(error.response?.data?.error || 'Failed to bulk delete sites', 'error');
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
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await deleteMutation.mutateAsync(id);
        addNotification('Site deleted successfully', 'success');
      } catch (error: any) {
        addNotification(error.response?.data?.error || 'Failed to delete site', 'error');
      }
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
                  <TableHead>Location</TableHead>
                  <TableHead>Facility Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError || !sitesData?.data || sitesData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager() ? 6 : 5} className="text-center py-8 text-muted-foreground">
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
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Link to={`/sites/${site.id}`} className="hover:underline">
                            {site.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        {[site.city, site.state].filter(Boolean).join(', ') || site.address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {site.manager ? `${site.manager.first_name} ${site.manager.last_name}` : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          site.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {site.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isManager() && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive h-8 w-8"
                            onClick={() => handleDelete(site.id)}
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
            
            <div className="p-4 border-t">
              <Pagination
                page={page}
                total={sitesData?.total || 0}
                limit={10}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
