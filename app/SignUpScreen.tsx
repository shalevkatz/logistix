// src/screens/SignUpScreen.tsx
import { COLORS } from '@/styles/LoginScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { styles as s } from '../styles/SignUpScreen.style';

const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
const friendlyError = (msg: string) => {
  if (/User already registered/i.test(msg)) return 'Email is already in use';
  if (/at least 6 characters/i.test(msg))  return 'Password must be at least 6 characters';
  return msg;
};

export default function SignUpScreen() {
  // state
  const [full_name, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // refs for focus flow
  const emailRef   = useRef<TextInput>(null);
  const passRef    = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // always safe with Expo Router: replace to avoid stacking
  const backToLogin = () => router.replace("/LoginScreen");

  const canCreate =
    !loading &&
    full_name.trim().length > 0 &&
    isEmail(email) &&
    password.length >= 6 &&
    confirm === password;

  const onSignup = async () => {
    // basic client checks
    if (!full_name || !email || !password || !confirm) return setError('Please fill all fields');
    if (!isEmail(email)) return setError('Invalid email');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: full_name.trim() } },
      });
      if (error) throw error;

      // If your project requires email verification, there is NO session yet
      if (!data.session) {
        Alert.alert('Verify your email', 'We sent you a verification link. Please verify, then log in.');
        router.replace("/LoginScreen"); // go back to login (single, clean nav)
        return;
      }

      // Session exists -> user is signed in
      Alert.alert('Welcome!', 'Account created.');
      router.replace("/HomeScreen");
    } catch (e: any) {
      setError(friendlyError(e?.message ?? 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={s.root}>
        {/* background waves */}
        <Image source={require('../assets/images/Vector_1.png')} style={s.waveTop} resizeMode="cover" />
        <Image source={require('../assets/images/Vector_2.png')} style={s.waveBottom} resizeMode="contain" />

        <SafeAreaView edges={['top']} style={s.safe}>
          <View style={s.content}>
            {/* Title */}
            <View style={s.titleGroup}>
              <Text style={s.title}>Create Account</Text>
            </View>

            {/* Form */}
            <View style={s.formGroup}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
                {!!error && <Text style={s.error}>{error}</Text>}

                {/* Full Name */}
                <View style={s.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.placeholder} />
                  <TextInput
                    style={s.inputFlex}
                    placeholder=" Full Name"
                    placeholderTextColor={COLORS.placeholder}
                    value={full_name}
                    onChangeText={(t) => { setFullName(t); if (error) setError(null); }}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    textContentType="name"
                    autoComplete="name"
                  />
                </View>

                {/* Email */}
                <View style={s.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={s.iconLeft} />
                  <TextInput
                    ref={emailRef}
                    style={s.inputFlex}
                    placeholder="Email"
                    placeholderTextColor={COLORS.placeholder}
                    value={email}
                    onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passRef.current?.focus()}
                  />
                </View>

                {/* Password + eye */}
                <View style={s.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={s.iconLeft} />
                  <TextInput
                    ref={passRef}
                    style={s.inputFlex}
                    placeholder="Password"
                    placeholderTextColor={COLORS.placeholder}
                    value={password}
                    onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <Pressable style={s.iconRight} onPress={() => setShowPassword(v => !v)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                  </Pressable>
                </View>

                {/* Confirm password */}
                <View style={s.inputRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textMuted} style={s.iconLeft} />
                  <TextInput
                    ref={confirmRef}
                    style={s.inputFlex}
                    placeholder="Confirm password"
                    placeholderTextColor={COLORS.placeholder}
                    value={confirm}
                    onChangeText={(t) => { setConfirm(t); if (error) setError(null); }}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="done"
                    onSubmitEditing={onSignup}
                  />
                </View>

                {/* CTA */}
                <View style={s.ctaRow}>
                  <Text style={s.ctaText}>Create</Text>

                  <Pressable
                    onPress={onSignup}
                    disabled={!canCreate}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Create account"
                  >
                    <LinearGradient
                      colors={['#F5C450', '#EA4CB3', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[s.ctaButton, !canCreate && { opacity: 0.6 }]}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Ionicons name="arrow-forward" size={22} color="#fff" />}
                    </LinearGradient>
                  </Pressable>
                </View>

                {/* Link back to Login */}
                <View style={s.linkRow}>
                  <Text style={s.linkTextMuted}>Already have an account?</Text>
                  <Pressable onPress={backToLogin}>
                    <Text style={s.linkText}> Login</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}
