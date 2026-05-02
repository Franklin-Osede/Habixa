import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import api from '@/src/services/api.client';

type AdherenceResponse = {
  windowDays: number;
  windowStartDate: string;
  windowEndDate: string;
  streakDays: number;
  totals: { completed: number; skipped: number; scheduled: number };
  consistency: {
    overallPct: number;
    workoutPct: number;
    nutritionPct: number;
    habitsPct: number;
  };
};

export default function ProfileScreen() {
  const router = useRouter();
  const [tapCount, setTapCount] = useState(0);
  const [adherence, setAdherence] = useState<AdherenceResponse | null>(null);
  const [loadingAdherence, setLoadingAdherence] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAdherence = async () => {
      try {
        const res = await api.get<AdherenceResponse>('/me/adherence?range=week');
        if (!cancelled) setAdherence(res.data);
      } catch (err) {
        console.error('Failed to load adherence', err);
      } finally {
        if (!cancelled) setLoadingAdherence(false);
      }
    };
    void fetchAdherence();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount === 5) {
      Alert.alert('⚡️ God Mode Activated', 'Entering Developer Console...', [
        { text: 'OK', onPress: () => router.push('/admin') }
      ]);
      setTapCount(0);
    }
  };

  return (
    <View className="flex-1 bg-black p-6 pt-20 relative">
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-12 left-6 z-10 w-10 h-10 bg-gray-900 rounded-full items-center justify-center"
        onPress={() => router.back()}
      >
        <IconSymbol size={20} name="chevron.left" color="white" />
      </TouchableOpacity>

      {/* Header */}
      <View className="items-center mb-10">
        <View className="w-24 h-24 bg-gray-800 rounded-full items-center justify-center mb-4 border-2 border-green-500">
           <IconSymbol size={40} name="person.fill" color="#4ade80" />
        </View>
        <Text className="text-white text-2xl font-bold">Domoblock</Text>
        <Text className="text-gray-400">Level 7 • 12,450 XP</Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row justify-between mb-3">
        <StatCard
            value={
              loadingAdherence
                ? null
                : (adherence?.streakDays ?? 0).toString()
            }
            label="Días seguidos"
        />
        <StatCard
            value={
              loadingAdherence
                ? null
                : `${adherence?.consistency.overallPct ?? 0}%`
            }
            label="Consistencia"
        />
      </View>

      {!loadingAdherence && adherence ? (
        <View className="bg-gray-900 p-4 rounded-xl mb-8 flex-row justify-around">
          <CategoryStat
            label="Entreno"
            pct={adherence.consistency.workoutPct}
          />
          <CategoryStat
            label="Nutrición"
            pct={adherence.consistency.nutritionPct}
          />
          <CategoryStat
            label="Hábitos"
            pct={adherence.consistency.habitsPct}
          />
        </View>
      ) : (
        <View className="mb-8" />
      )}

      {/* Menu Options */}
      <View className="space-y-4">
        <MenuItem icon="gear" title="Settings" />
        <MenuItem icon="bell" title="Notifications" />
        <MenuItem icon="star" title="Subscription (Pro)" isPro />
      </View>

      {/* Hidden Developer Entrance */}
      <View className="flex-1 justify-end items-center mb-8 gap-4">
        {/* TEMPORARY: Visible Admin Button for Development */}
        <TouchableOpacity
            className="bg-red-900/50 px-6 py-3 rounded-full border border-red-500/50"
            onPress={() => {
                console.log('Admin button pressed');
                router.push('/admin');
            }}
        >
            <Text className="text-red-200 font-bold text-sm">⚡️ ENTER GOD MODE ⚡️</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onPress={handleVersionTap}>
            <Text className="text-gray-700 text-xs">Habixa v1.0.0 (Build 42)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatCard({ value, label }: { value: string | null; label: string }) {
    return (
        <View className="bg-gray-900 p-4 rounded-xl flex-1 mx-1 items-center">
            {value === null ? (
                <ActivityIndicator color="#0df259" />
            ) : (
                <Text className="text-2xl font-bold text-white">{value}</Text>
            )}
            <Text className="text-gray-500 text-xs mt-1">{label}</Text>
        </View>
    );
}

function CategoryStat({ label, pct }: { label: string; pct: number }) {
    return (
        <View className="items-center">
            <Text className="text-base font-bold text-white">{pct}%</Text>
            <Text className="text-gray-500 text-xs mt-1">{label}</Text>
        </View>
    );
}

function MenuItem({ icon, title, isPro = false }: { icon: string; title: string; isPro?: boolean }) {
    return (
        <TouchableOpacity className="flex-row items-center bg-gray-900 p-4 rounded-xl mb-3">
            <IconSymbol size={20} name={icon as any} color="white" />
            <Text className="text-white ml-4 flex-1 font-semibold">{title}</Text>
            {isPro && <View className="bg-yellow-500 px-2 py-1 rounded"><Text className="text-black text-xs font-bold">PRO</Text></View>}
            {!isPro && <IconSymbol size={16} name="chevron.right" color="#6b7280" />}
        </TouchableOpacity>
    )
}
