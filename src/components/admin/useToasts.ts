import { useRef, useState } from 'react';
import type { ToastMessage } from './EnquiryParts';

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);
  const dismiss = (id: number) => setToasts((prev) => prev.filter((toast) => toast.id !== id));
  const notify = (tone: ToastMessage['tone'], text: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-2), { id, tone, text }]);
    window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 4000);
  };
  return { toasts, notify, dismiss };
}
