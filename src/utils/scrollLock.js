// src/utils/scrollLock.js
/**
 * Utility to lock and unlock background scrolling when a modal is opened.
 * Supports reference counting for nested/multiple modals, prevents layout shifts
 * caused by scrollbar width changes, and disables background scrolling on both
 * document.body and admin container elements (e.g. <main className="overflow-y-auto">).
 */

let lockCount = 0;
let observerLock = false;
let isCurrentlyLocked = false;

let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';
let lockedContainers = [];

function getScrollbarWidth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function applyLock() {
  if (isCurrentlyLocked || typeof document === 'undefined') return;

  const scrollbarWidth = getScrollbarWidth();

  // Save current styles
  originalBodyOverflow = document.body.style.overflow;
  originalHtmlOverflow = document.documentElement.style.overflow;
  originalBodyPaddingRight = document.body.style.paddingRight;

  // Add class and set overflow
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  // Prevent layout jump if vertical scrollbar was present
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  // Find scrollable background containers outside of any open modal
  lockedContainers = [];
  try {
    const scrollContainers = document.querySelectorAll('main, aside, .overflow-y-auto, .overflow-auto');
    scrollContainers.forEach((container) => {
      // Don't lock containers that are INSIDE a modal or CONTAIN an active modal
      if (
        container.closest('.fixed.inset-0, [role="dialog"]') ||
        container.querySelector('.fixed.inset-0, [role="dialog"]')
      ) {
        return;
      }
      const style = window.getComputedStyle(container);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
        lockedContainers.push({
          element: container,
          originalOverflow: container.style.overflow,
          originalOverflowY: container.style.overflowY
        });
        container.classList.add('modal-open-scroll-lock');
        container.style.overflow = 'hidden';
        container.style.overflowY = 'hidden';
      }
    });
  } catch (err) {
    console.warn('Could not query scroll containers for modal lock:', err);
  }

  isCurrentlyLocked = true;
}

function removeLock() {
  if (!isCurrentlyLocked || typeof document === 'undefined') return;

  // Restore body and html styles
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
  document.body.style.overflow = originalBodyOverflow;
  document.documentElement.style.overflow = originalHtmlOverflow;
  document.body.style.paddingRight = originalBodyPaddingRight;

  // Restore background containers
  lockedContainers.forEach(({ element, originalOverflow, originalOverflowY }) => {
    try {
      element.classList.remove('modal-open-scroll-lock');
      element.style.overflow = originalOverflow;
      element.style.overflowY = originalOverflowY;
    } catch {
      // Container may have unmounted
    }
  });
  lockedContainers = [];

  isCurrentlyLocked = false;
}

function updateLockState() {
  const shouldBeLocked = lockCount > 0 || observerLock;
  if (shouldBeLocked && !isCurrentlyLocked) {
    applyLock();
  } else if (!shouldBeLocked && isCurrentlyLocked) {
    removeLock();
  }
}

/**
 * Increment lock count (called by useBodyScrollLock hook when a modal opens)
 */
export function lockBodyScroll() {
  lockCount++;
  updateLockState();
}

/**
 * Decrement lock count (called by useBodyScrollLock hook when a modal closes)
 */
export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  updateLockState();
}

/**
 * Global DOM MutationObserver:
 * Automatically monitors the DOM for any modal backdrop elements (.fixed.inset-0.z-50)
 * ensuring background scroll is locked even if a modal component is rendered without the hook.
 */
let observerInitialized = false;

export function initModalScrollLockObserver() {
  if (observerInitialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  observerInitialized = true;

  const checkModalPresent = () => {
    try {
      const modalBackdrops = document.querySelectorAll(
        '.fixed.inset-0.z-50, .fixed.inset-0[role="dialog"]'
      );
      let hasActiveModal = false;
      modalBackdrops.forEach((el) => {
        // Exclude mobile drawer / sidebars if they are not modal dialogs
        if (el.tagName.toLowerCase() === 'aside') return;
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          hasActiveModal = true;
        }
      });

      if (hasActiveModal !== observerLock) {
        observerLock = hasActiveModal;
        updateLockState();
      }
    } catch (e) {
      // Ignore DOM race conditions
    }
  };

  const observer = new MutationObserver(() => {
    checkModalPresent();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden']
  });

  // Initial check
  checkModalPresent();
}
