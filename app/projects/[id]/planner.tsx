// app/projects/[id].tsx
import FloorManager from '@/components/FloorManager';
import SitePlanner from '@/components/SitePlanner';
import type { Cable, DeviceNode, DeviceType } from '@/components/state/useSiteMapStore';
import { useSiteMapStore } from '@/components/state/useSiteMapStore';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FloorRow = { id: string; project_id: string; name: string; order_index: number; image_path: string | null };
type DeviceRow = { id: string; floor_id: string; type: string; x: number; y: number; rotation: number; scale: number };
type CableRow  = { id: string; floor_id: string; color: string; finished: boolean; points: {x:number;y:number}[] };

export default function ProjectDetail() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();

  // store actions
  const setLocalFloors      = useSiteMapStore((s) => s.setLocalFloors);
  const setActiveFloorId    = useSiteMapStore((s) => s.setActiveFloorId);
  const setFloorImage       = useSiteMapStore((s) => s.setFloorImage);
  const setAllFloorCanvases = useSiteMapStore((s) => s.setAllFloorCanvases);

  const [loading, setLoading] = useState(true);
  const [fmOpen, setFmOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);

        // 1) ensure project exists (optional)
        const { data: proj, error: pErr } = await supabase
          .from('projects')
          .select('id, title')
          .eq('id', projectId)
          .single();
        if (pErr) throw pErr;
        if (!proj) throw new Error('Project not found');

        // 2) floors
        const { data: floors, error: fErr } = await supabase
          .from('floors')
          .select('id, project_id, name, order_index, image_path')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true });
        if (fErr) throw fErr;

        if (!floors || floors.length === 0) {
          // if a project somehow has no floors, seed one locally
          const tmpId = 'tmp_' + Date.now();
          setLocalFloors([{ id: tmpId, name: 'Floor 1', orderIndex: 0 }]);
          setActiveFloorId(tmpId);
          setAllFloorCanvases({});
          setLoading(false);
          return;
        }

        // 3) devices + cables (batched by floor ids)
        const floorIds = floors.map(f => f.id);

        const [{ data: devs, error: dErr }, { data: cabs, error: cErr }] = await Promise.all([
          supabase.from('devices').select('*').in('floor_id', floorIds),
          supabase.from('cables').select('*').in('floor_id', floorIds),
        ]);
        if (dErr) throw dErr;
        if (cErr) throw cErr;

        // 4) normalize DB rows → store types
        const DEVICE_TYPES = ['cctv','nvr','ap','switch','router'] as const;

        const asDeviceNode = (d: DeviceRow): DeviceNode => ({
          id: d.id,
          type: (DEVICE_TYPES as readonly string[]).includes(d.type) ? (d.type as DeviceType) : 'cctv',
          x: Number(d.x),
          y: Number(d.y),
          rotation: Number(d.rotation ?? 0),
          scale: Number(d.scale ?? 1),
        });

        const asCable = (c: CableRow): Cable => ({
          id: c.id,
          color: c.color ?? '#3b82f6',
          finished: !!c.finished,
          points: Array.isArray(c.points)
            ? c.points.map((p: any) => ({ x: Number(p.x), y: Number(p.y) }))
            : [],
        });

        const canvasesForStore: Record<string, { nodes: DeviceNode[]; cables: Cable[] }> = {};
        for (const f of floors) {
          const nodes = (devs ?? []).filter(d => d.floor_id === f.id).map(asDeviceNode);
          const cables = (cabs ?? []).filter(c => c.floor_id === f.id).map(asCable);
          canvasesForStore[f.id] = { nodes, cables };
        }

        // 5) set floors in store (id/name/orderIndex)
        setLocalFloors(
          floors.map((f: FloorRow) => ({
            id: f.id,
            name: f.name || 'Floor',
            orderIndex: f.order_index ?? 0,
          }))
        );

        // 6) images → signed URLs (private bucket) and push into store
        for (const f of floors) {
          if (f.image_path) {
            const { data: signed, error: sErr } = await supabase
              .storage
              .from('site-maps')
              .createSignedUrl(f.image_path, 60 * 60 * 6); // 6h
            if (!sErr && signed?.signedUrl) {
              setFloorImage(f.id, signed.signedUrl);
            } else {
              setFloorImage(f.id, null);
            }
          } else {
            setFloorImage(f.id, null);
          }
        }

        // 7) canvases into store
        setAllFloorCanvases(canvasesForStore);

        // 8) activate first floor
        setActiveFloorId(floors[0].id);

        setLoading(false);
      } catch (e: any) {
        console.error('load project failed', e);
        Alert.alert('Error', e?.message ?? 'Failed to load project');
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1020' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  // Planner uses the store's currentBackgroundUrl and nodes/cables
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020' }}>
      <View style={{ flex: 1 }}>
        <SitePlanner imageUrl={(useSiteMapStore.getState() as any).currentBackgroundUrl} />
      </View>

      <View style={{ padding: 12 }}>
        <Pressable
          onPress={() => setFmOpen(true)}
          style={{ backgroundColor: '#374151', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, alignSelf: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: '700' as const }}>Manage Floors</Text>
        </Pressable>
      </View>

      <FloorManager visible={fmOpen} onClose={() => setFmOpen(false)} />
    </SafeAreaView>
  );
}