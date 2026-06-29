import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useToast } from '../context/ToastContext';
import { api } from '../services/axios';

const POLL_INTERVAL_MS = 15000; // 15s while the app is in the foreground
const MAX_PROCESSED_IDS = 500;  // cap to keep the Set from growing unbounded

export const useNotifications = () => {
    const { showToast } = useToast();
    const processedIds = useRef(new Set<number>()); // To avoid spamming on re-renders

    const markAsRead = useCallback(async (id: number) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const checkNotifications = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const response = await api.get('/api/notifications?unread_only=true');
            const notifications = response.data;

            if (notifications && notifications.length > 0) {
                // Avoid the processed set growing forever across a long session.
                if (processedIds.current.size > MAX_PROCESSED_IDS) {
                    processedIds.current.clear();
                }

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
    }, [showToast, markAsRead]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const startPolling = () => {
            if (intervalId) return;
            checkNotifications(); // immediate check when (re)entering foreground
            intervalId = setInterval(checkNotifications, POLL_INTERVAL_MS);
        };

        const stopPolling = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        // Only poll while the app is actually visible — saves battery and
        // avoids hammering the backend (and the DB) when backgrounded.
        if (AppState.currentState === 'active') startPolling();

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') startPolling();
            else stopPolling();
        });

        return () => {
            stopPolling();
            subscription.remove();
        };
    }, [checkNotifications]);

    return { checkNotifications };
};
