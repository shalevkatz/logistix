// hooks/useProfile.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  full_name: string | null;
  role: 'manager' | 'employee' | null;
};

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) { if (mounted) setLoading(false); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .maybeSingle();
      if (!mounted) return;
      if (error) setError(error.message);
      setProfile((data as Profile) ?? null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [userId]);

  return { profile, loading, error };
}
