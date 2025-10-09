// hooks/useServiceCalls.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type ServiceCallStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceCallPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceCall = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  status: ServiceCallStatus;
  priority: ServiceCallPriority;
  scheduled_date: string | null;
  completed_at: string | null;
  project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Row = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  status: ServiceCallStatus;
  priority: ServiceCallPriority;
  scheduled_date: string | null;
  completed_at: string | null;
  project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useServiceCalls(userId?: string) {
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const safeSet = <T,>(setter: (v: T) => void, v: T) => {
    if (mountedRef.current) setter(v);
  };

  const fetchServiceCalls = useCallback(async () => {
    if (!userId) return;
    try {
      safeSet(setLoading, true);
      safeSet(setError, null);

      const { data, error } = await supabase
        .from('service_calls')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: ServiceCall[] = (data as Row[]).map((r) => ({
        id: r.id,
        owner_id: r.owner_id,
        title: r.title,
        description: r.description,
        customer_name: r.customer_name,
        customer_phone: r.customer_phone,
        customer_email: r.customer_email,
        customer_address: r.customer_address,
        status: r.status,
        priority: r.priority,
        scheduled_date: r.scheduled_date,
        completed_at: r.completed_at,
        project_id: r.project_id,
        notes: r.notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      safeSet(setServiceCalls, mapped);
    } catch (e: any) {
      safeSet(setError, e.message ?? 'Failed loading service calls');
      safeSet(setServiceCalls, []);
    } finally {
      safeSet(setLoading, false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchServiceCalls();

    // Real-time updates
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (userId) {
      channel = supabase
        .channel(`service-calls-user-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_calls', filter: `owner_id=eq.${userId}` },
          () => fetchServiceCalls()
        )
        .subscribe();
    }
    return () => {
      mountedRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchServiceCalls, userId]);

  return { serviceCalls, loading, error, refetch: fetchServiceCalls };
}

// Helper function to get status color
export function getStatusColor(status: ServiceCallStatus): string {
  switch (status) {
    case 'open':
      return '#3B82F6'; // Blue
    case 'in_progress':
      return '#F59E0B'; // Orange
    case 'completed':
      return '#10B981'; // Green
    case 'cancelled':
      return '#6B7280'; // Gray
  }
}

// Helper function to get priority color
export function getPriorityColor(priority: ServiceCallPriority): string {
  switch (priority) {
    case 'low':
      return '#10B981'; // Green
    case 'medium':
      return '#F59E0B'; // Orange
    case 'high':
      return '#EF4444'; // Red
    case 'urgent':
      return '#DC2626'; // Dark Red
  }
}

// Helper function to get status label
export function getStatusLabel(status: ServiceCallStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
}

// Helper function to get priority label
export function getPriorityLabel(priority: ServiceCallPriority): string {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
    case 'urgent':
      return '🚨 Urgent';
  }
}