import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        setToast({ message, type, visible: true });

        // Auto hide after 3 seconds
        setTimeout(() => {
            setToast((prev) => prev ? { ...prev, visible: false } : null);
        }, 3000);
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => prev ? { ...prev, visible: false } : null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    visible={toast.visible}
                    onHide={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
