import SitePlanner from '@/components/SitePlanner';
import { EditorMode } from '@/components/types';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';


function toPublicUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('site-maps').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default function ProjectScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = useState<EditorMode>('read'); // ← ברירת מחדל: צפייה
  const projectTitle = useMemo(() => `Project ${String(projectId).slice(0, 6)}`, [projectId]);

  
  // --- הוקים חייבים להיות לפני כל return מותנה ---
  // counter יציב כדי לשבור קאש רק כש-imageUrl משתנה
  const cacheBusterRef = React.useRef(0);
  React.useEffect(() => {
    cacheBusterRef.current += 1;
  }, [imageUrl]);

    useEffect(() => {
    nav.setOptions?.({
      title: projectTitle,
      headerRight: () => (
        <Pressable
          onPress={() => setMode(m => (m === 'read' ? 'edit' : 'read'))}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ fontWeight: '600' }}>
            {mode === 'read' ? 'Edit' : 'Done'}
          </Text>
        </Pressable>
      ),
    });
  }, [nav, mode, projectTitle]);

  const bustedUrl = React.useMemo(() => {
    if (!imageUrl) return null;
    const sep = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${sep}v=${cacheBusterRef.current}`;
  }, [imageUrl]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('floors')
        .select('image_path')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (error) {
        console.log('floors select error:', error);
        setImageUrl(null);
      } else {
        const path = data?.[0]?.image_path ?? null;
        setImageUrl(toPublicUrl(path));
      }
      setLoading(false);
    })();
  }, [projectId]);

  // --- עכשיו מותר return מותנה ---
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {bustedUrl ? (
        // key מכריח רינדור מחדש כש-url משתנה
        <SitePlanner key={bustedUrl} imageUrl={bustedUrl} />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          אין עדיין תמונה לקומה הזו
        </Text>
      )}
    </View>
  );
}