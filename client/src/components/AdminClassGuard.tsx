'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * AdminClassGuard - Ensures admin CSS classes don't persist after logout
 *
 * This component removes any admin-related CSS classes from the DOM
 * when the user is not on an admin page. This prevents UI breaking
 * after logout where outline/debug styles might persist.
 */
export default function AdminClassGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're on an admin page
    const isAdminPage = pathname?.includes('/admin');

    if (!isAdminPage) {
      // Remove all admin-related CSS classes
      document.body.classList.remove('admin');
      document.body.classList.remove('debug');
      document.body.classList.remove('auth');
      document.body.classList.remove('admin-mode');

      // Remove from html element too
      document.documentElement.classList.remove('admin');

      // Clear any inline styles that might have been added
      document.body.style.outline = '';
    }
  }, [pathname]);

  return null;
}
