import { StyleSheet } from "react-native";

export const COLORS = {
  purple: "#7c3aed",
  purpleDim: "#bfa7ff",
  placeholder: "#9b9b9b",
  text: "#1f1f1f",
  subtext: "#6b6b6b",
  border: "#d9d9d9",
  bgInput: "#fafafa",
  white: "#fff",
  error: "#ef4444",
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  header: { paddingTop: 60, paddingHorizontal: 24 },

  // TextStyle
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text },

  // TextStyle
  subtitle: { marginTop: 6, color: COLORS.subtext },

  form: { paddingHorizontal: 24, marginTop: 28 },

  // ViewStyle
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 54,
    backgroundColor: COLORS.bgInput,
  },

  // TextStyle (TextInput)
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORS.text },

  // TextStyle
  errorText: { color: COLORS.error, marginTop: 10, fontSize: 13 },

  // ViewStyle
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  // TextStyle
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: 16, marginRight: 6 },

  // ViewStyle
  backRow: { alignSelf: "center", padding: 8, marginTop: 12 },

  // TextStyle
  backText: { color: COLORS.purple, fontWeight: "600" },

  // Spacer + Footer
  footerSpacer: { flex: 1 },
  footer: { padding: 24 },

  // TextStyle
  footerTip: { textAlign: "center", color: COLORS.placeholder, fontSize: 12 },
});
