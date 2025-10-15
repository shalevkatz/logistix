// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler'; // ensure RN Gesture Handler is initialized
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values'; // ensure crypto.getRandomValues is available
import { supabase } from '../lib/supabase';
import { LanguageProvider } from '../contexts/LanguageContext';

// Screens that do NOT require a session
const AUTH_SCREENS = new Set([
  'LoginScreen',
  'SignUpScreen',
  'ForgotPasswordScreen',
  'reset',
  'ResetPasswordConfirmScreen',
]);

function AuthGate() {
  const router = useRouter();
  const segments = useSegments(); // e.g. ['LoginScreen'] or ['HomeScreen'] or ['index']
  const current = segments[0] ?? 'index';

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // 1) Load session on mount
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setLoggedIn(!!session);
      setReady(true);
    });

    // 2) Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 3) Redirect based on session + current route
  useEffect(() => {
    if (!ready) return;

    const isAuthScreen = AUTH_SCREENS.has(current);

    if (!loggedIn && !isAuthScreen) {
      router.replace('/LoginScreen');
    } else if (loggedIn && isAuthScreen) {
      router.replace('/');
    }
  }, [ready, loggedIn, current]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Render the app's stack (headers off) once gate decisions are made
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthGate />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
