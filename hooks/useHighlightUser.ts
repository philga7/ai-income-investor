import { useEffect } from 'react';
import { H } from '@highlight-run/next/client';

interface HighlightUser {
  email: string;
  id?: string;
  // Only include non-sensitive user data
  name?: string;
  role?: string;
  // Add other non-sensitive user properties here
}

export function useHighlightUser(user: HighlightUser | null) {
  useEffect(() => {
    if (user?.email) {
      // Only send non-sensitive data to Highlight
      const safeUserData = {
        id: user.id,
        name: user.name,
        role: user.role,
        // Add other non-sensitive properties here
      };

      H.identify(user.email, safeUserData);
    }
  }, [user]);
} 