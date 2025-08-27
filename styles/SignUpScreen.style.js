import { StyleSheet } from "react-native";

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
});
