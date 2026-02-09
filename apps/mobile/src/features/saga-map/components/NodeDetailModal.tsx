/**
 * Pre-workout modal: Day X, title, duration, XP, START SESSION.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { PathNode } from '../domain/path.types';
import { Colors } from '@/constants/Colors';

export interface NodeDetailModalProps {
  visible: boolean;
  node: PathNode | null;
  onStartSession: () => void;
  onClose: () => void;
}

export function NodeDetailModal({
  visible,
  node,
  onStartSession,
  onClose,
}: NodeDetailModalProps) {
  if (!node) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.dayLabel}>
            Day {node.dayIndex}: {node.title}
          </Text>
          {node.subtitle ? (
            <Text style={styles.subtitle}>{node.subtitle}</Text>
          ) : null}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <MaterialIcons name="schedule" size={20} color={Colors.primary} />
              <Text style={styles.statText}>{node.durationMinutes} min</Text>
            </View>
            <View style={styles.stat}>
              <MaterialIcons name="star" size={20} color={Colors.xpGold} />
              <Text style={styles.statText}>{node.xpReward} XP</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStartSession}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Start session"
          >
            <Text style={styles.primaryButtonText}>START SESSION</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelButtonText}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textDim,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: Colors.textDim,
    fontWeight: '600',
  },
});
