import { StyleSheet } from "react-native";

export const COLORS = {
  purple: "#7c3aed",
  purpleDim: "#bfa7ff",
  text: "#1f1f1f",
  subtext: "#6b6b6b",
  white: "#fff",
  border: "#e5e5e5",
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 24, paddingTop: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Text
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  subtitle: { marginTop: 6, color: COLORS.subtext },

  // Buttons
  primaryBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.purple,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 16, marginRight: 6 },

  secondaryBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { color: COLORS.purple, fontWeight: "700", fontSize: 15, marginLeft: 6 },
});
