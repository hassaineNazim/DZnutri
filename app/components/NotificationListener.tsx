import { useNotifications } from '../hooks/useNotifications';

/**
 * Validates and displays notifications using the Toast system.
 * Must be placed inside ToastProvider.
 */
const NotificationListener = () => {
    useNotifications();
    return null;
};

export default NotificationListener;
