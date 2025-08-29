import { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import 'react-native-url-polyfill/auto'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'

const linking = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      LoginScreen: "login",
      ForgotPasswordScreen: "forgot",
      ResetPasswordConfirmScreen: "reset", // 👈 maps /reset → this screen
    },
  },
};


export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <View>
      <Auth />
      {session && session.user && <Text>{session.user.id}</Text>}
    </View>
  )
}