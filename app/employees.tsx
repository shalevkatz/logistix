// app/employees.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { supabase } from '../lib/supabase';

type Employee = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export default function EmployeeListScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Get current user
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Load employees
  const loadEmployees = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('role', 'employee')
        .eq('manager_id', userId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      
      // Add placeholder email for now
      const employeesWithEmail = (data || []).map(emp => ({
        ...emp,
        email: `${emp.full_name.toLowerCase().replace(/\s+/g, '.')}@company.com`
      }));
      
      setEmployees(employeesWithEmail);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadEmployees();
      }
    }, [userId, loadEmployees])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
  };

  // Delete employee
  const deleteEmployee = async (employeeId: string, employeeName: string) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to remove "${employeeName}"? This will also remove them from all projects and tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: This deletes the profile but NOT the auth user
              // You might want to handle auth user deletion separately
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', employeeId);

              if (error) throw error;

              setEmployees(prev => prev.filter(e => e.id !== employeeId));
              Alert.alert('Success', 'Employee removed');
            } catch (error: any) {
              console.error('Error deleting employee:', error);
              Alert.alert('Error', 'Failed to delete employee');
            }
          },
        },
      ]
    );
  };

  // Render delete action
  const renderLeftActions = (employeeId: string, employeeName: string) => {
    return (
      <Pressable
        style={styles.deleteButton}
        onPress={() => deleteEmployee(employeeId, employeeName)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    );
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/LoginScreen');
  };

  if (loading && !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6D5DE7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Team Management</Text>
          <Text style={styles.title}>Employees</Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{employees.length}</Text>
          <Text style={styles.statLabel}>Total Employees</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredEmployees.length}</Text>
          <Text style={styles.statLabel}>
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
        />
      </View>

      {/* Header Row */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Results (${filteredEmployees.length})`
            : 'All Employees'}
        </Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      {/* Employee List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#6D5DE7" />
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👷</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No employees found' : 'No employees yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first team member to get started'}
          </Text>
          {!searchQuery && (
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>+ Add Employee</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Swipeable
              renderLeftActions={() => renderLeftActions(item.id, item.full_name)}
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

      {/* Add Employee Modal */}
      <AddEmployeeModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadEmployees();
        }}
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <Pressable
          onPress={() => router.push('/HomeScreen')}
          style={styles.tabButton}
        >
          <Text style={styles.tabIcon}>📁</Text>
          <Text style={styles.tabLabel}>Projects</Text>
        </Pressable>
        
        <Pressable
          onPress={() => router.push('/HomeScreen')}
          style={styles.tabButton}
        >
          <Text style={styles.tabIcon}>📞</Text>
          <Text style={styles.tabLabel}>Service Calls</Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, styles.tabButtonActive]}
        >
          <Text style={[styles.tabIcon, styles.tabIconActive]}>👷</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Employees</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eyebrow: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  signOutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6D5DE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  employeeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6D5DE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  employeeDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginRight: 12,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    // Active tab styling
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#6D5DE7',
    fontWeight: '600',
  },
});