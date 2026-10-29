import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders modal dialogs directly at document.body to break out of
 * any parent stacking contexts, transforms, or overflow constraints.
 */
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}

