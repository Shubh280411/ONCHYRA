'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#22c55e' : '#ef4444';
  const textColor = type === 'success' ? '#000' : '#fff';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        zIndex: 3000,
        padding: '14px 28px',
        borderRadius: 14,
        fontWeight: 800,
        fontSize: 13,
        whiteSpace: 'nowrap',
        background: bgColor,
        color: textColor,
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
        boxShadow: `0 8px 32px ${bgColor}33`,
        border: `1px solid ${bgColor}55`,
        fontFamily: "'Space Grotesk',sans-serif",
        letterSpacing: 0.5,
      }}
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
}
