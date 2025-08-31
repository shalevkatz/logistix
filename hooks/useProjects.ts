// hooks/useProjects.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true); // <- track if component is still mounted

  const safeSetState = <T,>(setter: (val: T) => void, val: T) => {
    if (mountedRef.current) setter(val);
  };

  const fetchProjects = useCallback(async () => {
    if (!userId) {
      safeSetState(setProjects, []);
      safeSetState(setLoading, false);
      return;
    }
    safeSetState(setLoading, true);
    safeSetState(setError, null);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      safeSetState(setError, error.message);
      safeSetState(setProjects, []);
    } else {
      safeSetState(setProjects, data ?? []);
    }
    safeSetState(setLoading, false);
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProjects();

    // 🔄 Realtime: refetch when this user's projects change
    // (insert/update/delete)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (userId) {
      channel = supabase
        .channel(`projects-user-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',                 // insert | update | delete
            schema: 'public',
            table: 'projects',
            filter: `owner_id=eq.${userId}`,
          },
          () => {
            fetchProjects();           // re-fetch list on any change
          }
        )
        .subscribe();
    }

    return () => {
      mountedRef.current = false;
      if (channel) supabase.removeChannel(channel); // cleanup realtime
    };
  }, [fetchProjects, userId]);

  return { projects, loading, error, refetch: fetchProjects };
}
