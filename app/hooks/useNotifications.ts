import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/axios';

export const useNotifications = () => {
    const { showToast } = useToast();
    const processedIds = useRef(new Set<number>()); // To avoid spamming on re-renders

    const checkNotifications = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await api.get('/api/notifications?unread_only=true');
            const notifications = response.data;

            if (notifications && notifications.length > 0) {

                // Show toasts sequentially with delay
                notifications.forEach((notif: any, index: number) => {
                    // Skip if already processed in this session scope
                    if (processedIds.current.has(notif.id)) return;
                    processedIds.current.add(notif.id);

                    setTimeout(() => {
                        showToast(notif.message, notif.type || 'success');
                        markAsRead(notif.id);
                    }, index * 3500); // 3.5s delay between each toast
                });
            }
        } catch (error) {
            console.error('Failed to check notifications:', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    useEffect(() => {
        checkNotifications();

        // Poll every 10 seconds to catch new notifications while the user is active
        const intervalId = setInterval(checkNotifications, 10000);

        return () => clearInterval(intervalId);
    }, []);

    return { checkNotifications };
};
