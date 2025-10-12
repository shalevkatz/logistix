import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type AddEmployeeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddEmployeeModal({ visible, onClose, onSuccess }: AddEmployeeModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Generate a simple temporary password
  const generatePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `Welcome${randomNum}`;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmployee = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Missing Information', 'Please enter employee name');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      // Get current manager's ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('You must be logged in to add employees');
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        Alert.alert('Email Exists', 'An employee with this email already exists');
        setLoading(false);
        return;
      }

      // Generate temporary password
      const tempPassword = generatePassword();
      setGeneratedPassword(tempPassword);

      // Create the auth user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: tempPassword,
        options: {
          data: {
            full_name: fullName,
            role: 'employee',
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // INSERT the profile (not update!) with manager_id
      // Try with phone first, if it fails, try without phone
      let profileError;
      
      // Try inserting with phone
      const profileData: any = {
        id: authData.user.id,
        full_name: fullName,
        email: email.toLowerCase(),
        role: 'employee',
        manager_id: currentUser.id, // Link to current manager
        created_at: new Date().toISOString(),
      };

      // Only add phone if it exists and is not empty
      if (phone && phone.trim()) {
        profileData.phone = phone;
      }

      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      profileError = error;

      // If phone column doesn't exist, try again without it
      if (profileError && profileError.message.includes('phone')) {
        console.log('Phone column does not exist, inserting without it');
        delete profileData.phone;
        
        const { error: retryError } = await supabase
          .from('profiles')
          .insert(profileData);
        
        profileError = retryError;
      }

      if (profileError) {
        console.error('Profile insert error:', profileError);
        throw new Error('Failed to create employee profile: ' + profileError.message);
      }

      // Show success with credentials
      setShowCredentials(true);
      setLoading(false);

    } catch (error: any) {
      console.error('Error adding employee:', error);
      Alert.alert('Error', error.message || 'Failed to add employee');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (showCredentials) {
      onSuccess(); // Refresh the employee list
    }
    
    // Reset form
    setFullName('');
    setEmail('');
    setPhone('');
    setGeneratedPassword('');
    setShowCredentials(false);
    onClose();
  };

  if (showCredentials) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              
              <Text style={styles.successTitle}>Employee Added!</Text>
              <Text style={styles.successSubtitle}>
                Share these credentials with {fullName}
              </Text>

              <View style={styles.credentialsBox}>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialLabel}>Email:</Text>
                  <Text style={styles.credentialValue}>{email}</Text>
                </View>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialLabel}>Password:</Text>
                  <Text style={styles.credentialValue}>{generatedPassword}</Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Make sure to share these credentials with the employee. 
                  They will be asked to change their password on first login.
                </Text>
              </View>

              <Pressable style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Employee</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="john.smith@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 234 567 8900"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 A temporary password will be automatically generated. 
                You'll need to share it with the employee after creation.
              </Text>
            </View>

            <Pressable
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={handleAddEmployee}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.addButtonText}>Create Employee Account</Text>
              )}
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  // Success screen styles
  successContainer: {
    padding: 30,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 40,
    color: '#10B981',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  credentialsBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  credentialValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});