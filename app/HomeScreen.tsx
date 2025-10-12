// app/HomeScreen.tsx
import { Href, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { useProfile } from '../hooks/useProfile';
import { useProjects } from '../hooks/useProjects';
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel, ServiceCallStatus, useServiceCalls } from '../hooks/useServiceCalls';
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
  
  // Filter state for active/completed projects
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'projects' | 'service-calls' | 'employees'>('projects');

  // Add Employee state
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

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
  
  // Service calls data
  const { serviceCalls, loading: serviceCallsLoading, error: serviceCallsError, refetch: refetchServiceCalls } = useServiceCalls(userId);
  
  // Service calls filter state
  const [serviceCallStatusFilter, setServiceCallStatusFilter] = useState<'active' | 'open' | 'in_progress' | 'completed'>('active');

  // Fetch employees function
  const fetchEmployees = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingEmployees(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('role', 'employee')
        .eq('manager_id', userId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error loading employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  }, [userId]);

  // Delete employee function
  const deleteEmployee = async (employeeId: string, employeeName: string) => {
    Alert.alert(
      'Delete Employee',
      `Remove "${employeeName}" from your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', employeeId);

              if (error) throw error;
              fetchEmployees();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };

  // Render delete action for employees
  const renderEmployeeLeftActions = (employeeId: string, employeeName: string) => {
    return (
      <Pressable
        style={styles.deleteButton}
        onPress={() => deleteEmployee(employeeId, employeeName)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    );
  };

  // Filter projects based on search query and completed status
  const filteredProjects = useMemo(() => {
    // First filter by completed status
    let filtered = projects.filter(p => showCompleted ? p.completed : !p.completed);
    
    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          (project.title?.toLowerCase().includes(query) ?? false) ||
          (project.description?.toLowerCase().includes(query) ?? false)
      );
    }
    
    return filtered;
  }, [projects, searchQuery, showCompleted]);
  
  // Count active and completed projects
  const activeProjectsCount = useMemo(() => 
    projects.filter(p => !p.completed).length, 
    [projects]
  );
  
  const completedProjectsCount = useMemo(() => 
    projects.filter(p => p.completed).length, 
    [projects]
  );
  
  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(emp =>
      emp.full_name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  // Count employees
  const employeesCount = useMemo(() => employees.length, [employees]);
  
  // Filter service calls
  const filteredServiceCalls = useMemo(() => {
    let filtered = serviceCalls;

    // Filter by status
    if (serviceCallStatusFilter === 'active') {
      filtered = filtered.filter(call => call.status === 'open' || call.status === 'in_progress');
    } else {
      filtered = filtered.filter(call => call.status === serviceCallStatusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        call =>
          call.title.toLowerCase().includes(query) ||
          call.customer_name.toLowerCase().includes(query) ||
          (call.description?.toLowerCase().includes(query) ?? false) ||
          (call.customer_address?.toLowerCase().includes(query) ?? false)
      );
    }

    return filtered;
  }, [serviceCalls, searchQuery, serviceCallStatusFilter]);
  
  // Count service calls by status
  const serviceCallStatusCounts = useMemo(() => ({
    active: serviceCalls.filter(c => c.status === 'open' || c.status === 'in_progress').length,
    open: serviceCalls.filter(c => c.status === 'open').length,
    in_progress: serviceCalls.filter(c => c.status === 'in_progress').length,
    completed: serviceCalls.filter(c => c.status === 'completed').length,
  }), [serviceCalls]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchServiceCalls();
      fetchEmployees();
    }, [refetch, refetchServiceCalls, fetchEmployees])
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'projects') {
      await refetch();
    } else if (activeTab === 'service-calls') {
      await refetchServiceCalls();
    } else if (activeTab === 'employees') {
      await fetchEmployees();
    }
    setRefreshing(false);
  };
  
  const handleCallCustomer = (phone: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Delete service call
  const deleteServiceCall = async (callId: string, callTitle: string) => {
    Alert.alert(
      'Delete Service Call',
      `Are you sure you want to delete "${callTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('service_calls')
                .delete()
                .eq('id', callId);

              if (error) {
                Alert.alert('Error', 'Failed to delete service call: ' + error.message);
              } else {
                await refetchServiceCalls();
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred while deleting.');
              console.error('Delete service call error:', err);
            }
          }
        }
      ]
    );
  };

  // Mark service call as complete
  const completeServiceCall = async (callId: string, callTitle: string) => {
    Alert.alert(
      'Complete Service Call',
      `Mark "${callTitle}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('service_calls')
                .update({ 
                  status: 'completed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', callId);

              if (error) {
                Alert.alert('Error', 'Failed to update service call: ' + error.message);
              } else {
                await refetchServiceCalls();
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred.');
              console.error('Complete service call error:', err);
            }
          }
        }
      ]
    );
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
              const { data: floors, error: floorsError } = await supabase
                .from('floors')
                .select('image_path')
                .eq('project_id', projectId);

              if (floorsError) {
                console.error('Error fetching floors:', floorsError);
              }

              if (floors && floors.length > 0) {
                const imagePaths = floors
                  .map(floor => floor.image_path)
                  .filter(path => path != null);

                if (imagePaths.length > 0) {
                  const { error: storageError } = await supabase.storage
                    .from('floor-plans')
                    .remove(imagePaths);

                  if (storageError) {
                    console.error('Error deleting images from storage:', storageError);
                  }
                }
              }

              const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

              if (projectError) {
                Alert.alert('Error', 'Failed to delete project: ' + projectError.message);
              } else {
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

  // Render left swipe actions for service calls (delete button)
  const renderServiceCallLeftActions = (callId: string, callTitle: string) => {
    return (
      <Pressable
        style={styles.deleteButton}
        onPress={() => deleteServiceCall(callId, callTitle)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    );
  };

  // Render right swipe actions for service calls (complete button)
  const renderServiceCallRightActions = (callId: string, callTitle: string, status: ServiceCallStatus) => {
    if (status === 'completed') return null;
    
    return (
      <Pressable
        style={styles.completeButton}
        onPress={() => completeServiceCall(callId, callTitle)}
      >
        <Text style={styles.completeButtonText}>✓ Complete</Text>
      </Pressable>
    );
  };

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

      {/* Tab Content */}
      {activeTab === 'projects' ? (
        // PROJECTS TAB
        error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Couldn't load projects: {error}</Text>
            <Pressable onPress={refetch} style={[styles.primaryBtn, { marginTop: 12 }]}>
              <Text style={styles.primaryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : projects.length === 0 ? (
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
          <View style={{ flex: 1 }}>
            <View style={styles.summaryRow}>
              <View style={[styles.card, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.cardNum}>{activeProjectsCount}</Text>
                <Text style={styles.cardLabel}>Active Projects</Text>
              </View>
              <View style={[styles.card, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.cardNum}>{completedProjectsCount}</Text>
                <Text style={styles.cardLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.toggleContainer}>
              <Pressable 
                onPress={() => setShowCompleted(false)}
                style={[styles.toggleButton, !showCompleted && styles.toggleButtonActive]}
              >
                <Text style={[styles.toggleText, !showCompleted && styles.toggleTextActive]}>
                  Active
                </Text>
              </Pressable>
              <Pressable 
                onPress={() => setShowCompleted(true)}
                style={[styles.toggleButton, showCompleted && styles.toggleButtonActive]}
              >
                <Text style={[styles.toggleText, showCompleted && styles.toggleTextActive]}>
                  Completed
                </Text>
              </Pressable>
            </View>

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
                {searchQuery 
                  ? `Results (${filteredProjects.length})` 
                  : showCompleted 
                    ? 'Completed Projects' 
                    : 'Recent Projects'
                }
              </Text>
              {!showCompleted && (
                <Pressable onPress={() => router.push('/create-project')} style={styles.newProjectBtn}>
                  <Text style={styles.newProjectBtnText}>+ New</Text>
                </Pressable>
              )}
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
                contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <Swipeable
                    renderLeftActions={() => renderLeftActions(item.id, item.title || 'Untitled')}
                    overshootLeft={false}
                  >
                    <Pressable 
                      onPress={() => openProject(item.id)} 
                      style={[
                        styles.projectCard,
                        item.completed && styles.projectCardCompleted
                      ]}
                    >
                      <View style={styles.projectCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.projectName}>{item.title}</Text>
                          {item.client_name && (
                            <Text style={styles.projectClient}>👤 {item.client_name}</Text>
                          )}
                        </View>
                        {item.completed && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>✓ Done</Text>
                          </View>
                        )}
                        {!item.completed && item.priority && (
                          <View style={[
                            styles.projectPriorityBadge,
                            { backgroundColor: 
                              item.priority === 'High' ? '#EF4444' : 
                              item.priority === 'Medium' ? '#F59E0B' : '#10B981'
                            }
                          ]}>
                            <Text style={styles.projectPriorityText}>{item.priority}</Text>
                          </View>
                        )}
                      </View>

                      {item.location && (
                        <Text style={styles.projectLocation} numberOfLines={1}>📍 {item.location}</Text>
                      )}

                      {item.start_date && (
                        <Text style={styles.projectDate}>
                          📅 Start: {new Date(item.start_date).toLocaleDateString()}
                        </Text>
                      )}

                      {item.due_date && (
                        <Text style={styles.projectDate}>
                          🎯 Due: {new Date(item.due_date).toLocaleDateString()}
                        </Text>
                      )}

                      {item.description && (
                        <Text numberOfLines={2} style={styles.projectDesc}>
                          {item.description}
                        </Text>
                      )}

                      {item.completed && item.completed_at && (
                        <Text style={styles.completedDate}>
                          Completed: {new Date(item.completed_at).toLocaleDateString()}
                        </Text>
                      )}
                    </Pressable>
                  </Swipeable>
                )}
              />
            )}
          </View>
        )
      ) : activeTab === 'service-calls' ? (
        // SERVICE CALLS TAB
        serviceCallsError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Couldn't load service calls: {serviceCallsError}</Text>
            <Pressable onPress={refetchServiceCalls} style={[styles.primaryBtn, { marginTop: 12 }]}>
              <Text style={styles.primaryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : serviceCalls.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No service calls yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first service call to track maintenance and support requests.
            </Text>
            <Pressable onPress={() => router.push('/create-service-call')} style={styles.bigAddCircle}>
              <Text style={styles.bigAddText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.summaryRow}>
              <View style={[styles.card, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.cardNum}>{serviceCallStatusCounts.active}</Text>
                <Text style={styles.cardLabel}>Active Calls</Text>
              </View>
              <View style={[styles.card, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.cardNum}>{serviceCallStatusCounts.completed}</Text>
                <Text style={styles.cardLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.serviceCallFilterTabs}>
              {(['active', 'open', 'in_progress', 'completed'] as const).map(status => (
                <Pressable
                  key={status}
                  onPress={() => setServiceCallStatusFilter(status)}
                  style={[styles.serviceCallFilterTab, serviceCallStatusFilter === status && styles.serviceCallFilterTabActive]}
                >
                  <Text style={[styles.serviceCallFilterTabText, serviceCallStatusFilter === status && styles.serviceCallFilterTabTextActive]}>
                    {status === 'active' ? 'Active' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search service calls..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? `Results (${filteredServiceCalls.length})` : 'Service Calls'}
              </Text>
              <Pressable onPress={() => router.push('/create-service-call')} style={styles.newProjectBtn}>
                <Text style={styles.newProjectBtnText}>+ New</Text>
              </Pressable>
            </View>

            {filteredServiceCalls.length === 0 ? (
              <View style={styles.emptySearchWrap}>
                <Text style={styles.emptySearchText}>
                  No service calls found {searchQuery && `for "${searchQuery}"`}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredServiceCalls}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <Swipeable
                    renderLeftActions={() => renderServiceCallLeftActions(item.id, item.title)}
                    renderRightActions={() => renderServiceCallRightActions(item.id, item.title, item.status)}
                    overshootLeft={false}
                    overshootRight={false}
                  >
                    <Pressable
                      onPress={() => router.push(`/service-calls/${item.id}`)}
                      style={[styles.serviceCallCard, { borderLeftColor: getStatusColor(item.status) }]}
                    >
                      <View style={styles.serviceCallCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.serviceCallTitle}>{item.title}</Text>
                          <Text style={styles.serviceCallCustomer}>{item.customer_name}</Text>
                        </View>
                        <View style={[styles.serviceCallPriorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                          <Text style={styles.serviceCallPriorityText}>{getPriorityLabel(item.priority)}</Text>
                        </View>
                      </View>

                      {item.customer_address && (
                        <Text style={styles.serviceCallAddress} numberOfLines={1}>📍 {item.customer_address}</Text>
                      )}

                      {item.scheduled_date && (
                        <Text style={styles.serviceCallScheduled}>
                          📅 {new Date(item.scheduled_date).toLocaleDateString()}
                        </Text>
                      )}

                      <View style={styles.serviceCallCardFooter}>
                        <View style={[styles.serviceCallStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                          <Text style={styles.serviceCallStatusText}>{getStatusLabel(item.status)}</Text>
                        </View>
                        {item.customer_phone && (
                          <Pressable
                            onPress={() => handleCallCustomer(item.customer_phone)}
                            style={styles.serviceCallCallButton}
                          >
                            <Text style={styles.serviceCallCallButtonText}>📞 Call</Text>
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  </Swipeable>
                )}
              />
            )}
          </View>
        )
      ) : activeTab === 'employees' ? (
        // EMPLOYEES TAB
        loadingEmployees ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6D5DE7" />
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>👷</Text>
            <Text style={styles.emptyTitle}>No employees yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first team member to get started
            </Text>
            <Pressable onPress={() => setShowAddEmployeeModal(true)} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>+ Add Employee</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Employee Stats */}
            <View style={styles.summaryRow}>
              <View style={[styles.card, styles.employeeStatCard]}>
                <Text style={styles.cardNum}>{employeesCount}</Text>
                <Text style={styles.cardLabel}>Total Employees</Text>
              </View>
              <View style={[styles.card, styles.employeeStatCard]}>
                <Text style={styles.cardNum}>{filteredEmployees.length}</Text>
                <Text style={styles.cardLabel}>
                  {searchQuery ? 'Search Results' : 'Active'}
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search employees..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>
                {searchQuery 
                  ? `Results (${filteredEmployees.length})` 
                  : 'All Employees'
                }
              </Text>
              <Pressable onPress={() => setShowAddEmployeeModal(true)} style={styles.newProjectBtn}>
                <Text style={styles.newProjectBtnText}>+ Add</Text>
              </Pressable>
            </View>

            {filteredEmployees.length === 0 ? (
              <View style={styles.emptySearchWrap}>
                <Text style={styles.emptySearchText}>
                  No employees found for "{searchQuery}"
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredEmployees}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <Swipeable
                    renderLeftActions={() => renderEmployeeLeftActions(item.id, item.full_name)}
                    overshootLeft={false}
                  >
                    <Pressable style={styles.employeeCard}>
                      <View style={styles.employeeAvatar}>
                        <Text style={styles.employeeAvatarText}>
                          {item.full_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{item.full_name}</Text>
                        <Text style={styles.employeeEmail}>{item.email}</Text>
                        <Text style={styles.employeeDate}>
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </Pressable>
                  </Swipeable>
                )}
              />
            )}
          </View>
        )
      ) : null}

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <Pressable
          onPress={() => {
            setActiveTab('projects');
            setSearchQuery('');
          }}
          style={[styles.tabButton, activeTab === 'projects' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabIcon, activeTab === 'projects' && styles.tabIconActive]}>📁</Text>
          <Text style={[styles.tabLabel, activeTab === 'projects' && styles.tabLabelActive]}>Projects</Text>
        </Pressable>
        
        <Pressable
          onPress={() => {
            setActiveTab('service-calls');
            setSearchQuery('');
          }}
          style={[styles.tabButton, activeTab === 'service-calls' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabIcon, activeTab === 'service-calls' && styles.tabIconActive]}>📞</Text>
          <Text style={[styles.tabLabel, activeTab === 'service-calls' && styles.tabLabelActive]}>Service Calls</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setActiveTab('employees');
            setSearchQuery('');
          }}
          style={[styles.tabButton, activeTab === 'employees' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabIcon, activeTab === 'employees' && styles.tabIconActive]}>👷</Text>
          <Text style={[styles.tabLabel, activeTab === 'employees' && styles.tabLabelActive]}>Employees</Text>
        </Pressable>
      </View>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        visible={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onSuccess={() => {
          setShowAddEmployeeModal(false);
          fetchEmployees();
        }}
      />
    </SafeAreaView>
  );
}