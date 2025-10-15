// app/service-calls.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabelKey, ServiceCallStatus, useServiceCalls } from '../hooks/useServiceCalls';
import { supabase } from '../lib/supabase';

export default function ServiceCallsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | ServiceCallStatus>('active');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUserId(session?.user?.id);
    });
    return () => { mounted = false; };
  }, []);

  const { serviceCalls, loading, error, refetch } = useServiceCalls(userId);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refetch();
      }
    }, [userId, refetch])
  );

  // Filter service calls
  const filteredServiceCalls = useMemo(() => {
    let filtered = serviceCalls;

    // Filter by status
    if (statusFilter === 'active') {
      // Show only open and cannot_complete (exclude completed)
      filtered = filtered.filter(call => call.status === 'open' || call.status === 'cannot_complete');
    } else {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        call =>
          call.title.toLowerCase().includes(query) ||
          call.customer_name.toLowerCase().includes(query) ||
          (call.description?.toLowerCase().includes(query) ?? false) ||
          (call.customer_address?.toLowerCase().includes(query) ?? false)
      );
    }

    return filtered;
  }, [serviceCalls, searchQuery, statusFilter]);

  // Count by status
  const statusCounts = useMemo(() => ({
    active: serviceCalls.filter(c => c.status === 'open' || c.status === 'cannot_complete').length,
    open: serviceCalls.filter(c => c.status === 'open').length,
    cannot_complete: serviceCalls.filter(c => c.status === 'cannot_complete').length,
    completed: serviceCalls.filter(c => c.status === 'completed').length,
  }), [serviceCalls]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCallCustomer = (phone: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Delete service call
  const deleteServiceCall = async (callId: string, callTitle: string) => {
    Alert.alert(
      t('serviceCalls.deleteTitle'),
      `${t('serviceCalls.deleteConfirm')} "${callTitle}"? ${t('serviceCalls.cannotUndo')}`,
      [
        { text: t('serviceCalls.cancel'), style: 'cancel' },
        {
          text: t('serviceCalls.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('service_calls')
                .delete()
                .eq('id', callId);

              if (error) {
                Alert.alert(t('common.error'), `${t('serviceCalls.errorDeleting')}: ${error.message}`);
              } else {
                await refetch();
              }
            } catch (err) {
              Alert.alert(t('common.error'), t('serviceCalls.errorUnexpected'));
              console.error('Delete service call error:', err);
            }
          }
        }
      ]
    );
  };

  // Mark service call as complete
  const completeServiceCall = async (callId: string, callTitle: string) => {
    Alert.alert(
      t('serviceCalls.completeTitle'),
      `${t('serviceCalls.completeConfirm')} "${callTitle}" ${t('serviceCalls.asCompleted')}`,
      [
        { text: t('serviceCalls.cancel'), style: 'cancel' },
        {
          text: t('serviceCalls.complete'),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('service_calls')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', callId);

              if (error) {
                Alert.alert(t('common.error'), `${t('serviceCalls.errorCompleting')}: ${error.message}`);
              } else {
                await refetch();
              }
            } catch (err) {
              Alert.alert(t('common.error'), t('serviceCalls.errorUnexpected'));
              console.error('Complete service call error:', err);
            }
          }
        }
      ]
    );
  };

  // Render left swipe actions (delete button)
  const renderLeftActions = (callId: string, callTitle: string) => {
    return (
      <Pressable
        style={styles.deleteSwipeButton}
        onPress={() => deleteServiceCall(callId, callTitle)}
      >
        <Text style={styles.deleteSwipeButtonText}>{t('serviceCalls.delete')}</Text>
      </Pressable>
    );
  };

  // Render right swipe actions (complete button)
  const renderRightActions = (callId: string, callTitle: string, status: ServiceCallStatus) => {
    if (status === 'completed') return null;

    return (
      <Pressable
        style={styles.completeSwipeButton}
        onPress={() => completeServiceCall(callId, callTitle)}
      >
        <Text style={styles.completeSwipeButtonText}>{t('serviceCalls.complete')}</Text>
      </Pressable>
    );
  };

  if (loading || userId === undefined) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('serviceCalls.title')}</Text>
        <Pressable onPress={() => router.push('/create-service-call')} style={styles.addButton}>
          <Text style={styles.addButtonText}>{t('serviceCalls.newCall')}</Text>
        </Pressable>
      </View>

      {/* Error / Empty / List */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{t('serviceCalls.errorLoading')}: {error}</Text>
          <Pressable onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t('serviceCalls.retry')}</Text>
          </Pressable>
        </View>
      ) : serviceCalls.length === 0 ? (
        // Empty state
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{t('serviceCalls.noCallsTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('serviceCalls.noCallsSubtitle')}
          </Text>
          <Pressable onPress={() => router.push('/create-service-call')} style={styles.bigAddCircle}>
            <Text style={styles.bigAddText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.card, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.cardNum}>{statusCounts.active}</Text>
              <Text style={styles.cardLabel}>{t('serviceCalls.activeCalls')}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.cardNum}>{statusCounts.completed}</Text>
              <Text style={styles.cardLabel}>{t('serviceCalls.completed')}</Text>
            </View>
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.filterTabs}>
            {(['active', 'open', 'cannot_complete', 'completed'] as const).map(status => (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[styles.filterTab, statusFilter === status && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, statusFilter === status && styles.filterTabTextActive]}>
                  {status === 'active' ? t('serviceCalls.active') : status === 'cannot_complete' ? t('serviceCalls.cannotComplete') : status === 'open' ? t('serviceCalls.open') : t('serviceCalls.completed')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('serviceCalls.searchPlaceholder')}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Service Calls List */}
          {filteredServiceCalls.length === 0 ? (
            <View style={styles.emptySearchWrap}>
              <Text style={styles.emptySearchText}>
                {t('serviceCalls.noResults')} "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredServiceCalls}
              keyExtractor={item => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Swipeable
                  renderLeftActions={() => renderLeftActions(item.id, item.title)}
                  renderRightActions={() => renderRightActions(item.id, item.title, item.status)}
                  overshootLeft={false}
                  overshootRight={false}
                >
                  <Pressable
                    onPress={() => router.push(`/service-calls/${item.id}` as any)}
                    style={[styles.serviceCallCard, { borderLeftColor: getStatusColor(item.status) }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceCallTitle}>{item.title}</Text>
                        <Text style={styles.customerName}>{item.customer_name}</Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                        <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
                      </View>
                    </View>

                    {item.customer_address && (
                      <Text style={styles.address} numberOfLines={1}>📍 {item.customer_address}</Text>
                    )}

                    {item.scheduled_date && (
                      <Text style={styles.scheduledDate}>
                        📅 {t('serviceCalls.scheduled')}: {new Date(item.scheduled_date).toLocaleDateString()}
                      </Text>
                    )}

                    <View style={styles.cardFooter}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{t(getStatusLabelKey(item.status))}</Text>
                      </View>
                      {item.customer_phone && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCallCustomer(item.customer_phone);
                          }}
                          style={styles.callButton}
                        >
                          <Text style={styles.callButtonText}>📞 {t('serviceCalls.call')}</Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                </Swipeable>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  addButton: { backgroundColor: '#6D5DE7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Error
  errorBox: { padding: 16, borderRadius: 12, backgroundColor: '#fff3f2' },
  errorText: { color: '#b42318', marginBottom: 12 },
  retryBtn: { backgroundColor: '#6D5DE7', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  retryBtnText: { color: 'white', fontWeight: '700' },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { textAlign: 'center', marginTop: 6, opacity: 0.7 },
  bigAddCircle: { marginTop: 32, width: 100, height: 100, borderRadius: 50, backgroundColor: '#6D5DE7', alignItems: 'center', justifyContent: 'center' },
  bigAddText: { color: 'white', fontSize: 48, fontWeight: '800' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16 },
  cardNum: { fontSize: 24, fontWeight: '800' },
  cardLabel: { marginTop: 4, opacity: 0.8, fontSize: 12 },

  // Filter tabs
  filterTabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterTab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f5f5f7', alignItems: 'center' },
  filterTabActive: { backgroundColor: '#6D5DE7' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTabTextActive: { color: '#fff' },

  // Search
  searchContainer: { paddingVertical: 12 },
  searchInput: { backgroundColor: '#f5f5f7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },

  // Service call card
  serviceCallCard: { padding: 16, backgroundColor: '#fff', borderRadius: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  serviceCallTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  customerName: { fontSize: 14, color: '#666' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  address: { fontSize: 13, color: '#666', marginTop: 4 },
  scheduledDate: { fontSize: 13, color: '#666', marginTop: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  callButton: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  callButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Empty search
  emptySearchWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptySearchText: { fontSize: 16, color: '#666', textAlign: 'center' },

  // Swipe actions
  deleteSwipeButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
  },
  deleteSwipeButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  completeSwipeButton: {
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderRadius: 16,
  },
  completeSwipeButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});