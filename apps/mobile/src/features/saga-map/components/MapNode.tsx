/**
 * Single node on the path: Locked / Active (pulse) / Completed (gold).
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { PathNode as PathNodeType } from '../domain/path.types';
import { Colors } from '@/constants/Colors';

export interface MapNodeProps {
  node: PathNodeType;
  onPress: () => void;
}

export function MapNode({ node, onPress }: MapNodeProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const isActive = node.status === 'active';
  const isLocked = node.status === 'locked';
  const isCompleted = node.status === 'completed';

  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulseAnim]);

  const label = isLocked ? '🔒' : isActive ? 'Start' : '✓';

  const backgroundColor = isLocked
    ? 'rgba(255,255,255,0.08)'
    : isCompleted
      ? 'rgba(255,215,0,0.25)'
      : isActive
        ? Colors.primary
        : 'rgba(255,255,255,0.12)';

  const borderColor = isLocked
    ? 'rgba(255,255,255,0.1)'
    : isCompleted
      ? Colors.xpGold
      : isActive
        ? Colors.primary
        : 'rgba(255,255,255,0.15)';

  const content = (
    <View style={[styles.circle, { backgroundColor, borderColor }]}>
      {isCompleted ? (
        <MaterialIcons name="star" size={28} color={Colors.xpGold} />
      ) : (
        <Text style={[styles.label, isLocked && styles.labelLocked]}>{label}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.wrapper, node.side === 'right' && styles.wrapperRight]}>
      {node.side === 'right' ? <View style={styles.spacer} /> : null}
      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.85}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={isLocked ? 'Locked' : isActive ? 'Start' : 'Completed'}
      >
        {isActive ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>{content}</Animated.View>
        ) : (
          content
        )}
      </TouchableOpacity>
      {node.side === 'left' ? <View style={styles.spacer} /> : null}
    </View>
  );
}

const NODE_SIZE = 64;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  wrapperRight: {
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  touchable: {},
  circle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.backgroundDark,
  },
  labelLocked: {
    color: Colors.textMuted,
  },
});
