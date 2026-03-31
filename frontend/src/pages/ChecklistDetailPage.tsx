// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCreateChecklist } from '../hooks/api/useChecklists';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Save } from 'lucide-react';

export default function CreateChecklistPage() {
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const createMutation = useCreateChecklist();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [items, setItems] = useState([{ id: Date.now().toString(), description: '' }]);

  if (!isManager()) {
    return <div className="p-12 text-center text-gray-500">You do not have permission.</div>;
  }

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '' }]);
  };

  const handleItemChange = (id: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, description: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validItems = items.filter(i => i.description.trim()).map((i, idx) => ({
      description: i.description.trim(),
      order_index: idx
    }));

    if (validItems.length === 0) {
      addNotification('error', 'Please add at least one task to the checklist.');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      is_required: isRequired,
      is_template: true, // We are creating a master template here
      items: validItems
    }, {
      onSuccess: () => {
        // useCreateChecklist already fires a success toast, but we navigate
        navigate('/checklists');
      }
    });
  };

  const isSaving = createMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header (Matches other Create pages) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/checklists')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Checklist Template</h1>
            <p className="text-muted-foreground">Define a new standard operating procedure.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/checklists')}>
            Cancel
          </Button>
          <Button type="submit" form="checklist-form" disabled={!name.trim() || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-4 space-y-6">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Provide a clear name and description for technicians.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="checklist-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Forklift Inspection"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Guidelines or context for this checklist..."
                  rows={3}
                />
              </div>

              <div className="flex items-start space-x-3 pt-4 border-t">
                <Switch
                  id="is-required"
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="is-required" className="cursor-pointer font-medium text-base">
                    Mandatory for Work Order Completion
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    If enabled, technicians cannot mark a work order as "Pending Review" until every item is checked.
                  </p>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Checklist Tasks Card */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Tasks ({items.filter(i => i.description.trim()).length})</CardTitle>
            <CardDescription>List the individual steps required for this checklist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                <span className="text-sm font-medium text-gray-400 w-4 text-right">{index + 1}.</span>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                  placeholder="e.g., Check hydraulic fluid level"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4 w-full border-dashed"
              onClick={handleAddItem}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
