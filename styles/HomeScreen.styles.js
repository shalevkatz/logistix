// styles/HomeScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eyebrow: {
    fontSize: 14,
    opacity: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  signOutText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Error box
  errorBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff3f2',
  },
  errorText: {
    color: '#b42318',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#6D5DE7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
  },
  emptyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bigAddCircle: {
    marginTop: 32,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6D5DE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAddText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '800',
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
  },
  cardNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  cardLabel: {
    marginTop: 4,
    opacity: 0.8,
    fontSize: 12,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6D5DE7',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },

  // Search bar
  searchContainer: {
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },

  // List header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  newProjectBtn: {
    backgroundColor: '#6D5DE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newProjectBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  // Project card
  projectCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6D5DE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectCardCompleted: {
    backgroundColor: '#f9fafb',
    borderLeftColor: '#10B981',
    opacity: 0.9,
  },
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectClient: {
    fontSize: 14,
    color: '#666',
  },
  projectLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  projectDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  projectDesc: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  projectPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectPriorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  completedDate: {
    marginTop: 8,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },

  // Empty search
  emptySearchWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // Swipe actions
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  completeButton: {
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderRadius: 16,
  },
  completeButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  // Service Call Filter Tabs
  serviceCallFilterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  serviceCallFilterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
  },
  serviceCallFilterTabActive: {
    backgroundColor: '#6D5DE7',
  },
  serviceCallFilterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  serviceCallFilterTabTextActive: {
    color: '#fff',
  },

  // Service Call Card
  serviceCallCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceCallCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  serviceCallTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceCallCustomer: {
    fontSize: 14,
    color: '#666',
  },
  serviceCallPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceCallPriorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  serviceCallAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  serviceCallScheduled: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  serviceCallCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  serviceCallStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceCallStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  serviceCallCallButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceCallCallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Bottom Tab Bar
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconActive: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabLabelActive: {
    color: '#6D5DE7',
  },

  // Employee Styles (matching employees.tsx design)
  employeeStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  employeeStatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6D5DE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeStatNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  employeeStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  employeeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6D5DE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  employeeDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  employeeDeleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
  },
  employeeDeleteButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});