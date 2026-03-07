import { Notification } from '../models';
import logger from '../config/logger';
import { Server as SocketIOServer } from 'socket.io';

interface CommentNotificationParams {
    workOrder: any;
    commenter: any;
    io: SocketIOServer | null;
}

/**
 * Centralized notification service.
 * Handles notification creation and Socket.IO broadcasting.
 * Runs as fire-and-forget to decouple notifications from business flows.
 */
class NotificationService {
    /**
     * Notify assignee and requester when a new comment is added to a work order.
     */
    async notifyCommentAdded(params: CommentNotificationParams): Promise<void> {
        const { workOrder, commenter, io } = params;
        const commenterId = commenter.id;
        const commenterName = `${commenter.first_name || ''} ${commenter.last_name || ''}`.trim();

        const recipients: string[] = [];
        if (workOrder.assignee_id && workOrder.assignee_id !== commenterId) {
            recipients.push(workOrder.assignee_id);
        }
        if (workOrder.requester_id && workOrder.requester_id !== commenterId && workOrder.requester_id !== workOrder.assignee_id) {
            recipients.push(workOrder.requester_id);
        }

        for (const targetUserId of recipients) {
            try {
                const notif = await Notification.create({
                    user_id: targetUserId,
                    title: 'New Comment',
                    message: `${commenterName} commented on Work Order ${workOrder.wo_number}`,
                    link: `/work-orders/${workOrder.id}`,
                });

                if (io) {
                    // Emit to user-specific room for targeted delivery
                    io.to(`user_${targetUserId}`).emit('new_notification', {
                        ...notif.toJSON(),
                        target_user_id: targetUserId,
                    });
                }
            } catch (err) {
                logger.error({ err, targetUserId, workOrderId: workOrder.id }, 'Failed to send notification');
            }
        }
    }
}

export const notificationService = new NotificationService();
