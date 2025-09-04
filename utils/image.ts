// utils/image.ts
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Force the image to a memory-safe size before UI or upload.
 * - Max width: 1200px (keeps aspect ratio)
 * - JPEG @ 0.6 quality
 */
export async function ensureSafePhoto(uri: string): Promise<string> {
  // Some camera images have weird EXIF rotations; the manipulator will normalize orientation
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
