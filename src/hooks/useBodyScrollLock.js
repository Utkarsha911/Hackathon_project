// src/hooks/useBodyScrollLock.js
import { useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

/**
 * React hook to disable background scrolling when a modal is opened.
 * @param {boolean} isLocked - Pass true when the modal is open, false when closed.
 */
export function useBodyScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
