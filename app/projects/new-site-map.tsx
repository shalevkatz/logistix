// app/projects/new-site-map.tsx
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, LayoutChangeEvent, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

type MarkerType = 'CCTV' | 'Cable' | 'AP';
type Marker = { x: number; y: number; type: MarkerType; note?: string };

export default function NewSiteMapScreen() {
  // We receive all project fields (NOT created yet) via `payload` param as JSON
  const { payload: payloadStr } = useLocalSearchParams<{ payload?: string }>();

  // Parse payload safely
  let projectPayload: Record<string, any> | null = null;
  try {
    projectPayload = payloadStr ? JSON.parse(payloadStr) : null;
  } catch {
    projectPayload = null;
  }

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [viewSize, setViewSize] = useState<{ w: number; h: number } | null>(null);
  const [type, setType] = useState<MarkerType>('CCTV');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const imageRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted' && lib.status !== 'granted') {
      Alert.alert('Permission required', 'We need camera or library access.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      setImageUri(asset.uri);
      if (asset.width && asset.height) {
        setNaturalSize({ w: asset.width, h: asset.height });
      } else {
        // fallback to fetch natural size
        Image.getSize(asset.uri, (w, h) => setNaturalSize({ w, h }), () => {});
      }
    }
  };

  const onImgLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (naturalSize) {
      const ratio = naturalSize.h / naturalSize.w;
      setViewSize({ w: width, h: width * ratio });
    }
  };

  const addMarker = (evt: any) => {
    if (!viewSize || !naturalSize) return;
    const { locationX, locationY } = evt.nativeEvent;
    // Normalize to [0,1]
    const x = Math.max(0, Math.min(1, locationX / viewSize.w));
    const y = Math.max(0, Math.min(1, locationY / viewSize.h));
    setMarkers((prev) => [...prev, { x, y, type }]);
  };

  const colorFor = (t: MarkerType) =>
    t === 'CCTV' ? '#ff4757' : t === 'Cable' ? '#ffa502' : '#1e90ff';

  const save = async () => {
    try {
      // Guards
      if (!projectPayload) {
        Alert.alert('Error', 'Missing project details. Please go back and try again.');
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert('Not signed in', 'Please log in again.');
        return;
      }
      if (!imageUri) {
        Alert.alert('Image required', 'Please select or take a site map photo.');
        return;
      }

      setSaving(true);

      // 1) Upload image to Storage
      const filename = `${user.id}/pending/${Date.now()}.jpg`;
      const resp = await fetch(imageUri);
      const blob = await resp.blob();

      const { data: up, error: upErr } = await supabase.storage
        .from('site-maps')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      // 2) Create the project and get its id
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .insert([projectPayload])
        .select('id')
        .single();
      if (projErr) throw projErr;

      // 3) Insert the site map row linked to the new project
      const { error: mapErr } = await supabase.from('site_maps').insert([
        {
          project_id: proj.id,
          owner_id: user.id,
          image_path: up.path,
          markers, // jsonb
        },
      ]);
      if (mapErr) {
        // Rollback project create if map save fails
        await supabase.from('projects').delete().eq('id', proj.id);
        throw mapErr;
      }

      Alert.alert('Setup complete ✅', 'Project created with site map.');
      router.replace({ pathname: '/', params: { r: String(Date.now()) } });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to create project with site map.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#0f0f10', flexGrow: 1 }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
        Add Site Map
      </Text>
      <Text style={{ color: '#9aa0a6', marginBottom: 12 }}>
        Step 2 of 2 — Add a site map to complete project creation.
      </Text>

      {/* Type picker */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {(['CCTV', 'Cable', 'AP'] as MarkerType[]).map((t) => {
          const active = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: active ? colorFor(t) : '#17181b',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Image picker */}
      {!imageUri ? (
        <Pressable
          onPress={pickImage}
          style={{
            backgroundColor: '#17181b',
            borderWidth: 1,
            borderColor: '#2a2b2f',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            height: 160,
          }}
        >
          <Text style={{ color: '#9aa0a6' }}>Tap to choose site image</Text>
        </Pressable>
      ) : (
        <View>
          <View onLayout={onImgLayout}>
            {viewSize && (
              <View style={{ width: viewSize.w }}>
                <Pressable onPress={addMarker}>
                  <Image
                    ref={imageRef}
                    source={{ uri: imageUri }}
                    style={{ width: viewSize.w, height: viewSize.h, borderRadius: 12 }}
                    resizeMode="contain"
                  />
                  {/* Markers overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: viewSize.w,
                      height: viewSize.h,
                    }}
                    pointerEvents="none"
                  >
                    <Svg width={viewSize.w} height={viewSize.h}>
                      {markers.map((m, idx) => (
                        <Circle
                          key={idx}
                          cx={m.x * viewSize.w}
                          cy={m.y * viewSize.h}
                          r={8}
                          fill={colorFor(m.type)}
                        />
                      ))}
                    </Svg>
                  </View>
                </Pressable>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable
              onPress={() => setMarkers([])}
              style={{
                flex: 1,
                backgroundColor: '#2a2b2f',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Clear</Text>
            </Pressable>

            <Pressable
              onPress={save}
              disabled={saving}
              style={{
                flex: 1,
                backgroundColor: saving ? '#4e49b0' : '#6C63FF',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: saving ? 0.9 : 1,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>
                {saving ? 'Saving…' : 'Save & Create Project'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}