import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChallengeService } from '../../src/services/challenge.service';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function ChallengeSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const CHALLENGE_OPTIONS = [
    { days: 1, key: 'kickoff', title: 'Despegue Día 1', desc: 'Solo pruébalo', icon: 'flash-outline' },
    { days: 3, key: 'reset', title: 'Reinicio 3 Días', desc: 'Perfecto para un fin de semana', icon: 'calendar-outline' },
    { days: 7, key: 'warrior', title: 'Guerrero 7 Días', desc: 'Construye un hábito sólido', icon: 'shield-checkmark-outline' },
  ];

  const FEATURED_OPTION = { days: 30, key: 'master', title: 'Maestría 30 Días', desc: 'Cambia tu vida', icon: 'sparkles-outline' };

  const recommendedDays = params.recommendedDuration ? Number(params.recommendedDuration) : 30;
  const trackId = params.trackId 
    ? (Array.isArray(params.trackId) ? params.trackId[0] : params.trackId) 
    : 'MUSCLE_GAIN';

  const [selectedDays, setSelectedDays] = useState<number | null>(recommendedDays);

  const handleSelectChallenge = async () => {
    if (!selectedDays) return;
    setLoading(true);
    try {
      await ChallengeService.startChallenge({
        durationDays: selectedDays,
        trackId: trackId
      });
      if (Platform.OS === 'web') {
        window.alert(t('challenge.successTitle', 'Challenge Accepted!') + '\n' + t('challenge.successMsg', { days: selectedDays, defaultValue: `Your ${selectedDays}-day journey begins now.` }));
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          t('challenge.successTitle', 'Challenge Accepted!'),
          t('challenge.successMsg', { days: selectedDays, defaultValue: `Your ${selectedDays}-day journey begins now.` }),
          [
            { text: t('challenge.letsGo', "CONTINUAR"), onPress: () => router.replace('/(tabs)') }
          ]
        );
      }
    } catch (error: any) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert(t('challenge.errorTitle', 'Error') + ': ' + t('challenge.errorMsg', 'Failed to start challenge. Please try again.'));
      } else {
        Alert.alert(
          t('challenge.errorTitle', 'Error'), 
          t('challenge.errorMsg', 'Failed to start challenge. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a140d]">
      <View className="px-6 py-4 flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center">
            <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="px-6 mb-8">
        <Text className="text-[#0df259] text-[10px] uppercase tracking-[0.3em] font-bold mb-2">
            {t('challenge.strategy', 'Estrategia')}
        </Text>
        <Text className="text-4xl font-extrabold text-white tracking-tight">
            {t('challenge.screenTitle', 'Elige tu Viaje')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        {CHALLENGE_OPTIONS.map((option) => {
          const isSelected = selectedDays === option.days;
          return (
            <TouchableOpacity
                key={option.days}
                className={`w-full mb-4 rounded-3xl p-5 border flex-row items-center justify-between transition-transform ${
                    isSelected ? 'bg-white/10 border-[#0df259] scale-[1.02]' : 'bg-white/5 border-white/10'
                }`}
                onPress={() => setSelectedDays(option.days)}
                disabled={loading}
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center mr-4">
                        <Ionicons name={option.icon as any} size={24} color={isSelected ? '#0df259' : 'rgba(255,255,255,0.7)'} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-white">
                            {t(`challenge.phases.${option.key}.title`, option.title)}
                        </Text>
                        <Text className="text-sm text-white/50 mt-0.5">
                            {t(`challenge.phases.${option.key}.desc`, option.desc)}
                        </Text>
                    </View>
                </View>
                <View className="bg-white/10 px-3 py-1.5 rounded-full ml-2">
                    <Text className="font-semibold text-white/80 text-xs">{option.days}d</Text>
                </View>
            </TouchableOpacity>
          );
        })}

        {/* Featured Option */}
        <View className="relative mt-2">
            <View className="absolute -top-2.5 left-6 bg-[#0df259] px-3 py-0.5 rounded-full z-10 shadow-lg">
                <Text className="text-[#0a140d] text-[10px] font-extrabold tracking-widest">{t('challenge.recommendedBadge', 'RECOMENDADO')}</Text>
            </View>
            <TouchableOpacity
                className={`w-full mb-4 rounded-3xl p-5 border-[1.5px] flex-row items-center justify-between ${
                    selectedDays === FEATURED_OPTION.days ? 'bg-[#0df259]/20 border-[#0df259]' : 'bg-[#0df259]/5 border-[#0df259]/30'
                }`}
                onPress={() => setSelectedDays(FEATURED_OPTION.days)}
                disabled={loading}
                style={{ shadowColor: '#0df259', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.2, shadowRadius: 15 }}
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-2xl bg-[#0df259]/20 items-center justify-center mr-4">
                        <Ionicons name={FEATURED_OPTION.icon as any} size={24} color={selectedDays === FEATURED_OPTION.days ? "#0df259" : "rgba(13, 242, 89, 0.5)"} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-extrabold text-white">
                            {t(`challenge.phases.${FEATURED_OPTION.key}.title`, FEATURED_OPTION.title)}
                        </Text>
                        <Text className="text-sm text-[#0df259]/80 font-medium mt-0.5">
                            {t(`challenge.phases.${FEATURED_OPTION.key}.desc`, FEATURED_OPTION.desc)}
                        </Text>
                    </View>
                </View>
                <View className="bg-[#0df259]/20 border border-[#0df259]/30 px-3 py-1.5 rounded-full ml-2">
                    <Text className="font-bold text-[#0df259] text-xs">{FEATURED_OPTION.days}d</Text>
                </View>
            </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View className="absolute bottom-8 left-6 right-6">
        <TouchableOpacity 
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg transition-transform ${selectedDays && !loading ? 'bg-[#0df259]' : 'bg-gray-600'}`}
            onPress={handleSelectChallenge}
            disabled={!selectedDays || loading}
            style={selectedDays ? { shadowColor: '#0df259', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 20 } : {}}
        >
            {loading ? (
                <ActivityIndicator color="#0a140d" />
            ) : (
                <>
                    <Text className="text-[#0a140d] font-extrabold tracking-wider text-base mr-2">
                        {t('challenge.continue', 'CONTINUAR')}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#0a140d" />
                </>
            )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
