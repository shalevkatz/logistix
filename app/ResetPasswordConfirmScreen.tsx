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
import { COLORS, styles } from "../styles/ResetPasswordConfirmScreen.styles";

type AuthStackParamList = { LoginScreen: undefined; ResetPasswordConfirmScreen: undefined };

const getParams = (url?: string | null): Record<string, string> => {
  if (!url) return {};
  const out: Record<string, string> = {};
  const parts = url.split("#"); // [base, hash?]
  const query = parts[0].split("?")[1] || "";
  const hash = parts[1] || "";

  const collect = (s: string) => {
    s.split("&").forEach((kv) => {
      const [k, v] = kv.split("=");
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    });
  };

  if (query) collect(query);
  if (hash) collect(hash);
  return out;
};

export default function ResetPasswordConfirmScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [urlChecked, setUrlChecked] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineErr, setInlineErr] = useState("");

  useEffect(() => {
    const init = async () => {
      const initial = await Linking.getInitialURL();
      await handleURL(initial);
      setUrlChecked(true);
    };
    init();

    const sub = Linking.addEventListener("url", async ({ url }) => {
      await handleURL(url);
    });
    return () => sub.remove();
  }, []);

const handleURL = async (url?: string | null) => {
  const params = getParams(url ?? "");
  const demo = params["demo"]; // our URL-test flag
  const code = params["code"];
  const access_token = params["access_token"];
  const refresh_token = params["refresh_token"];

  try {
    setLoading(true);

    // ✅ URL test mode: works via URL, no Supabase call, no alert
    if (demo === "1") {
      setSessionReady(true);
      return;
    }

    // ✅ Real Supabase email flows:
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      setSessionReady(true);
      return;
    }
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      setSessionReady(true);
      return;
    }

    // No params? Came here “empty” → stay quiet, no alert
    return;
  } catch (e: any) {
    Alert.alert("Reset link error", e?.message ?? "Could not process the link.");
  } finally {
    setLoading(false);
  }
};


  const validate = () => {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (pw !== pw2) return "Passwords do not match.";
    return "";
  };

  const onSave = async () => {
    const err = validate();
    if (err) return setInlineErr(err);

    try {
      setLoading(true);
      setInlineErr("");
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      Alert.alert("Success", "Your password has been updated.");
      if (navigation.canGoBack()) navigation.popToTop();
      else navigation.replace("LoginScreen");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const disabled = !sessionReady || loading;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Set a new password</Text>
          <Text style={styles.subtitle}>
            {sessionReady ? "Enter a strong password for your account." : "Validating your reset link..."}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.purple} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={COLORS.placeholder}
              secureTextEntry={!showPw}
              value={pw}
              onChangeText={(t) => {
                setPw(t);
                setInlineErr("");
              }}
              editable={!disabled}
              returnKeyType="next"
            />
            <Pressable onPress={() => setShowPw((s) => !s)} style={styles.iconBtn}>
              <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={22} color={COLORS.purple} />
            </Pressable>
          </View>

          {/* Confirm */}
          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.purple} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={COLORS.placeholder}
              secureTextEntry={!showPw}
              value={pw2}
              onChangeText={(t) => {
                setPw2(t);
                setInlineErr("");
              }}
              editable={!disabled}
              returnKeyType="done"
              onSubmitEditing={onSave}
            />
          </View>

          {!!inlineErr && <Text style={styles.errorText}>{inlineErr}</Text>}

          <Pressable
            onPress={onSave}
            disabled={disabled}
            style={({ pressed }) => [
              styles.button,
              {
                opacity: pressed ? 0.9 : 1,
                backgroundColor: disabled ? COLORS.purpleDim : COLORS.purple,
                marginTop: 16,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.buttonText}>Save new password</Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
