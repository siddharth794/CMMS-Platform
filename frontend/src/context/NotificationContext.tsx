import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem('cmms_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cmms_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = (type, message) => {
        const newNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type,
            message,
            read: false,
            timestamp: new Date().toISOString()
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

        // Also trigger the standard toast for immediate visibility
        if (type === 'success') sonnerToast.success(message);
        else if (type === 'error') sonnerToast.error(message);
        else if (type === 'warning') sonnerToast.warning(message);
        else sonnerToast(message);
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
