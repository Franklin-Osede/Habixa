import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChallengeService } from '../../src/services/challenge.service';
import { Ionicons } from '@expo/vector-icons';

// Using a simple array for now. In real app, could come from config.
const CHALLENGE_OPTIONS = [
  { days: 1, title: 'Day 1 Kickoff', description: 'Just try it out.', icon: 'rocket-outline', color: 'bg-blue-100', border: 'border-blue-300' },
  { days: 3, title: '3-Day Reset', description: 'Perfect for a weekend.', icon: 'water-outline', color: 'bg-green-100', border: 'border-green-300' },
  { days: 7, title: '7-Day Warrior', description: 'Build a solid habit.', icon: 'flame-outline', color: 'bg-orange-100', border: 'border-orange-300' },
  { days: 15, title: '15-Day Transformation', description: 'See real results.', icon: 'barbell-outline', color: 'bg-purple-100', border: 'border-purple-300' },
  { days: 30, title: '30-Day Master', description: 'Change your life.', icon: 'trophy-outline', color: 'bg-yellow-100', border: 'border-yellow-300' },
];

export default function ChallengeSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // Parse params
  const recommendedDays = params.recommendedDuration ? Number(params.recommendedDuration) : null;
  const trackId = params.trackId 
    ? (Array.isArray(params.trackId) ? params.trackId[0] : params.trackId) 
    : 'MUSCLE_GAIN';

  const handleSelectChallenge = async (days: number) => {
    setLoading(true);
    try {
      await ChallengeService.startChallenge({
        durationDays: days,
        trackId: trackId
      });
      
      Alert.alert('Challenge Accepted!', `You have started a ${days}-day journey. Let's go!`, [
        { text: 'Let\'s Go', onPress: () => router.replace('/(tabs)') } // Redirect to Dashboard
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to start challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
             <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
            <Text className="text-2xl font-bold text-gray-900">Choose Your Journey</Text>
            <Text className="text-gray-500 mt-1">Select a duration to start your challenge.</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-2 pb-10" showsVerticalScrollIndicator={false}>
        {CHALLENGE_OPTIONS.map((option) => {
          const isRecommended = recommendedDays === option.days;
          return (
            <TouchableOpacity
                key={option.days}
                className={`w-full mb-4 rounded-2xl p-5 border-2 flex-row items-center ${
                    isRecommended ? 'bg-green-50 border-green-500 scale-[1.02]' : `${option.color} ${option.border}`
                }`}
                onPress={() => handleSelectChallenge(option.days)}
                disabled={loading}
                style={isRecommended ? 
                  Platform.select({
                    web: { boxShadow: '0px 4px 8px rgba(74, 222, 128, 0.3)' },
                    default: { shadowColor: '#4ade80', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8 }
                  }) 
                : {}}
            >
                {isRecommended && (
                    <View className="absolute -top-3 right-4 bg-green-500 px-3 py-1 rounded-full z-10 shadow-sm">
                        <Text className="text-white text-xs font-bold">RECOMMENDED FOR YOU</Text>
                    </View>
                )}

                <View className="bg-white p-3 rounded-full mr-4 shadow-sm">
                    <Ionicons name={option.icon as any} size={24} color={isRecommended ? '#166534' : '#333'} />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">{option.title}</Text>
                    <Text className="text-sm text-gray-600">{option.description}</Text>
                </View>
                <View className="bg-white px-3 py-1 rounded-lg">
                    <Text className="font-bold text-gray-800">{option.days}d</Text>
                </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && (
        <View className="absolute inset-0 bg-black/20 justify-center items-center">
            <View className="bg-white p-6 rounded-xl shadow-xl">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-4 font-semibold text-gray-700">Generating Plan...</Text>
            </View>
        </View>
      )}
    </SafeAreaView>
  );
}
