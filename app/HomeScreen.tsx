// app/HomeScreen.tsx
import { Href, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
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
  const { profile, loading: profileLoading } = useProfile(userId);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUserId(session?.user?.id);
      setEmail(session?.user?.email ?? 'User');
      setUserMeta(session?.user?.user_metadata ?? {});
    });
    return () => { mounted = false; };
  }, []);

  const { projects, loading, error, refetch } = useProjects(userId);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        (project.title?.toLowerCase().includes(query) ?? false) ||
        (project.description?.toLowerCase().includes(query) ?? false)
    );
  }, [projects, searchQuery]);

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

  // Delete project
  const deleteProject = async (projectId: string, projectTitle: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // First, fetch all floors associated with this project to get image paths
              const { data: floors, error: floorsError } = await supabase
                .from('floors')
                .select('image_path')
                .eq('project_id', projectId);

              if (floorsError) {
                console.error('Error fetching floors:', floorsError);
              }

              // Delete images from storage bucket if they exist
              if (floors && floors.length > 0) {
                const imagePaths = floors
                  .map(floor => floor.image_path)
                  .filter(path => path != null); // Remove null/undefined paths

                if (imagePaths.length > 0) {
                  const { error: storageError } = await supabase.storage
                    .from('site-maps')
                    .remove(imagePaths);

                  if (storageError) {
                    console.error('Error deleting images from storage:', storageError);
                    // Continue with project deletion even if image deletion fails
                  }
                }
              }

              // Delete the project (this should cascade delete floors if FK is set up)
              const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

              if (projectError) {
                Alert.alert('Error', 'Failed to delete project: ' + projectError.message);
              } else {
                // Refresh the projects list
                await refetch();
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred while deleting the project.');
              console.error('Delete project error:', err);
            }
          },
        },
      ]
    );
  };

  // Render left swipe actions (delete button)
  const renderLeftActions = (projectId: string, projectTitle: string) => {
    return (
      <Pressable
        style={styles.deleteButton}
        onPress={() => deleteProject(projectId, projectTitle)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    );
  };

  // ✅ Open the full project page (fetches details by id)
  const openProject = async (id: string) => {
    const { data, error } = await supabase
      .from('floors')
      .select('id, image_path, created_at, order_index')
      .eq('project_id', id)
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .limit(1);

    const first = data?.[0];
    router.push({
      pathname: '/projects/[id]/planner',
      params: first ? { id, floorId: first.id } : { id }
    } as Href);
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

      {/* Error / Empty / List */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn't load projects: {error}</Text>
          <Pressable onPress={refetch} style={[styles.primaryBtn, { marginTop: 12 }]}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : projects.length === 0 ? (
        // Empty state
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Let's start your first project</Text>
          <Text style={styles.emptySubtitle}>
            Create a project to track tasks, hours, and reports.
          </Text>

          <Pressable onPress={() => router.push('/create-project')} style={styles.bigAddCircle}>
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

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? `Results (${filteredProjects.length})` : 'Recent'}
            </Text>
            <Pressable onPress={() => router.push('/create-project')}>
              <Text style={styles.link}>+ New</Text>
            </Pressable>
          </View>

          {filteredProjects.length === 0 ? (
            <View style={styles.emptySearchWrap}>
              <Text style={styles.emptySearchText}>
                No projects found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProjects}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Swipeable
                  renderLeftActions={() => renderLeftActions(item.id, item.title || 'Untitled')}
                  overshootLeft={false}
                >
                  <Pressable onPress={() => openProject(item.id)} style={styles.projectCard}>
                    <Text style={styles.projectName}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.projectDesc}>{item.description || 'No description'}</Text>
                  </Pressable>
                </Swipeable>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}