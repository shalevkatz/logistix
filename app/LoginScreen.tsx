import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { supabase } from '../lib/supabase';
import { COLORS, styles as s } from '../styles/LoginScreen.styles';

export default function LoginScreen() {
  const [username, setUsername] = useState('');      
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const navigation = useNavigation();

  const handleSignIn = async () => {
    if (!username || !password) {
      setErrorMsg('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username.trim(),  
        password,
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Email or password is incorrect.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }
      // הצלחה → נווט למסך הראשי שלך
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    } catch {
      setErrorMsg('Something went wrong. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <Image source={require('../assets/images/Vector_1.png')} style={s.waveTop} resizeMode="cover" />
      <Image source={require('../assets/images/Vector_2.png')} style={s.waveBottom} resizeMode="contain" />
      <SafeAreaView edges={['top']} style={s.safe}>
        <View style={s.content}>
          {/* Title */}
          <View style={s.titleGroup}>
            <Text style={s.loginTitle}>Hello</Text>
            <Text style={s.loginSub}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={s.formGroup}>
            <View style={s.inputWrapper}>
              <Ionicons name="person-outline" size={22} color={COLORS.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.textInput}
                placeholder="Email"
                placeholderTextColor={COLORS.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={s.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.textMuted} style={s.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={s.textInput}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10} accessibilityRole="button">
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </Pressable>
            </View>

            {/* Error message (אם יש) */}
            {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}

            {/* Forgot */}
            <Pressable style={s.forgotWrap} onPress={() => { /* navigation.navigate('ForgotPassword') */ }}>
              <Text style={s.forgotLink}>Forgot your password?</Text>
            </Pressable>
          </View>

          {/* CTA */}
          <View style={s.ctaRow}>
            <Text style={s.ctaText}>Sign in</Text>
            <Pressable
              onPress={handleSignIn}
              disabled={loading || !username || !password}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <LinearGradient
                colors={['#F5C450', '#EA4CB3', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.ctaButton, (loading || !username || !password) && { opacity: 0.6 }]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="arrow-forward" size={22} color="#fff" />}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={s.createAccountRow}>
            <Text style={s.createText}>Don't have an account? </Text>
            <Pressable onPress={() => { /* navigation.navigate('SignUp') */ }}>
              <Text style={s.createButton}>Create</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
