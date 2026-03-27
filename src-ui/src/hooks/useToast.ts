/**
 * Copyright (C) 2024 sebswho
 * This file is part of Skilltoon.
 */

import { useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

// Simple toast state management
let toasts: Toast[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach(listener => listener());
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...options, id };
    
    toasts = [...toasts, newToast];
    notify();

    // Auto dismiss
    if (options.duration !== Infinity) {
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id);
        notify();
      }, options.duration || 3000);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, []);

  return { toast, dismiss, toasts };
}

// Export for ToastContainer component
export function getToasts() {
  return toasts;
}
