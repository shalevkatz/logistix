import { Image, Text, View } from "react-native";
import { styles } from "../styles/auth.styles";


export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topImageContainer}>
        <Image source={require('../assets/images/Vector_1.png')} style={styles.topImage} />
      </View>

      <View style={styles.containerTitle}>
        <Text style={styles.loginTitle}>Hello</Text>
      </View>

      <View style={styles.bottomContainer}>
        <Image source={require('../assets/images/Vector_2.png')} style={styles.bottomImage} />
      </View>
    </View>
  );
}


