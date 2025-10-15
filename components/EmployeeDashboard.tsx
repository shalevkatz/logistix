import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  title: string;
  client_name: string | null;
  location: string | null;
  priority: 'Low' | 'Medium' | 'High';
  start_date: string | null;
  due_date: string | null;
  description: string | null;
  completed: boolean | null;
};

type ServiceCall = {
  id: string;
  title: string;
  customer_name: string;
  customer_address: string | null;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string | null;
};

export default function EmployeeDashboard() {
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'service-calls'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [serviceCallFilter, setServiceCallFilter] = useState<'active' | 'completed'>('active');
  const [projectFilter, setProjectFilter] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/LoginScreen');
        return;
      }

      console.log('🔍 LOGGED IN USER ID:', user.id);
      setUserId(user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserName(profile.full_name);

      // Load all data
      await Promise.all([
        loadProjects(user.id),
        loadServiceCalls(user.id),
      ]);
    } catch (error: any) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (empId: string) => {
    try {
      console.log('🔍 Loading projects for employee ID:', empId);
      console.log('   Employee ID type:', typeof empId);
      console.log('   Employee ID length:', empId.length);

      // Try multiple query approaches
      let data = null;
      let error = null;

      // First, let's see ALL projects to debug
      const allProjectsResult = await supabase
        .from('projects')
        .select('id, title, assigned_employee_ids');

      console.log('📦 ALL PROJECTS IN DATABASE:', allProjectsResult.data);
      console.log('📦 PROJECT QUERY ERROR:', allProjectsResult.error);

      // Check if there's an RLS issue
      if (allProjectsResult.error) {
        console.log('⚠️ POSSIBLE RLS ISSUE - Error details:', allProjectsResult.error);
      }

      // Try to count projects
      const countResult = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      console.log('📊 Total projects count:', countResult.count);
      console.log('📊 Count error:', countResult.error);

      // Approach 1: Using @> operator (recommended for PostgreSQL arrays)
      const result1 = await supabase
        .from('projects')
        .select('id, title, client_name, location, priority, start_date, due_date, description, completed, assigned_employee_ids')
        .not('assigned_employee_ids', 'is', null);

      console.log('📦 All projects with assignments (not null):', result1.data);

      if (result1.data) {
        // Filter in JavaScript to check if empId is in the array
        data = result1.data.filter(project => {
          console.log('🔎 Checking project:', project.title);
          console.log('   assigned_employee_ids:', project.assigned_employee_ids);
          console.log('   Type of array:', typeof project.assigned_employee_ids, Array.isArray(project.assigned_employee_ids));

          if (!project.assigned_employee_ids) {
            console.log('   ❌ No assigned_employee_ids');
            return false;
          }

          // Check each ID in the array
          project.assigned_employee_ids.forEach((id: string, index: number) => {
            console.log(`   [${index}] ID: "${id}" (type: ${typeof id}, length: ${id.length})`);
            console.log(`   [${index}] Matches empId? ${id === empId}`);
            console.log(`   [${index}] ID trimmed: "${id.trim()}" matches? ${id.trim() === empId}`);
          });

          const isMatch = project.assigned_employee_ids.includes(empId);
          console.log('   ✅ Final match result:', isMatch);

          return isMatch;
        });

        console.log('✅ Filtered projects for employee:', data);
      }

      error = result1.error;

      if (error) {
        console.log('❌ Error loading projects:', error.message);
        setProjects([]);
      } else {
        console.log(`📊 Setting ${data?.length || 0} projects to state`);
        setProjects(data || []);
      }
    } catch (error: any) {
      console.log('💥 Project loading error:', error);
      setProjects([]);
    }
  };

  const loadServiceCalls = async (empId: string) => {
    try {
      console.log('🔍 Loading service calls for employee ID:', empId);
      
      // Get all service calls with assignments
      const { data: allCalls, error } = await supabase
        .from('service_calls')
        .select('id, title, customer_name, customer_address, status, priority, scheduled_date, assigned_employee_ids')
        .not('assigned_employee_ids', 'is', null);

      console.log('📦 All service calls with assignments:', allCalls);

      if (error) {
        console.log('❌ Error loading service calls:', error.message);
        setServiceCalls([]);
        return;
      }

      if (!allCalls || allCalls.length === 0) {
        console.log('⚠️ No service calls found with assignments');
        setServiceCalls([]);
        return;
      }

      // Filter service calls where employee ID is in the array
      const filteredCalls = allCalls.filter(call => {
        console.log('🔎 Checking service call:', call.title);
        console.log('   assigned_employee_ids:', call.assigned_employee_ids);
        console.log('   Looking for empId:', empId);
        
        if (!call.assigned_employee_ids) {
          console.log('   ❌ No assigned_employee_ids');
          return false;
        }
        
        const isMatch = call.assigned_employee_ids.includes(empId);
        console.log('   Match?', isMatch);
        
        return isMatch;
      });

      console.log('✅ Filtered service calls for employee:', filteredCalls);
      setServiceCalls(filteredCalls);

    } catch (error: any) {
      console.log('💥 Service call loading error:', error);
      setServiceCalls([]);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/LoginScreen');
  };

  // Filter projects by completion status
  const activeProjects = projects.filter(project => !project.completed);
  const completedProjects = projects.filter(project => project.completed === true);

  // Then apply search filter based on which list we're viewing
  const filteredProjects = (projectFilter === 'active' ? activeProjects : completedProjects).filter(project =>
    !searchQuery ||
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // Filter service calls by status
  const activeServiceCalls = serviceCalls.filter(call => call.status !== 'completed');
  const completedServiceCalls = serviceCalls.filter(call => call.status === 'completed');

  // Then apply search filter based on which list we're viewing
  const filteredServiceCalls = (serviceCallFilter === 'active' ? activeServiceCalls : completedServiceCalls).filter(call =>
    !searchQuery ||
    call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('employee.welcomeBack')}</Text>
          <Text style={styles.userName}>{userName || t('employee.employee')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowLanguageModal(true)} style={styles.langBtn}>
            <Text style={styles.langBtnText}>🌐</Text>
          </Pressable>
          <Pressable onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => {
            setActiveTab('projects');
            setSearchQuery('');
          }}
          style={[styles.tab, activeTab === 'projects' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.tabTextActive]}>
            {t('employee.projects')} ({projectFilter === 'active' ? activeProjects.length : completedProjects.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('service-calls');
            setSearchQuery('');
          }}
          style={[styles.tab, activeTab === 'service-calls' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'service-calls' && styles.tabTextActive]}>
            {t('employee.serviceCalls')} ({serviceCallFilter === 'active' ? activeServiceCalls.length : completedServiceCalls.length})
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'projects' ? t('employee.searchProjects') : t('employee.searchServiceCalls')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards - Projects */}
      {activeTab === 'projects' && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.statNumber}>{activeProjects.length}</Text>
            <Text style={styles.statLabel}>{t('home.activeProjects')}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
            <Text style={styles.statNumber}>{completedProjects.length}</Text>
            <Text style={styles.statLabel}>{t('home.completedProjects')}</Text>
          </View>
        </View>
      )}

      {/* Stats Cards - Service Calls */}
      {activeTab === 'service-calls' && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.statNumber}>{activeServiceCalls.length}</Text>
            <Text style={styles.statLabel}>{t('home.activeCalls')}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#059669' }]}>
            <Text style={styles.statNumber}>{completedServiceCalls.length}</Text>
            <Text style={styles.statLabel}>{t('home.completed')}</Text>
          </View>
        </View>
      )}

      {/* Project Filter (Active/Completed) */}
      {activeTab === 'projects' && (
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => {
              setProjectFilter('active');
              setSearchQuery(''); // Clear search when switching filters
            }}
            style={[styles.filterButton, projectFilter === 'active' && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, projectFilter === 'active' && styles.filterTextActive]}>
              {t('home.active')} ({activeProjects.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setProjectFilter('completed');
              setSearchQuery(''); // Clear search when switching filters
            }}
            style={[styles.filterButton, projectFilter === 'completed' && styles.filterButtonCompletedActive]}
          >
            <Text style={[styles.filterText, projectFilter === 'completed' && styles.filterTextCompletedActive]}>
              {t('home.completed')} ({completedProjects.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Service Call Filter (Active/Completed) */}
      {activeTab === 'service-calls' && (
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => {
              setServiceCallFilter('active');
              setSearchQuery(''); // Clear search when switching filters
            }}
            style={[styles.filterButton, serviceCallFilter === 'active' && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, serviceCallFilter === 'active' && styles.filterTextActive]}>
              {t('home.active')} ({activeServiceCalls.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setServiceCallFilter('completed');
              setSearchQuery(''); // Clear search when switching filters
            }}
            style={[styles.filterButton, serviceCallFilter === 'completed' && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, serviceCallFilter === 'completed' && styles.filterTextActive]}>
              {t('home.completed')} ({completedServiceCalls.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.contentList}>
        {activeTab === 'projects' && (
          filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? t('employee.noProjectsFound') : t('employee.noProjectsAssigned')}
              </Text>
            </View>
          ) : (
            filteredProjects.map(project => (
              <Pressable
                key={project.id}
                style={[
                  styles.projectCard,
                  project.completed && styles.projectCardCompleted
                ]}
                onPress={() => router.push(`/projects/${project.id}/planner` as any)}
              >
                {/* Completed checkmark badge */}
                {project.completed && (
                  <View style={styles.completedCheckmark}>
                    <Text style={styles.completedCheckmarkText}>✓</Text>
                  </View>
                )}

                <View style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      project.priority === 'High' ? '#FEE2E2' :
                      project.priority === 'Medium' ? '#FEF3C7' : '#D1FAE5'
                  }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    {
                      color:
                        project.priority === 'High' ? '#DC2626' :
                        project.priority === 'Medium' ? '#D97706' : '#059669'
                    }
                  ]}>
                    {project.priority}
                  </Text>
                </View>

                <Text style={[
                  styles.projectTitle,
                  project.completed && styles.projectTitleCompleted
                ]}>
                  {project.title}
                </Text>

                {project.client_name && (
                  <Text style={[
                    styles.projectDetail,
                    project.completed && styles.textMuted
                  ]}>
                    👤 {project.client_name}
                  </Text>
                )}

                {project.location && (
                  <Text style={[
                    styles.projectDetail,
                    project.completed && styles.textMuted
                  ]}>
                    📍 {project.location}
                  </Text>
                )}

                {project.start_date && (
                  <Text style={[
                    styles.projectDetail,
                    project.completed && styles.textMuted
                  ]}>
                    📅 Start: {new Date(project.start_date).toLocaleDateString()}
                  </Text>
                )}

                {project.due_date && (
                  <Text style={[
                    styles.projectDue,
                    project.completed && styles.textMuted
                  ]}>
                    🎯 Due: {new Date(project.due_date).toLocaleDateString()}
                  </Text>
                )}

                {project.description && (
                  <Text style={[
                    styles.projectDescription,
                    project.completed && styles.textMuted
                  ]} numberOfLines={2}>
                    {project.description}
                  </Text>
                )}
              </Pressable>
            ))
          )
        )}

        {activeTab === 'service-calls' && (
          filteredServiceCalls.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? t('employee.noServiceCallsFound') : t('employee.noServiceCallsAssigned')}
              </Text>
            </View>
          ) : (
            filteredServiceCalls.map(call => (
              <Pressable
                key={call.id}
                style={[
                  styles.serviceCallCard,
                  call.status === 'completed' && styles.serviceCallCardCompleted
                ]}
                onPress={() => router.push(`/service-calls/${call.id}` as any)}
              >
                {/* Completed checkmark badge */}
                {call.status === 'completed' && (
                  <View style={styles.completedCheckmark}>
                    <Text style={styles.completedCheckmarkText}>✓</Text>
                  </View>
                )}

                <View style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      call.priority === 'urgent' ? '#FEE2E2' :
                      call.priority === 'high' ? '#FEF3C7' :
                      call.priority === 'medium' ? '#DBEAFE' : '#D1FAE5'
                  }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    {
                      color:
                        call.priority === 'urgent' ? '#DC2626' :
                        call.priority === 'high' ? '#D97706' :
                        call.priority === 'medium' ? '#2563EB' : '#059669'
                    }
                  ]}>
                    {call.priority.toUpperCase()}
                  </Text>
                </View>

                <Text style={[
                  styles.serviceCallTitle,
                  call.status === 'completed' && styles.serviceCallTitleCompleted
                ]}>
                  {call.title}
                </Text>
                <Text style={[
                  styles.serviceCallCustomer,
                  call.status === 'completed' && styles.textMuted
                ]}>
                  👤 {call.customer_name}
                </Text>

                {call.customer_address && (
                  <Text style={[
                    styles.serviceCallDetail,
                    call.status === 'completed' && styles.textMuted
                  ]}>
                    📍 {call.customer_address}
                  </Text>
                )}

                {call.scheduled_date && (
                  <Text style={[
                    styles.serviceCallScheduled,
                    call.status === 'completed' && styles.textMuted
                  ]}>
                    📅 Scheduled: {new Date(call.scheduled_date).toLocaleDateString()}
                  </Text>
                )}

                <View style={[
                  styles.serviceStatusBadge,
                  {
                    backgroundColor:
                      call.status === 'completed' ? '#10B981' :
                      call.status === 'in_progress' ? '#F59E0B' : '#6B7280'
                  }
                ]}>
                  <Text style={styles.statusText}>
                    {call.status === 'in_progress' ? 'In Progress' :
                     call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </Text>
                </View>
              </Pressable>
            ))
          )
        )}
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6D5DE7',
  },
  langBtnText: {
    fontSize: 20,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  taskProject: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  taskFloor: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  taskDue: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  projectCardCompleted: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  projectTitleCompleted: {
    color: '#6B7280',
  },
  projectDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  projectDue: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 4,
  },
  projectDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  serviceCallCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  serviceCallCardCompleted: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  completedCheckmark: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckmarkText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  serviceCallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  serviceCallTitleCompleted: {
    color: '#6B7280',
  },
  textMuted: {
    color: '#9CA3AF',
  },
  serviceCallCustomer: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  serviceCallDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  serviceCallScheduled: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 4,
  },
  serviceStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterButtonCompletedActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFF',
  },
  filterTextCompletedActive: {
    color: '#FFF',
  },
});