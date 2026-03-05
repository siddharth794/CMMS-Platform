import React, { useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { toast } from 'sonner';

export const SocketEvents = () => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const { addNotification } = useNotification();

    useEffect(() => {
        if (!socket || !user) return;

        const handleNotification = (notif) => {
            if (notif.target_user_id === user.id) {
                toast(notif.title, {
                    description: notif.message,
                    action: {
                        label: 'View',
                        onClick: () => window.location.href = notif.link
                    }
                });
            }
        };

        socket.on('new_notification', handleNotification);

        return () => {
            socket.off('new_notification', handleNotification);
        };
    }, [socket, user, addNotification]);

    return null; // This component doesn't render anything
};
