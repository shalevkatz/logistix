import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    // initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setLoggedIn(!!session);
        setReady(true);
      }
    });

    // keep in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setLoggedIn(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={loggedIn ? "/HomeScreen" : "/LoginScreen"} />;
}
