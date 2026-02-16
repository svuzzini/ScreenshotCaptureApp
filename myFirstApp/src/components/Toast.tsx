import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_DURATION = 3000;

const ToastItem: React.FC<{ message: ToastMessage; onDismiss: () => void }> = ({ message, onDismiss }) => {
  const { theme } = useTheme();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsExiting(true), TOAST_DURATION - 300);
    const removeTimer = setTimeout(onDismiss, TOAST_DURATION);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  const bgColor = message.type === 'success'
    ? theme.colors.success
    : message.type === 'error'
      ? theme.colors.error
      : theme.colors.primary;

  return (
    <div
      style={{
        padding: '10px 20px',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(-10px)' : 'translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        cursor: 'pointer',
        maxWidth: '400px'
      }}
      onClick={onDismiss}
    >
      {message.type === 'success' && '\u2713 '}
      {message.type === 'error' && '\u2717 '}
      {message.type === 'info' && '\u2139 '}
      {message.text}
    </div>
  );
};

export const Toast: React.FC<ToastProps> = ({ messages, onDismiss }) => {
  if (messages.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto'
      }}
    >
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={() => onDismiss(msg.id)} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id, text, type }]);
  };

  const dismissToast = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return { messages, addToast, dismissToast };
};
