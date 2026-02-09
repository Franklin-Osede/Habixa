/**
 * Post-workout "dopamine hit": Day complete, XP, Gems, streak.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NodeCompletionResult } from '../domain/path.types';
import { Colors } from '@/constants/Colors';

export interface VictoryOverlayProps {
  visible: boolean;
  result: NodeCompletionResult | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function VictoryOverlay({ visible, result, onClose }: VictoryOverlayProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !result) return;
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, result, scaleAnim, opacityAnim]);

  if (!result) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <MaterialIcons name="celebration" size={56} color={Colors.xpGold} />
          </View>
          <Text style={styles.title}>Day {result.dayIndex} Complete!</Text>
          <Text style={styles.subtitle}>{result.title}</Text>
          <View style={styles.rewards}>
            <View style={styles.reward}>
              <MaterialIcons name="star" size={24} color={Colors.xpGold} />
              <Text style={styles.rewardText}>+{result.xpEarned} XP</Text>
            </View>
            <View style={styles.reward}>
              <MaterialIcons name="diamond" size={24} color={Colors.xpGold} />
              <Text style={styles.rewardText}>+{result.gemsEarned} Gems</Text>
            </View>
          </View>
          <View style={styles.streakRow}>
            <MaterialIcons name="local-fire-department" size={24} color={Colors.streakFire} />
            <Text style={styles.streakText}>
              {result.newStreak} day streak
              {result.isNewStreakRecord ? ' — New record!' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: width - 48,
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: 20,
  },
  rewards: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.streakFire,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.backgroundDark,
  },
});
