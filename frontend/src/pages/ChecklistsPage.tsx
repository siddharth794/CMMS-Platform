// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChecklists, useDeleteChecklist, useRestoreChecklist, useBulkDeleteChecklists } from '@/hooks/api/useChecklists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, FileText, Trash2, Edit, RefreshCw, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useNotification } from '@/context/NotificationContext';

export default function ChecklistsPage() {
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [recordStatus, setRecordStatus] = useState('active');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { data: response, isLoading } = useChecklists({ 
    is_template: 'true', 
    search: searchTerm,
    record_status: recordStatus,
    skip: (page - 1) * 10,
    limit: 10
  });
  
  const deleteMutation = useDeleteChecklist();
  const restoreMutation = useRestoreChecklist();
  const bulkDeleteMutation = useBulkDeleteChecklists();

  if (!isManager()) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-gray-500">You do not have permission to view checklist templates.</p>
      </div>
    );
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(recordStatus === 'active' ? 'Delete this template?' : 'Permanently delete this template?')) {
      deleteMutation.mutate({ id, force: recordStatus === 'inactive' }, {
        onSuccess: () => {
          addNotification('success', recordStatus === 'active' ? 'Template deactivated' : 'Template permanently deleted');
          setSelectedIds([]);
        }
      });
    }
  };

  const handleRestore = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    restoreMutation.mutate(id, {
      onSuccess: () => {
        addNotification('success', 'Template restored');
      }
    });
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} templates?`)) return;
    
    bulkDeleteMutation.mutate({ ids: selectedIds, force: recordStatus === 'inactive' }, {
      onSuccess: () => {
        addNotification('success', `${selectedIds.length} templates ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
        setSelectedIds([]);
      }
    });
  };

  const templates = response?.data || [];
  const total = response?.total || 0;
  const submitting = bulkDeleteMutation.isPending;

  const toggleSelectAll = () => {
    if (selectedIds.length === templates.length && templates.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(templates.map((t) => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6" data-testid="checklists-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklist Templates</h1>
          <p className="text-muted-foreground">Manage standard operating procedures (SOPs) and safety checklists.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/checklists/new')} data-testid="create-checklist-btn">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search & Table */}
      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                data-testid="checklist-search-input"
              />
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} disabled={submitting}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="w-[180px]">
                <Select value={recordStatus} onValueChange={(v) => { setRecordStatus(v); setPage(1); setSelectedIds([]); }}>
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
        </div>

        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={templates.length > 0 && selectedIds.length === templates.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Template Name</TableHead>
                <TableHead className="min-w-[300px]">Description</TableHead>
                <TableHead className="min-w-[100px]">Tasks</TableHead>
                <TableHead className="min-w-[120px]">Requirement</TableHead>
                <TableHead className="min-w-[150px]">Created Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p>No templates found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/checklists/${template.id}`)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.includes(template.id)}
                        onCheckedChange={() => toggleSelect(template.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-primary hover:underline">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[300px]">
                      {template.description || '-'}
                    </TableCell>
                    <TableCell>
                      {template.items?.length || 0} steps
                    </TableCell>
                    <TableCell>
                      {template.is_required ? (
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive border-transparent">
                          Mandatory
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground border-transparent">
                          Optional
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.created_at ? format(new Date(template.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); navigate(`/checklists/${template.id}`); }}
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {recordStatus === 'inactive' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary h-8 w-8"
                            onClick={(e) => handleRestore(template.id, e)}
                            title="Restore template"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => handleDelete(template.id, e)}
                          title={recordStatus === 'inactive' ? 'Permanently delete template' : 'Delete template'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalItems={total}
                onPageChange={setPage}
                itemsPerPage={10}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
