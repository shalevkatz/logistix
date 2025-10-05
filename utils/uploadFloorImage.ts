// utils/uploadFloorImage.ts
import { supabase } from '@/lib/supabase';
import { decode as atob } from 'base-64';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/** base64 -> Uint8Array */
function base64ToUint8(base64: string): Uint8Array {
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** ממיר URI של תמונה לבייטים של JPEG בצורה יציבה (מטפל ב-HEIC/iOS) */
export async function toJpegBytes(uri: string): Promise<Uint8Array> {
  // מכריחים שמירה כ-JPEG (גם אם המקור HEIC)
  const jpeg = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
  );

  // קוראים את הקובץ כ-base64 (אמין ב-Expo/RN)
  const base64 = await FileSystem.readAsStringAsync(jpeg.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return base64ToUint8(base64);
}

/** מזהה קצר לייחודיות שם הקובץ */
function shortId() {
  return Math.random().toString(36).slice(2, 8);
}

/** העלאה עם retry לתקלות "Network request failed" */
async function uploadWithRetry(
  storagePath: string,
  bytes: Uint8Array,
  options: { contentType: string; upsert: boolean; cacheControl: string },
  retries = 3
) {
  try {
    const { error } = await supabase.storage
      .from('site-maps')
      .upload(storagePath, bytes, options);
    if (error) throw error;
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const isNet = /Network request failed/i.test(msg) || err?.name === 'StorageUnknownError';
    if (retries > 0 && isNet) {
      const wait = 400 * (4 - retries); // 400ms, 800ms, 1200ms
      await new Promise((r) => setTimeout(r, wait));
      return uploadWithRetry(storagePath, bytes, options, retries - 1);
    }
    throw err;
  }
}

/** מעלה תמונת רצפה ומחזיר את ה-path לשמירה בעמודת floors.image_path */
export async function uploadFloorImage(processedUri: string, floorDbId: string, idx: number) {
  const bytes = await toJpegBytes(processedUri);

  // הגנה מפני קבצים ריקים/פגומים
  if (!bytes || bytes.byteLength < 5000) {
    throw new Error(`Invalid image bytes (${bytes?.byteLength ?? 0})`);
  }

  // שם קובץ ייחודי תמיד
  const filename = `site-map-${Date.now()}-${idx}-${shortId()}.jpg`;
  const storagePath = `floors/${floorDbId}/${filename}`;

  await uploadWithRetry(
    storagePath,
    bytes,
    { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' }
  );

  return storagePath;
}