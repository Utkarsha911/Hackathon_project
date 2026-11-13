import { create } from 'zustand';
import { getCurrentUser } from '../services/api';

let toastTimeoutId = null;

export const useAppStore = create((set) => ({
  currentView: 'customer',
  adminTab: 'overview',
  currentUser: getCurrentUser(),
  toast: null,

  setCurrentView: (currentView) => set({ currentView }),
  setAdminTab: (adminTab) => set({ adminTab }),
  setCurrentUser: (currentUser) => set({ currentUser }),

  closeToast: () => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      toastTimeoutId = null;
    }
    set({ toast: null });
  },

  showToast: (message, type = 'success', duration = 4000) => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    set({ toast: { id: Date.now(), message, type } });
    toastTimeoutId = setTimeout(() => {
      set({ toast: null });
      toastTimeoutId = null;
    }, duration);
  }
}));
