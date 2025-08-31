// app/projects/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Stack.Screen options={{ title: 'Project' }} />
      <View><Text>Project ID: {id}</Text></View>
    </SafeAreaView>
  );
}
