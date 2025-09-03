// app/projects/[id]/site-map.tsx
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, LayoutChangeEvent, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../../lib/supabase';

type MarkerType = 'CCTV' | 'Cable' | 'AP';
type Marker = { x: number; y: number; type: MarkerType; note?: string };

export default function SiteMapScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [viewSize, setViewSize] = useState<{ w: number; h: number } | null>(null);
  const [type, setType] = useState<MarkerType>('CCTV');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const imageRef = useRef<any>(null);

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
        // fallback: load to get natural size
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
    // נורמליזציה ל-[0,1]
    const x = Math.max(0, Math.min(1, locationX / viewSize.w));
    const y = Math.max(0, Math.min(1, locationY / viewSize.h));
    setMarkers((prev) => [...prev, { x, y, type }]);
  };

  const colorFor = (t: MarkerType) =>
    t === 'CCTV' ? '#ff4757' : t === 'Cable' ? '#ffa502' : '#1e90ff';

  const save = async () => {
    try {
      if (!projectId) {
        Alert.alert('Error', 'Missing project id');
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

      // העלאת תמונה ל-Storage (פעם ראשונה)
      // נשתמש בשם קובץ ייחודי
      const filename = `${user.id}/${projectId}/${Date.now()}.jpg`;

      // המרה ל-bytes
      const resp = await fetch(imageUri);
      const blob = await resp.blob();

      const { data: up, error: upErr } = await supabase.storage
        .from('site-maps')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      // שמירת רשומה ב-DB עם markers כ-JSON
      const { error: insErr } = await supabase.from('site_maps').insert([
        {
          project_id: projectId,
          owner_id: user.id,
          image_path: up.path,
          markers, // jsonb
        },
      ]);
      if (insErr) throw insErr;

      Alert.alert('Saved ✅', 'Site map saved with annotations.');
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to save site map.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#0f0f10', flexGrow: 1 }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
        Site Map
      </Text>

      {/* בחירת סוג סימון */}
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

      {/* בחירת תמונה */}
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
            {/* תמונה בקנה מידה */}
            {viewSize && (
              <View style={{ width: viewSize.w }}>
                <Pressable onPress={addMarker}>
                  <Image
                    ref={imageRef}
                    source={{ uri: imageUri }}
                    style={{ width: viewSize.w, height: viewSize.h, borderRadius: 12 }}
                    resizeMode="contain"
                  />
                  {/* שכבת סימונים */}
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

          {/* פעולות */}
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
              style={{
                flex: 1,
                backgroundColor: '#6C63FF',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}