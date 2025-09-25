import SitePlanner from '@/components/SitePlanner';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type Floor = { id: string; image_path: string | null };

export default function Planner() {
  const { id, floorId } = useLocalSearchParams<{ id: string; floorId?: string }>();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      // אם יש floorId – נטען אותה; אחרת, נביא את הראשונה
      const qb = supabase.from('floors').select('id, image_path').limit(1);
      const { data, error } = floorId
        ? await qb.eq('id', floorId)
        : await qb.eq('project_id', id as string)
                 .order('order_index', { ascending: true, nullsFirst: false })
                 .order('created_at', { ascending: true });

      if (!mounted) return;
      if (error) { setFloor(null); setLoading(false); return; }

      setFloor(data?.[0] ?? null);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [id, floorId]);

  if (loading) return <ActivityIndicator />;

  // אם אין קומה בכלל – הצג את ה־empty state (כפתור Manage Floors וכו')
  if (!floor) {
    return (
      /* המסך הרגיל שלך של “אין קומות עדיין” */
      <View style={{ flex: 1, backgroundColor: '#0b1420' }} />
    );
  }

  // אם יש קומה אך ללא תמונה – הצג את ה־empty state של אותה קומה (אפשר להשאיר כפתור Manage Floors)
  if (!floor.image_path) {
    return (
      /* אותו empty state, אבל עכשיו זה "אמיתי" עבור הקומה הזו */
      <View style={{ flex: 1, backgroundColor: '#0b1420' }} />
    );
  }

  // אם יש תמונה – הצג "פשוט" את התמונה (ללא הפלנר) או הזן אותה ל־SitePlanner כ-imageUrl
  return (
    <View style={{ flex: 1, backgroundColor: '#2584ffff' }}>
      <SitePlanner imageUrl={floor.image_path} floorId={floor.id} projectId={id as string} />
    </View>
    // לחלופין:
    // <SitePlanner imageUrl={floor.image_path} floorId={floor.id} projectId={id as string} />
  );
}