import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles as s } from '../styles/LoginScreen.styles';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  return (
    <View style={s.root}>
      {/* waves — תמיד מאחור */}
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
            {/* Username */}
            <View style={s.inputWrapper}>
              <Ionicons name="person-outline" size={22} color={COLORS.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.textInput}
                placeholder="Username"
                placeholderTextColor={COLORS.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password */}
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
              />
              <Pressable
                onPress={() => setShowPassword(v => !v)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </Pressable>
            </View>

            {/* Forgot */}
            <Pressable style={s.forgotWrap} onPress={() => {}}>
              <Text style={s.forgotLink}>Forgot your password?</Text>
            </Pressable>
          </View>

          {/* CTA */}
          <View style={s.ctaRow}>
            <Text style={s.ctaText}>Sign in</Text>
            <Pressable onPress={() => {}} hitSlop={10} accessibilityRole="button" accessibilityLabel="Sign in">
              <LinearGradient
                colors={['#F5C450', '#EA4CB3', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.ctaButton}
              >
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={s.createAccountRow}>
            <Text style={s.createText}>Don't have an account? </Text>
            <Pressable onPress={() => {}}>
              <Text style={s.createButton}>Create</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
