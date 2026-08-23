'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg2)] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-slide-up">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">{title}</h3>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl leading-none">&times;</button>
          </div>
        )}
        {!title && (
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl leading-none">&times;</button>
        )}
        {children}
      </div>
    </div>
  );
}
