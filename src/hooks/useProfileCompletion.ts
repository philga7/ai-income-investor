import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  company?: string;
  job_title?: string;
}

export function useProfileCompletion() {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkProfileCompletion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Check if required fields are filled
      const isComplete = Boolean(
        profile?.full_name &&
        profile?.email
      );

      setIsProfileComplete(isComplete);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  const redirectToProfileIfIncomplete = () => {
    if (!loading && !isProfileComplete) {
      router.push('/profile');
      return true;
    }
    return false;
  };

  return {
    isProfileComplete,
    loading,
    redirectToProfileIfIncomplete,
    checkProfileCompletion,
  };
} 