import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChallengeService, ChallengeResponse } from '../../src/services/challenge.service';

export const ChallengeDashboard = () => {
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = async () => {
    try {
      const active = await ChallengeService.getActiveChallenge();
      setChallenge(active);
    } catch (error) {
      console.error('Failed to fetch challenge', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChallenge();
    }, [])
  );

  if (loading) {
    return (
        <View className="h-24 justify-center items-center">
            <ActivityIndicator color="#0df259" />
        </View>
    );
  }

  if (!challenge) {
    return (
      <View className="absolute top-12 left-4 right-4 bg-gray-900/90 p-4 rounded-2xl border border-gray-700 shadow-lg">
        <View className="flex-row items-center justify-between">
            <View>
                <Text className="text-white font-bold text-lg">No Active Challenge</Text>
                <Text className="text-gray-400 text-sm">Start your journey today.</Text>
            </View>
            <TouchableOpacity 
                className="bg-[#0df259] px-4 py-2 rounded-lg"
                onPress={() => router.push('/challenge/selection')}
            >
                <Text className="font-bold text-black">Start Now</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = (challenge.currentDay / challenge.durationDays) * 100;

  return (
    <View className="absolute top-12 left-4 right-4 bg-gray-900/90 p-4 rounded-2xl border border-[#0df259]/30 shadow-lg">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-[#0df259] font-bold text-xs tracking-widest uppercase">Current Challenge</Text>
        <View className="flex-row items-center space-x-1">
            <Ionicons name="flame" size={16} color="#fb923c" />
            <Text className="text-white font-bold">Day {challenge.currentDay}/{challenge.durationDays}</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <View style={{ width: `${progress}%` }} className="h-full bg-[#0df259]" />
      </View>

      <TouchableOpacity 
        className="flex-row items-center justify-between"
        onPress={() => router.push('/challenge/day-view' as any)} 
      >
        <Text className="text-white font-semibold">View Today&apos;s Plan</Text>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};
