// app/lib/uploadSiteMap.ts
import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import { nanoid } from 'nanoid/non-secure';
import { supabase } from '../lib/supabase';

export async function uploadSiteMapAndGetPath(localUri: string, userId: string) {
  // downscale + compress to avoid memory crashes
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1600 } }], // keep width <= 1600 for safety
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!manipulated.base64) throw new Error('Failed to prepare image');

  const siteMapId = nanoid();
  const path = `${userId}/${siteMapId}.jpg`;

  const { error: upErr } = await supabase.storage
    .from('sitemaps')
    .upload(path, decode(manipulated.base64), { contentType: 'image/jpeg', upsert: false });

  if (upErr) throw upErr;
  return path; // STORAGE PATH, not URL
}
