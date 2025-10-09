// hooks/useProjects.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Project = {
  id: string;
  owner_id: string;
  title: string | null;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | null;
  created_at: string;
  updated_at: string;
  completed: boolean;
  completed_at: string | null;
};

type Row = {
  id: string;
  owner_id: string;
  title?: string | null;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | null;
  created_at: string;
  updated_at: string;
  completed: boolean;
  completed_at: string | null;
};

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const safeSet = <T,>(setter: (v: T) => void, v: T) => {
    if (mountedRef.current) setter(v);
  };

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    try {
      safeSet(setLoading, true);
      safeSet(setError, null);

      const { data, error } = await supabase
        .from('projects')
        .select('id, owner_id, title, description, priority, created_at, updated_at, completed, completed_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Project[] = (data as Row[]).map((r) => ({
        id: r.id,
        owner_id: r.owner_id,
        title: (r.title ?? null),
        description: r.description ?? null,
        priority: r.priority ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
        completed: r.completed ?? false,
        completed_at: r.completed_at ?? null,
      }));

      safeSet(setProjects, mapped);
    } catch (e: any) {
      safeSet(setError, e.message ?? 'Failed loading projects');
      safeSet(setProjects, []);
    } finally {
      safeSet(setLoading, false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProjects();

    // רענון בריל-טיים על כל שינוי בטבלת projects של המשתמש
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (userId) {
      channel = supabase
        .channel(`projects-user-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects', filter: `owner_id=eq.${userId}` },
          () => fetchProjects()
        )
        .subscribe();
    }
    return () => {
      mountedRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchProjects, userId]);

  return { projects, loading, error, refetch: fetchProjects };
}