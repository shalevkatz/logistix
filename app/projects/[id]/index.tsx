// app/projects/[id].tsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { supabase } from '../../../lib/supabase';

type Project = {
  id: string;
  title: string;
  client_name: string | null;
  location: string | null;
  budget: number | null;
  priority: 'Low' | 'Medium' | 'High' | null;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  owner_id: string;
};

type SiteMapRow = {
  project_id: string;
  image_path: string | null;
};

type FloorRow = {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  image_path: string | null; // ensure this column exists if you plan to use it
};

// Turn a "bucket/key" storage path into a public URL (or return as-is if already a URL)
function toPublicUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const slash = imagePath.indexOf('/');
  if (slash <= 0) return imagePath;

  const bucket = imagePath.slice(0, slash);
  const key = imagePath.slice(slash + 1);
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data?.publicUrl ?? imagePath;
  } catch {
    return imagePath;
  }
}

export default function ProjectDetails() {
  // NOTE: the param name matches the filename: [id].tsx -> params.id
  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectId = useMemo(() => (Array.isArray(id) ? id[0] : id) ?? '', [id]);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [siteMap, setSiteMap] = useState<SiteMapRow | null>(null);
  const [floors, setFloors] = useState<FloorRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!projectId) {
        setError('Missing project id');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        // 1) Project
        const { data: proj, error: pErr } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        if (pErr) throw pErr;

        // 2) Optional site map
        const { data: sm, error: smErr } = await supabase
          .from('site_maps')
          .select('project_id, image_path')
          .eq('project_id', projectId)
          .limit(1)
          .maybeSingle();
        if (smErr && smErr.code !== 'PGRST116') throw smErr;

        // 3) Floors
        const { data: fl, error: fErr } = await supabase
          .from('floors')
          .select('id, project_id, name, order_index, image_path')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true });
        if (fErr) throw fErr;

        if (!mounted) return;
        setProject(proj as Project);
        setSiteMap((sm ?? null) as SiteMapRow | null);
        setFloors((fl ?? []) as FloorRow[]);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        console.error(e);
        setError(e?.message ?? 'Failed to load project');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1020', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ color: 'white', marginTop: 12 }}>Loading project…</Text>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1020', padding: 16 }}>
        <Text style={{ color: '#fecaca', fontWeight: '700', fontSize: 16, marginBottom: 6 }}>
          Couldn’t load project
        </Text>
        <Text style={{ color: '#e5e7eb' }}>{error ?? 'Unknown error'}</Text>

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, backgroundColor: '#1f2937', padding: 12, borderRadius: 10, alignItems: 'center' }}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const siteMapUrl = toPublicUrl(siteMap?.image_path);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b1020' }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{project.title}</Text>
        <Text style={{ color: '#9ca3af' }}>
          {project.client_name ? `${project.client_name} • ` : ''}
          {project.location ?? 'Unknown location'}
        </Text>
      </View>

      {/* Overview image */}
      {siteMapUrl ? (
        <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937' }}>
          <Image source={{ uri: siteMapUrl }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
        </View>
      ) : (
        <View
          style={{
            height: 120,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#1f2937',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#9ca3af' }}>No site map image</Text>
        </View>
      )}

      {/* Details */}
      <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 14, gap: 6 }}>
        {project.description ? (
          <Text style={{ color: '#e5e7eb' }}>{project.description}</Text>
        ) : (
          <Text style={{ color: '#9ca3af' }}>No description</Text>
        )}
        <View style={{ height: 8 }} />
        <Text style={{ color: '#a78bfa' }}>
          Priority: <Text style={{ color: 'white' }}>{project.priority ?? '—'}</Text>
        </Text>
        <Text style={{ color: '#a78bfa' }}>
          Budget: <Text style={{ color: 'white' }}>{project.budget ?? '—'}</Text>
        </Text>
        <Text style={{ color: '#a78bfa' }}>
          Dates: <Text style={{ color: 'white' }}>{project.start_date ?? '—'} → {project.due_date ?? '—'}</Text>
        </Text>
      </View>

      {/* Floors */}
      <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 14 }}>
        <Text style={{ color: 'white', fontWeight: '700', marginBottom: 8 }}>Floors</Text>
        {floors.length === 0 ? (
          <Text style={{ color: '#9ca3af' }}>No floors yet</Text>
        ) : (
          floors.map((f, idx) => {
            const floorUrl = toPublicUrl(f.image_path);
            return (
              <View
                key={f.id}
                style={{
                  paddingVertical: 10,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: '#1f2937',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ color: '#e5e7eb', flex: 1 }}>
                  {f.order_index + 1}. {f.name}
                </Text>
                {floorUrl ? (
                  <View
                    style={{
                      width: 64,
                      height: 42,
                      borderRadius: 8,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: '#1f2937',
                    }}
                  >
                    <Image source={{ uri: floorUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                ) : (
                  <Text style={{ color: '#9ca3af' }}>no image</Text>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flex: 1, backgroundColor: '#1f2937', padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: 'white' }}>Back</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/projects/${project.id}/planner`)}

          style={{ flex: 1, backgroundColor: '#7c3aed', padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: '700' as const }}>Open Planner</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
