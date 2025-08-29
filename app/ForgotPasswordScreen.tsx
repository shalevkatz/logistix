// src/screens/ForgotPasswordScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { COLORS, styles } from "../styles/ForgotPasswordScreen.styles";

type AuthStackParamList = {
  LoginScreen: undefined;
  ForgotPasswordScreen: undefined;
  ResetPasswordConfirmScreen: undefined;
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Log the exact redirect URL so you can copy-paste it into Supabase allowlist
    console.log("REDIRECT:", Linking.createURL("/reset"));
  }, []);

  const backToLogin = () => {
    if (navigation.canGoBack()) navigation.pop();
    else navigation.replace("LoginScreen");
  };

  const handleResetPassword = async () => {
    const value = email.trim();

    if (!value) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const redirect = Linking.createURL("/reset"); // must match your linking config
      const { error } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: redirect });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Check your email",
        "If an account exists for that address, you'll receive a reset link shortly."
      );
      backToLogin();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter the email you used to create your account.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={22} color={COLORS.purple} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError("");
              }}
              returnKeyType="send"
              onSubmitEditing={handleResetPassword}
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            onPress={handleResetPassword}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              {
                opacity: pressed ? 0.9 : 1,
                backgroundColor: loading ? COLORS.purpleDim : COLORS.purple,
                marginTop: 16,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.buttonText}>Send reset link</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          {/* Back to login (pop/replace) */}
          <Pressable onPress={backToLogin} style={styles.backRow}>
            <Text style={styles.backText}>Back to Login</Text>
          </Pressable>

          {/* --- Test button (no email needed) --- */}
          // inside ForgotPasswordScreen
<Pressable
  onPress={() => Linking.openURL(Linking.createURL("/reset?demo=1"))}
  style={styles.backRow}
>
  <Text style={styles.backText}>Test Reset Route (via URL)</Text>
</Pressable>

          {/* ------------------------------------- */}
        </View>

        <View style={styles.footerSpacer} />
        <View style={styles.footer}>
          <Text style={styles.footerTip}>
            Didn’t get the email? Check your spam folder or try another address.
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
