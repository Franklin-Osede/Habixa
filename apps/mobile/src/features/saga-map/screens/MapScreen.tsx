/**
 * Map (Home) screen: Saga path + header + modals.
 * Single responsibility: compose feature components and handle flow.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { PathNode } from '../domain/path.types';
import type { NodeCompletionResult } from '../domain/path.types';
import { usePath } from '../application';
import {
  PathHeader,
  SagaPath,
  NodeDetailModal,
  VictoryOverlay,
  StreakRescueModal,
} from '../components';
import { Colors } from '@/constants/Colors';

export function MapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    pathState,
    completeActiveNode,
    applyCompletion,
    isFromApi,
    streakRescue,
    useStreakFreeze,
    dismissStreakRescue,
  } = usePath();

  const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [victoryResult, setVictoryResult] = useState<NodeCompletionResult | null>(null);

  const handleNodePress = useCallback((node: PathNode) => {
    if (node.status !== 'active') return;
    setSelectedNode(node);
    setNodeDetailVisible(true);
  }, []);

  const handleStartSession = useCallback(() => {
    setNodeDetailVisible(false);
    const result = completeActiveNode();
    if (result) {
      setVictoryResult(result);
      setVictoryVisible(true);
    }
    setSelectedNode(null);
  }, [completeActiveNode]);

  const handleCloseNodeDetail = useCallback(() => {
    setNodeDetailVisible(false);
    setSelectedNode(null);
  }, []);

  const handleVictoryClose = useCallback(() => {
    if (victoryResult) applyCompletion(victoryResult);
    setVictoryVisible(false);
    setVictoryResult(null);
  }, [victoryResult, applyCompletion]);

  const handleBack = useCallback(() => {
    router.push('/onboarding/step-contract' as import('expo-router').Href);
  }, [router]);

  const phaseLabel = t('map.phase');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Botón atrás fijo arriba a la izquierda para volver al resumen del plan */}
        <TouchableOpacity
          style={styles.backButtonFixed}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back-ios" size={22} color={Colors.text} />
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <PathHeader wallet={pathState.wallet} phaseLabel={phaseLabel} />
        </View>
        <SagaPath nodes={pathState.nodes} onNodePress={handleNodePress} />
      </SafeAreaView>

      <NodeDetailModal
        visible={nodeDetailVisible}
        node={selectedNode}
        onStartSession={handleStartSession}
        onClose={handleCloseNodeDetail}
      />

      <VictoryOverlay
        visible={victoryVisible}
        result={victoryResult}
        onClose={handleVictoryClose}
      />

      {isFromApi && streakRescue && (
        <StreakRescueModal
          visible={!!streakRescue}
          status={streakRescue}
          onUseGems={useStreakFreeze}
          onDismiss={dismissStreakRescue}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15241a',
  },
  safe: {
    flex: 1,
  },
  backButtonFixed: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingLeft: 100,
    backgroundColor: 'rgba(21, 36, 26, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
});
