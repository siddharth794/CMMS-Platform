// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChecklists, useDeleteChecklist } from '@/hooks/api/useChecklists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Loader2, FileText, Trash2 } from 'lucide-react';

export default function ChecklistsPage() {
  const { isManager, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // We only show templates here
  const { data: response, isLoading } = useChecklists({ is_template: 'true', search: searchTerm });
  const deleteMutation = useDeleteChecklist();

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
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const templates = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist Templates</h1>
          <p className="text-muted-foreground">
            Manage standard operating procedures (SOPs) and safety checklists.
          </p>
        </div>
        <Button onClick={() => navigate('/checklists/new')}>
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new checklist template.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/checklists/${template.id}`)}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span className="truncate">{template.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(template.id, e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                      {template.description || 'No description provided.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>{template.items?.length || 0} tasks</span>
                      {template.is_required && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-medium">Required</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
