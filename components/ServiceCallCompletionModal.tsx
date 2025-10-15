import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useLanguage } from '../contexts/LanguageContext';

type ServiceCallCompletionModalProps = {
  visible: boolean;
  onClose: () => void;
  customerName: string;
  completionCount?: number;
  streakDays?: number;
};

export default function ServiceCallCompletionModal({
  visible,
  onClose,
  customerName,
  completionCount,
  streakDays,
}: ServiceCallCompletionModalProps) {
  const { t } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Trigger confetti
      confettiRef.current?.start();

      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto-close after 2.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Confetti */}
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: -10, y: 0 }}
            autoStart={false}
            fadeOut
            fallSpeed={2000}
          />

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>

          {/* Main Message */}
          <Text style={styles.title}>{t('serviceCalls.greatJob')}</Text>
          <Text style={styles.subtitle}>
            {t('serviceCalls.completedFor')} {customerName}
          </Text>

          {/* Stats */}
          {completionCount !== undefined && completionCount > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {t('serviceCalls.completionCount', { count: completionCount })}
              </Text>
            </View>
          )}

          {/* Streak */}
          {streakDays !== undefined && streakDays > 1 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>
                🔥 {t('serviceCalls.streak', { days: streakDays })}
              </Text>
            </View>
          )}

          {/* Tap to continue */}
          <Pressable onPress={handleClose} style={styles.tapArea}>
            <Text style={styles.tapText}>{t('serviceCalls.tapToContinue')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  streakContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },
  tapArea: {
    marginTop: 8,
  },
  tapText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
