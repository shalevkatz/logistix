import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { COLORS, styles } from "../styles/HomeScreen.styles";

export default function HomeScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        setEmail(user?.email ?? null);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/LoginScreen"); // back to auth
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome{email ? `, ${email}` : ""} 👋</Text>
      <Text style={styles.subtitle}>This is your Home screen.</Text>

      {/* Example primary action */}
      <Pressable style={styles.primaryBtn} onPress={() => { /* TODO: navigate to your app section */ }}>
        <Text style={styles.primaryBtnText}>Go to Projects</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </Pressable>

      {/* Sign out */}
      <Pressable style={styles.secondaryBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.purple} />
        <Text style={styles.secondaryBtnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}
