import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { COLORS, styles } from "../styles/LoginScreen.styles";


export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);


  return (
    <View style={styles.container}>
      <View style={styles.topImageContainer}>
        <Image source={require('../assets/images/Vector_1.png')} style={styles.topImage} />
      </View>


    <View style={styles.titleGroup}>
      <Text style={styles.loginTitle}>Hello</Text>
      <Text style={styles.loginSub}>Sign in to your account</Text>
    </View>


    <View style={styles.formContainer}>
      {/*Username*/}
      <View style={styles.formBox}>
      <Ionicons name="person-outline" size={22} color={COLORS.textMuted} style={styles.inputIcon}/>
      <TextInput
          style={styles.textInput}
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
      {/** Password */}
      <View style={styles.inputWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={COLORS.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          ref={passwordRef}
          style={styles.textInput}
          placeholder="Password"
          placeholderTextColor={COLORS.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          textContentType="password"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => console.log("Submit")}
        />
        <Pressable
          onPress={() => setShowPassword((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.textMuted}
          />
        </Pressable>
      </View>
    </View>

      <View style={styles.bottomContainer}>
        <Image source={require('../assets/images/Vector_2.png')} style={styles.bottomImage} />
      </View>
    </View>
  );
}


