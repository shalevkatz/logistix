// components/RoleBasedRouter.tsx
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';

export default function RoleBasedRouter() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'manager' | 'employee' | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/LoginScreen');
        return;
      }

      console.log('User ID:', user.id);
      console.log('User Email:', user.email);

      // Get user profile with role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profile);
      console.log('Profile error:', error);

      if (error) {
        console.error('Error fetching profile:', error);
        setUserRole('employee');
      } else {
        const role = profile?.role || 'employee';
        console.log('Setting role to:', role);
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('employee');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Render appropriate dashboard based on role
  return userRole === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />;
}

const styles = StyleSheet.create({
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
});