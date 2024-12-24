import React, { createContext, useContext, useState } from "react";
import {
  Toast,
  ToastProps,
  ToastTitle,
  ToastDescription,
} from "~/components/ui/toast";

type ToastData = ToastProps & {
  id: string;
  title?: string;
  description?: string;
};

type ToastContextType = {
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, "id">) => {
    setToasts((prevToasts) => [
      ...prevToasts,
      { ...toast, id: Date.now().toString() },
    ]);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast}>
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && (
            <ToastDescription>{toast.description}</ToastDescription>
          )}
        </Toast>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
