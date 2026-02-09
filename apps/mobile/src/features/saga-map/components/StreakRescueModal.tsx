/**
 * Fase 3 – Modal "Streak Rescue": la racha está en riesgo, ofrecer usar Gems para reparar.
 * Estrategia: "Oh no! Your streak is burning!" → "Use 50 Gems to Repair?" vs "Let it die".
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { StreakStatusResponse } from '../api/saga.api';
import { Colors } from '@/constants/Colors';

export interface StreakRescueModalProps {
  visible: boolean;
  status: StreakStatusResponse | null;
  onUseGems: () => Promise<boolean>;
  onDismiss: () => void;
}

export function StreakRescueModal({
  visible,
  status,
  onUseGems,
  onDismiss,
}: StreakRescueModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUseGems = async () => {
    setLoading(true);
    const ok = await onUseGems();
    setLoading(false);
    if (ok) onDismiss();
  };

  if (!status?.atRisk) return null;

  const canUse = status.canUseFreeze && status.gems >= status.gemsRequired;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="local-fire-department" size={48} color={Colors.streakFire} />
          </View>
          <Text style={styles.title}>¡Tu racha está en riesgo!</Text>
          <Text style={styles.subtitle}>
            Ayer no registraste actividad. Usa {status.gemsRequired} Gems para no perder tu racha de {status.currentStreak} días.
          </Text>
          <View style={styles.actions}>
            {canUse && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUseGems}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.backgroundDark} />
                ) : (
                  <>
                    <MaterialIcons name="diamond" size={20} color={Colors.backgroundDark} />
                    <Text style={styles.primaryButtonText}>
                      Usar {status.gemsRequired} Gems
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                {canUse ? 'Dejarla morir' : 'Cerrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.backgroundDark,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: Colors.textDim,
    fontWeight: '600',
  },
});
