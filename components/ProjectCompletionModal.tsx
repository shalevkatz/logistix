import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useLanguage } from '../contexts/LanguageContext';

type ProjectCompletionModalProps = {
  visible: boolean;
  onClose: () => void;
  projectTitle: string;
};

export default function ProjectCompletionModal({
  visible,
  onClose,
  projectTitle,
}: ProjectCompletionModalProps) {
  const { t } = useLanguage();
  const confettiRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start confetti
      confettiRef.current?.start();

      // Animate modal entrance
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* Confetti */}
      <ConfettiCannon
        ref={confettiRef}
        count={300}
        origin={{ x: 0, y: 0 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={2500}
        explosionSpeed={400}
        colors={['#8B5CF6', '#6D5DE7', '#A21FF9', '#FF6B9D', '#FFC700', '#00D9FF', '#22C55E']}
      />

      {/* Modal Content */}
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🎉</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('planner.projectComplete')}</Text>

          {/* Project Name */}
          <View style={styles.projectContainer}>
            <Text style={styles.projectLabel}>{t('planner.completedFor')}</Text>
            <Text style={styles.projectTitle}>{projectTitle}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{t('planner.projectCompletedMessage')}</Text>

          {/* Tap to continue hint */}
          <Text style={styles.tapHint}>{t('serviceCalls.tapToContinue')}</Text>
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
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  projectContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  projectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
