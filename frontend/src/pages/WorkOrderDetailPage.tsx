// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workOrdersApi, usersApi, inventoryApi, assetsApi, BACKEND_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft,
  Clock,
  User,
  Box,
  AlertTriangle,
  Calendar,
  Edit,
  UserPlus,
  CheckCircle,
  Loader2,
  MessageSquare,
  Send,
  Paperclip,
  X,
  UploadCloud,
  Save
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { format, formatDistanceToNow } from 'date-fns';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    new: 'status-new',
    open: 'status-open',
    in_progress: 'status-in_progress',
    on_hold: 'status-on_hold',
    pending_review: 'status-open',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  };
  return (
    <span className={`status-badge text-sm ${statusConfig[status] || 'status-new'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical',
  };
  return (
    <span className={`status-badge text-sm ${priorityConfig[priority] || 'priority-medium'}`}>
      {priority}
    </span>
  );
};

const WorkOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager, isRequester } = useAuth();
  const { socket } = useSocket();
  const { addNotification } = useNotification();
  const [workOrder, setWorkOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [inventoryCatalog, setInventoryCatalog] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: '',
    location: '',
    asset_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Inventory usage state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQuantity, setSelectedPartQuantity] = useState(1);
  const [addingPart, setAddingPart] = useState(false);

  // Attachments state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.emit('join_wo_room', id);

      const handleNewComment = (newCommentData) => {
        setComments((prev) => [...prev, newCommentData]);
      };

      socket.on('new_comment', handleNewComment);

      return () => {
        socket.emit('leave_wo_room', id);
        socket.off('new_comment', handleNewComment);
      };
    }
  }, [id, socket]);

  const fetchData = async () => {
    try {
      const [woRes, usersRes, invRes, assetsRes] = await Promise.all([
        workOrdersApi.get(id),
        usersApi.list(),
        inventoryApi.list(),
        assetsApi.list()
      ]);
      setWorkOrder(woRes.data);
      setUsers(usersRes.data.data || usersRes.data);
      setInventoryCatalog(invRes.data.data || invRes.data);
      setAssets(assetsRes.data.data || assetsRes.data);
      
      // Initialize edit form data
      const wo = woRes.data;
      setEditFormData({
        title: wo.title,
        description: wo.description || '',
        priority: wo.priority,
        location: wo.location || '',
        asset_id: wo.asset_id || 'none'
      });
      
      await fetchComments();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to load work order');
      navigate('/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await workOrdersApi.getComments(id);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleStatusUpdate = async () => {
    // Client-side validation for completion and review
    if (newStatus === 'completed' || newStatus === 'pending_review') {
      // 1. Mandatory Notes
      if (!statusNotes.trim() && !workOrder.resolution_notes) {
        addNotification('error', 'Resolution notes are mandatory when completing or submitting for review.');
        return;
      }

      // 2. Mandatory Attachments for High/Critical priority
      if (['high', 'critical'].includes(workOrder.priority)) {
        const hasAttachments = (workOrder.attachments && workOrder.attachments.length > 0) || (selectedFiles.length > 0);
        if (!hasAttachments) {
          addNotification('error', 'Proof of work (images) is required for High/Critical priority work orders.');
          return;
        }
      }
      
      // 3. General Attachment check for completion
      if (newStatus === 'completed' && !(workOrder.attachments?.length > 0 || selectedFiles.length > 0)) {
        addNotification('error', 'You must upload at least one image before completing the work order.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await workOrdersApi.update(id, { status: newStatus, notes: statusNotes });
      addNotification('success', 'Status updated');
      setStatusDialogOpen(false);
      setStatusNotes('');
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneralEdit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...editFormData };
      if (payload.asset_id === 'none') payload.asset_id = null;
      
      await workOrdersApi.update(id, payload);
      addNotification('success', 'Work order updated');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to update work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (assigneeId) => {
    try {
      await workOrdersApi.assign(id, { assignee_id: assigneeId });
      addNotification('success', 'Work order assigned');
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to assign');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await workOrdersApi.addComment(id, { message: newComment });
      setNewComment('');
      // We don't need to fetchComments() here anymore as the socket will broadcast it back to us,
      // but if we want to be safe in case of socket delay:
      // await fetchComments(); 
      addNotification('success', 'Comment posted');
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleAddPart = async () => {
    if (!selectedPartId || selectedPartQuantity <= 0) return;
    setAddingPart(true);
    try {
      await workOrdersApi.addUsedPart(id, {
        inventory_item_id: selectedPartId,
        quantity_used: parseInt(selectedPartQuantity)
      });
      addNotification('success', 'Part added to work order');
      setSelectedPartId('');
      setSelectedPartQuantity(1);
      fetchData(); // Refresh WO to get updated used_parts
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to add part');
    } finally {
      setAddingPart(false);
    }
  };

  const handleRemovePart = async (usageId) => {
    try {
      await workOrdersApi.removeUsedPart(id, usageId);
      addNotification('success', 'Part removed from work order');
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to remove part');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validation
    if (files.length + selectedFiles.length > 3) {
      addNotification('error', 'Maximum 3 images allowed');
      return;
    }

    const validFiles = files.filter(f => {
      if (f.size > 1024 * 1024) {
        addNotification('error', `${f.name} exceeds 1MB limit`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 3));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      await workOrdersApi.uploadAttachments(id, formData);
      addNotification('success', 'Images uploaded successfully');
      setSelectedFiles([]);
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workOrder) return null;

  return (
    <div className="space-y-6" data-testid="wo-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/work-orders')} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{workOrder.wo_number}</h1>
            <StatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
          </div>
          <p className="text-muted-foreground">{workOrder.title}</p>
        </div>
        <div className="flex gap-2">
          {isManager() && workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
            <Button onClick={handleGeneralEdit} disabled={submitting || !editFormData.title.trim()}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          )}
          {isManager() && workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
            <Button variant="outline" onClick={() => setAssignDialogOpen(true)} data-testid="assign-btn">
              <UserPlus className="mr-2 h-4 w-4" />
              Assign
            </Button>
          )}
          {(!isRequester() && workOrder.status !== 'completed' && workOrder.status !== 'cancelled') && (
            <Button onClick={() => { setNewStatus(workOrder.status); setStatusDialogOpen(true); }} data-testid="update-status-btn">
              <Edit className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content with Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="form">General Form</TabsTrigger>
              <TabsTrigger value="activity">Activity & Parts</TabsTrigger>
              <TabsTrigger value="attachments">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Details</CardTitle>
                  <CardDescription>Edit the primary information for this work order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={editFormData.priority} onValueChange={(v) => setEditFormData({ ...editFormData, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Asset</Label>
                      <Select 
                        value={editFormData.asset_id} 
                        onValueChange={(v) => setEditFormData({ ...editFormData, asset_id: v })}
                        disabled={useAuth().hasRole(['super_admin', 'super admin', 'Super_Admin'])}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {assets
                            .filter(item => item.site_id === workOrder.site_id)
                            .map(item => (
                              <SelectItem key={item.id} value={item.id}>{item.name} ({item.asset_tag})</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={6}
                    />
                  </div>

                  {workOrder.resolution_notes && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                        <CheckCircle className="h-4 w-4" />
                        Resolution Notes
                      </h4>
                      <p className="text-sm bg-primary/5 p-3 rounded-md border border-primary/10 whitespace-pre-wrap">
                        {workOrder.resolution_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-6">
                {/* Parts & Inventory Used */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      Parts & Inventory Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {workOrder.used_parts?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No parts have been added to this work order yet.</p>
                      ) : (
                        <div className="rounded-md border divide-y">
                          {workOrder.used_parts?.map((usage) => (
                            <div key={usage.id} className="flex items-center justify-between p-3 text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium">{usage.item?.name}</span>
                                <span className="text-xs text-muted-foreground">SKU: {usage.item?.sku} ({usage.item?.category})</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="bg-muted px-2 py-1 rounded-md">Qty: {usage.quantity_used}</span>
                                {(!isRequester() && workOrder.status !== 'completed' && workOrder.status !== 'cancelled') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-8 px-2"
                                    onClick={() => handleRemovePart(usage.id)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {(!isRequester() && workOrder.status !== 'completed' && workOrder.status !== 'cancelled') && (
                      <>
                        <Separator />
                        <div className="flex gap-4 items-end pt-2">
                          <div className="flex-1 space-y-2">
                            <Label>Select Part</Label>
                            <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select inventory item..." />
                              </SelectTrigger>
                              <SelectContent>
                                {inventoryCatalog.map(item => (
                                  <SelectItem key={item.id} value={item.id} disabled={item.quantity <= 0}>
                                    {item.name} - {item.quantity} available
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24 space-y-2">
                            <Label>Qty</Label>
                            <input
                              type="number"
                              min="1"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={selectedPartQuantity}
                              onChange={(e) => setSelectedPartQuantity(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleAddPart} disabled={!selectedPartId || addingPart}>
                            {addingPart ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Part"}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments & Conversation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {comments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                              {comment.User?.first_name?.[0]}{comment.User?.last_name?.[0]}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {comment.User?.first_name} {comment.User?.last_name}
                                  <span className="text-muted-foreground font-normal ml-2">
                                    ({comment.User?.Role?.name?.replace('_', ' ')})
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="text-sm rounded-lg bg-muted p-3 whitespace-pre-wrap">
                                {comment.message}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {!isRequester() && (
                      <>
                        <Separator />
                        <div className="flex gap-4 items-end pt-2">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="comment" className="sr-only">New comment</Label>
                            <Textarea
                              id="comment"
                              placeholder="Type your comment here..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={2}
                              className="resize-none"
                              data-testid="comment-input"
                            />
                          </div>
                          <Button
                            onClick={handlePostComment}
                            disabled={!newComment.trim() || postingComment}
                            data-testid="post-comment-btn"
                          >
                            {postingComment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attachments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Images & Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {workOrder.attachments?.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {workOrder.attachments.map(att => (
                        <div key={att.id} className="relative group rounded-md overflow-hidden border">
                          <img
                            src={`${BACKEND_URL}${att.file_path}`}
                            alt="Work Order"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {(!isRequester() && workOrder.status !== 'completed' && workOrder.status !== 'cancelled') && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center space-y-2 text-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        <div className="text-sm border-b pb-1">
                          <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline font-medium">
                            Click to upload
                          </Label>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploading || (workOrder.attachments?.length + selectedFiles.length >= 3)}
                          />
                          <span className="text-muted-foreground ml-1">or drag and drop</span>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 1MB. Max 3 files.</p>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Selected Files</h4>
                          <div className="space-y-2">
                            {selectedFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 text-sm bg-muted rounded-md border">
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button onClick={handleUploadFiles} disabled={uploading || selectedFiles.length === 0} className="w-full">
                            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                            Upload {selectedFiles.length} Image{selectedFiles.length !== 1 && 's'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assignee</p>
                  <p className="font-medium">
                    {workOrder.assignee
                      ? `${workOrder.assignee.first_name} ${workOrder.assignee.last_name}`
                      : 'Unassigned'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Requester</p>
                  <p className="font-medium">
                    {workOrder.requester
                      ? `${workOrder.requester.first_name} ${workOrder.requester.last_name}`
                      : '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Site</p>
                  <p className="font-medium">{workOrder.site?.name || 'No site linked'}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Asset</p>
                  <p className="font-medium">{workOrder.asset?.name || 'No asset linked'}</p>
                  {workOrder.asset && (
                    <p className="text-sm text-muted-foreground">{workOrder.asset.location}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(workOrder.created_at), 'PPP')}</p>
                </div>
              </div>

              {workOrder.actual_start && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium">{format(new Date(workOrder.actual_start), 'PPP p')}</p>
                    </div>
                  </div>
                </>
              )}

              {workOrder.actual_end && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-medium">{format(new Date(workOrder.actual_end), 'PPP p')}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>Change the work order status and add notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="pending_review">Submit for Review</SelectItem>
                  {isManager() && <SelectItem value="completed">Approve & Complete</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Notes {(newStatus === 'completed' || newStatus === 'pending_review') ? '(Mandatory)' : '(Optional)'}
              </Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
                data-testid="status-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={submitting} data-testid="confirm-status-btn">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Work Order</DialogTitle>
            <DialogDescription>Select a user to assign this work order to</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {users
              .filter(u => {
                const roleName = (u.role?.name || u.Role?.name || '').toLowerCase();
                return roleName === 'technician' && u.site_id === workOrder?.site_id;
              })
              .map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAssign(user.id)}
                >
                  {user.first_name} {user.last_name} ({user.role?.name?.replace('_', ' ')})
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrderDetailPage;
