import { create } from 'zustand';

interface ToastMsg {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
}

interface ToastState {
  messages: ToastMsg[];
  show: (text: string, kind?: ToastMsg['kind'], ms?: number) => void;
  dismiss: (id: number) => void;
}

export const useToast = create<ToastState>((set, get) => ({
  messages: [],
  show(text, kind = 'info', ms = 3200) {
    const id = Date.now() + Math.random();
    set({ messages: [...get().messages, { id, text, kind }] });
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss(id) {
    set({ messages: get().messages.filter((m) => m.id !== id) });
  },
}));

export function toast(text: string, kind?: ToastMsg['kind']) {
  useToast.getState().show(text, kind);
}
