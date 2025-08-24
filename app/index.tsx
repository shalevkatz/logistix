import { Image, View } from "react-native";
import { styles } from "../styles/auth.styles";


export default function Index() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg" }}
       style={{width:200, height:200}} />
    </View>
  );
}
