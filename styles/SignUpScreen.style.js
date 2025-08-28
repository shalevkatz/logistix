import { StyleSheet } from "react-native";

export const SPACING = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 };

export const COLORS = {
  bg: '#FFFFFF',
  text: '#111111',
  textMuted: '#6B7280',
  primary: '#7300FF',
  placeholder: '#f90000ff',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
};


export const styles = StyleSheet.create({
    root: {backgroundColor: COLORS.bg,flex: 1},
    safe: {flex: 1},
    content: {flex: 1,paddingHorizontal: 24,zIndex: 1,top: '20%'},
    
    // Waves
    waveTop:  { position: 'absolute', zIndex: 0, top: 0, left: '-95%', width: '155%', height: 160 },
    waveBottom:{ position: 'absolute', zIndex: 0, bottom: '-2%', left: '-62%', right: 0, width: '150%', height: undefined, aspectRatio: 1000/520 },

    // Title
    titleGroup: { alignItems: 'center', gap: SPACING.xs },
    title: { fontSize: 30, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md, letterSpacing: 0.2},

    // Form
formGroup: { marginTop: SPACING.lg },
inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.inputBg,
  borderRadius: 12,
  paddingHorizontal: 12,
  height: 48,
},

iconLeft: { marginRight: 8, opacity: 0.85 },

inputFlex: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 0,   // keep height tight inside the row
},

iconRight: {
  marginLeft: 8,
  padding: 6,           // nice hit area for the eye button
},

//Footer
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  linkText: { fontWeight: '700', color: COLORS.primary },
  linkTextMuted: { color: COLORS.textMuted },
  flex: { flex: 1 },
  eye: { paddingHorizontal: 10, height: 48, justifyContent: 'center' },

  error: { color: COLORS.error, textAlign: 'center', marginBottom: 4 },


  //CTA
  ctaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
},
ctaText: {
  fontSize: 20,
  fontWeight: '700',
},
ctaButton: {
  width: 52,
  height: 52,
  borderRadius: 26,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
},

});