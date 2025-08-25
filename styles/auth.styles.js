import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  title: {
    fontSize: 63,
    fontWeight: "700",
    color: "#7300ffff",
    marginBottom: 12,
  },
  topImageContainer:{
    height: 50,
  },
  topImage: {
    width: "100%",
    height: 150,
  },
  bottomContainer:{
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomImage: {
    width: 400,
    height: 150,
  },
  containerTitle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 64,
    fontWeight: "700",
    color: "#7300ffff",
    textAlign: 'center',
    letterSpacing: 1.2,
  },
});