import { StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b12' },
  content: { padding: 16 },
  hstack: { flexDirection: 'row' },
  col: { flex: 1 },
  mr10: { marginRight: 10 },
  mt8: { marginTop: 8 },
  mb6: { marginBottom: 6 },

  title: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  label: { color: 'white', fontSize: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#141427',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2d2d42',
  },
  help: { color: '#9aa0a6', fontSize: 12 },
  error: { color: '#ff6b6b', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#c7c9ff', fontSize: 12, marginTop: 8 },

  btnPrimary: {
    backgroundColor: '#6c4cff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d2d42',
    marginTop: 8,
  },
  btnText: { color: 'white', fontWeight: '600', fontSize: 16 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  chipIdle: { borderColor: '#2d2d42', backgroundColor: 'transparent' },
  chipActive: { borderColor: '#6c4cff', backgroundColor: '#2a235e' },
  chipText: { color: 'white', fontSize: 16 },
});
