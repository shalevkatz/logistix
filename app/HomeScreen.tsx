// app/HomeScreen.tsx
import { Href, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../hooks/useProfile';
import { useProjects } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import { styles } from '../styles/HomeScreen.styles';

export default function HomeScreen() {
  const router = useRouter();

  // read session once for user id + email
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string>('User');
  const [userMeta, setUserMeta] = useState<Record<string, any>>({});
  const { profile, loading: profileLoading, error: profileError } = useProfile(userId);

useEffect(() => {
  let mounted = true;
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!mounted) return;
    setUserId(session?.user?.id);
    setEmail(session?.user?.email ?? 'User');
    setUserMeta(session?.user?.user_metadata ?? {});   // 👈 add this
  });
  return () => { mounted = false; };
}, []);

  const { projects, loading, error, refetch } = useProjects(userId);
  
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const goNew = () => router.push('/projects/new');
  const openProject = (id: string) => {
    router.push({ pathname: '/projects/[id]', params: { id } } as Href);
  };

  if (loading || userId === undefined) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Welcome</Text>
          <Text style={styles.title}>{profileLoading ? '...' : (profile?.full_name || 'User')}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn’t load projects: {error}</Text>
          <Pressable onPress={refetch} style={[styles.primaryBtn, { marginTop: 12 }]}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : projects.length === 0 ? (
        // Empty state
<View style={styles.emptyWrap}>
  <Text style={styles.emptyTitle}>Let’s start your first project</Text>
  <Text style={styles.emptySubtitle}>
    Create a project to track tasks, hours, and reports.
  </Text>

  <Pressable onPress={() => {console.log('nav -> /create-project');
    router.push('/create-project');
  }}  style={styles.bigAddCircle}>
    <Text style={styles.bigAddText}>+</Text>
  </Pressable>
</View>



      ) : (
        // Projects list
        <View style={{ flex: 1 }}>
          <View style={styles.summaryRow}>
            <View style={styles.card}>
              <Text style={styles.cardNum}>{projects.length}</Text>
              <Text style={styles.cardLabel}>Your Projects</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Active</Text>
            </View>
          </View>

          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <Pressable onPress={goNew}><Text style={styles.link}>+ New</Text></Pressable>
          </View>

          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => openProject(item.id)} style={styles.projectCard}>
                <Text style={styles.projectName}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.projectDesc}>{item.description || 'No description'}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
