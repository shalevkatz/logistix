import { Platform, StyleSheet } from 'react-native';

export const SPACING = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 };

export const COLORS = {
  bg: '#FFFFFF',
  text: '#111111',
  textMuted: '#6B7280',
  primary: '#7300FF',
  placeholder: '#B0B0B0',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
};

export const styles = StyleSheet.create({
  // שכבות בסיס
  root: { flex: 1, backgroundColor: COLORS.bg, position: 'relative' },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: SPACING.lg, zIndex: 1, top: '20%' },

  // גלים (מאחורה)
  waveTop:  { position: 'absolute', zIndex: 0, top: 0, left: '-10%', width: '120%', height: 180 },
  waveBottom:{ position: 'absolute', zIndex: 0, bottom: 0, left: '-42%', right: 0, width: '100%', height: undefined, aspectRatio: 1000/520 },

  // כותרות
  titleGroup: { alignItems: 'center', marginTop: SPACING.lg, gap: SPACING.xs },
  loginTitle: { fontSize: 60, lineHeight: 66, fontWeight: '700', color: '#4C3E5D', textAlign: 'center' },
  loginSub:   { fontSize: 18, lineHeight: 22, fontWeight: '400', color: '#4C3E5D', textAlign: 'center' },

  // טופס
  formGroup: { marginTop: SPACING.lg, gap: SPACING.md },
  inputWrapper: {
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
    }),
  },
  inputIcon: { marginRight: SPACING.sm },
  textInput: { flex: 1, fontSize: 16, color: COLORS.text, paddingVertical: 0 },

  // Forgot
  forgotWrap: { alignSelf: 'flex-end', paddingHorizontal: 4 },
  forgotLink: { color: '#9E9E9E', fontSize: 14 },

  // CTA
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACING.md, marginTop: 40 },
  ctaText: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  ctaButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  // Footer
  createAccountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl },
  createText: { fontSize: 14, color: COLORS.text },
  createButton: { fontSize: 14, color: COLORS.primary, textDecorationLine: 'underline', fontWeight: '600' },
});
