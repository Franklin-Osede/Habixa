/**
 * Vertical path: Duolingo-style — Day 1 (Start) at BOTTOM of viewport, progress upward.
 * Espaciador arriba + nodos en orden inverso (último = Día 1); scroll al final al montar.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import type { PathNode } from '../domain/path.types';
import { MapNode } from './MapNode';
import { Colors } from '@/constants/Colors';

const SPACER_HEIGHT = Dimensions.get('window').height * 1.2;

export interface SagaPathProps {
  nodes: readonly PathNode[];
  onNodePress: (node: PathNode) => void;
}

export function SagaPath({ nodes, onNodePress }: SagaPathProps) {
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolledRef = useRef(false);
  const reversedNodes = useMemo(() => [...nodes].reverse(), [nodes]);

  const scrollToBottom = React.useCallback(() => {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  useEffect(() => {
    const t = setTimeout(scrollToBottom, 350);
    return () => clearTimeout(t);
  }, [nodes.length, scrollToBottom]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={scrollToBottom}
    >
      <View style={[styles.spacer, { height: SPACER_HEIGHT }]} />
      {reversedNodes.map((node, index) => (
        <View key={node.id} style={styles.nodeRow}>
          <MapNode node={node} onPress={() => onNodePress(node)} />
          {index < reversedNodes.length - 1 ? <View style={styles.connector} /> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const CONNECTOR_WIDTH = 2;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 120,
  },
  spacer: {
    width: '100%',
  },
  nodeRow: {
    alignItems: 'stretch',
  },
  connector: {
    width: CONNECTOR_WIDTH,
    alignSelf: 'center',
    height: 24,
    backgroundColor: Colors.surfaceBorder,
    opacity: 0.6,
  },
});
