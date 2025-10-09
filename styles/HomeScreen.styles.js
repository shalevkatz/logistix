// styles/HomeScreen.styles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  eyebrow: { fontSize: 12, opacity: 0.6 },
  title: { fontSize: 22, fontWeight: '700' },
  signOutBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#eee' },
  signOutText: { fontWeight: '600' },

  // error box
  errorBox: { padding: 16, borderRadius: 12, backgroundColor: '#fff3f2' },
  errorText: { color: '#b42318' },

  // empty state
emptyWrap: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',   // 👈 centers vertically
  paddingHorizontal: 24,
},
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { textAlign: 'center', marginTop: 6, opacity: 0.7 },

  // projects summary
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16, backgroundColor: '#f5f5f7' },
  cardNum: { fontSize: 26, fontWeight: '800' },
  cardLabel: { marginTop: 4, opacity: 0.7 },

  // list header
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  sectionTitle: { fontWeight: '700', fontSize: 16 },
  link: { fontWeight: '700', opacity: 0.9 },

  // project card
  projectCard: { padding: 16, backgroundColor: '#f7f7ff', borderRadius: 16 },
  projectName: { fontSize: 16, fontWeight: '700' },
  projectDesc: { marginTop: 6 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeActive: { backgroundColor: '#E8EEFF' },
  badgeMuted: { backgroundColor: '#EEE' },

  // buttons
  primaryBtn: { backgroundColor: '#6D5DE7', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: '700' },

bigAddCircle: {
  marginTop: 32,
  width: 100,
  height: 100,
  borderRadius: 50,            // circle
  backgroundColor: '#6D5DE7',  // purple
  alignItems: 'center',
  justifyContent: 'center',
},

bigAddText: {
  color: 'white',
  fontSize: 48,   // smaller than before
  fontWeight: '800',
},


// Search styles
searchContainer: {
  paddingHorizontal: 0,
  paddingVertical: 12,
  backgroundColor: 'transparent',
},
searchInput: {
  backgroundColor: '#f5f5f7',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  borderWidth: 0,
},

// Empty search result styles
emptySearchWrap: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 40,
  paddingTop: 60,
},
emptySearchText: {
  fontSize: 16,
  color: '#666',
  textAlign: 'center',
},

// Delete button styles
deleteButton: {
  backgroundColor: '#ff3b30',
  justifyContent: 'center',
  alignItems: 'center',
  width: 80,
  borderRadius: 16,
  marginLeft: 8,
},
deleteButtonText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 14,
},

});
