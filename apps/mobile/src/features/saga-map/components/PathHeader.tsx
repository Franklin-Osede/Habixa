/**
 * Sticky header: Hearts, Gems, Streak (single responsibility).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MapWallet } from '../domain/path.types';
import { Colors } from '@/constants/Colors';

export interface PathHeaderProps {
  wallet: MapWallet;
  /** Optional phase label above or beside; KISS: optional. */
  phaseLabel?: string;
}

export function PathHeader({ wallet, phaseLabel }: PathHeaderProps) {
  return (
    <View style={styles.container}>
      {phaseLabel ? (
        <Text style={styles.phaseLabel} numberOfLines={1}>
          {phaseLabel}
        </Text>
      ) : null}
      <View style={styles.row}>
        <View style={styles.pill}>
          <MaterialIcons name="favorite" size={18} color={Colors.error} />
          <Text style={styles.pillText}>
            {wallet.hearts}/{wallet.heartsMax}
          </Text>
        </View>
        <View style={styles.pill}>
          <MaterialIcons name="diamond" size={18} color={Colors.xpGold} />
          <Text style={styles.pillText}>{wallet.gems}</Text>
        </View>
        <View style={styles.pill}>
          <MaterialIcons name="local-fire-department" size={18} color={Colors.streakFire} />
          <Text style={styles.pillText}>{wallet.streak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(21, 36, 26, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
