import { Platform, StyleSheet } from "react-native";

export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
};

export const COLORS = {
  bg: "#FFFFFF",
  text: "#111111",
  textMuted: "#6B7280",      // אפור נעים לאייקונים/טקסט משני
  primary: "#7300FF",
  placeholder: "#B0B0B0",
  inputBg: "#FFFFFF",
  inputBorder: "#E5E7EB",
};

export const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
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
    height: 120,
  },
  bottomContainer:{
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomImage: {
    width: 400,
    height: 150,
  },
  titleGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 20,
    marginTop: 20,
  },
  loginTitle: {
    fontSize: 64,
    lineHeight: 70,
    fontWeight: "700",
    color: "#4c3e5dff",
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  loginSub: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "400",
    color: "#4c3e5dff",
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  formBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  inputWrapper: {
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
    }),
  },
});




