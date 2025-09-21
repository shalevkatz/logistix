import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

type Project = { id: string; title: string; owner_id: string | null };
type FloorRow = {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  image_path: string | null;
};

export default function Planner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectId = useMemo(() => (Array.isArray(id) ? id[0] : id) ?? '', [id]);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [floorImageUrl, setFloorImageUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Simple function to get image URL - assumes 'site-maps' bucket
  const getImageUrl = (imagePath: string | null): string | null => {
    if (!imagePath) return null;
    
    try {
      // Clean the path - your upload function returns path like "userId/imageId.jpg"
      const cleanPath = imagePath.replace(/^\/+/, '');
      
      console.log('🔍 Getting URL for path:', cleanPath);
      
      // Get public URL from site-maps bucket
      const { data } = supabase.storage.from('site-maps').getPublicUrl(cleanPath);
      
      console.log('🖼️ Generated image URL:', data?.publicUrl);
      return data?.publicUrl || null;
    } catch (error) {
      console.error('❌ Error generating image URL:', error);
      return null;
    }
  };

  const loadProject = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('[loadProject] Loading project with ID:', projectId);
      
      // Fetch the project details and the floors for that project
      const [{ data: proj, error: pErr }, { data: fl, error: fErr }] = await Promise.all([
        supabase.from('projects').select('id, title, owner_id').eq('id', projectId).single(),
        supabase
          .from('floors')
          .select('id, project_id, name, order_index, image_path')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true }),
      ]);

      if (pErr) {
        console.error('[loadProject] Project fetch error:', pErr);
        throw pErr;
      }
      if (fErr) {
        console.error('[loadProject] Floors fetch error:', fErr);
        throw fErr;
      }

      const floors = (fl ?? []) as FloorRow[];
      console.log('[loadProject] Fetched project:', proj);
      console.log('[loadProject] Fetched floors:', floors);
      
      setProject(proj as Project);
      
      // Set debug info
      if (floors.length > 0) {
        const firstFloor = floors[0];
        setDebugInfo({
          projectId: projectId,
          floorsCount: floors.length,
          imagePath: firstFloor.image_path,
        });

        // Get image URL
        if (firstFloor.image_path) {
          const imageUrl = getImageUrl(firstFloor.image_path);
          setFloorImageUrl(imageUrl);
        }
      }
      
    } catch (e: any) {
      console.error('[loadProject] Error loading project:', e);
      Alert.alert('Error', e?.message ?? 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  if (loading || !project) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1020', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1020' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>{project.title}</Text>
        </View>
      </View>
      
      {/* Debug Info */}
      <View style={{ padding: 16, backgroundColor: '#1f2937', margin: 12, borderRadius: 8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>Project Info:</Text>
        
        {debugInfo && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#a3a3a3', fontSize: 12 }}>
              Project ID: {debugInfo.projectId}
            </Text>
            <Text style={{ color: '#a3a3a3', fontSize: 12 }}>
              Floors Count: {debugInfo.floorsCount}
            </Text>
            <Text style={{ color: '#a3a3a3', fontSize: 12 }}>
              Image Path: {debugInfo.imagePath || 'None'}
            </Text>
          </View>
        )}
        
        {floorImageUrl && (
          <View>
            <Text style={{ color: 'lime', fontWeight: 'bold' }}>✅ Image URL Generated</Text>
          </View>
        )}
      </View>
      
      {/* Image Display */}
      <View style={{ flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center' }}>
        {floorImageUrl ? (
          <View style={{ flex: 1, width: '100%' }}>
            <Text style={{ color: 'white', marginBottom: 8, textAlign: 'center' }}>
              Site Map Image:
            </Text>
            <Image
              source={{ uri: floorImageUrl }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              onError={(e) => {
                console.error('❌ Image loading error:', e.nativeEvent.error);
                Alert.alert('Image Load Error', 'Could not load the site map image. The file may not exist in storage.');
              }}
              onLoad={() => console.log('✅ Image loaded successfully')}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 8 }}>
              No Site Map Image
            </Text>
            <Text style={{ color: '#a3a3a3', fontSize: 14, textAlign: 'center' }}>
              {debugInfo?.imagePath ? 
                'Image path exists but could not generate URL' : 
                'No image was uploaded for this project'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Back Button */}
      <View style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 8, flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flex: 1, backgroundColor: '#1f2937', padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: 'white' }}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}