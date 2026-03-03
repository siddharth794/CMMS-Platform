import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workOrdersApi, usersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Clock, User, Box, AlertTriangle, Calendar, Edit, UserPlus, CheckCircle, Loader2, MessageSquare, Send } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { format, formatDistanceToNow } from 'date-fns';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    new: 'status-new',
    open: 'status-open',
    in_progress: 'status-in_progress',
    on_hold: 'status-on_hold',
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
  const { isManager } = useAuth();
  const { addNotification } = useNotification();
  const [workOrder, setWorkOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [woRes, usersRes] = await Promise.all([
        workOrdersApi.get(id),
        usersApi.list(),
      ]);
      setWorkOrder(woRes.data);
      setUsers(usersRes.data);
      await fetchComments();
    } catch (error) {
      addNotification('error', 'Failed to load work order');
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
    setSubmitting(true);
    try {
      await workOrdersApi.updateStatus(id, { status: newStatus, notes: statusNotes });
      addNotification('success', 'Status updated');
      setStatusDialogOpen(false);
      setStatusNotes('');
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to update status');
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
      addNotification('error', 'Failed to assign');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await workOrdersApi.addComment(id, { message: newComment });
      setNewComment('');
      await fetchComments();
      addNotification('success', 'Comment posted');
    } catch (error) {
      addNotification('error', 'Failed to post comment');
    } finally {
      setPostingComment(false);
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
            <Button variant="outline" onClick={() => setAssignDialogOpen(true)} data-testid="assign-btn">
              <UserPlus className="mr-2 h-4 w-4" />
              Assign
            </Button>
          )}
          {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
            <Button onClick={() => { setNewStatus(workOrder.status); setStatusDialogOpen(true); }} data-testid="update-status-btn">
              <Edit className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {workOrder.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {workOrder.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes & History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {workOrder.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments & Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment List */}
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

              {/* Add Comment Input */}
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
            </CardContent>
          </Card>
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
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
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
              .filter(u => ['technician', 'facility_manager'].includes(u.role?.name?.toLowerCase()))
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
