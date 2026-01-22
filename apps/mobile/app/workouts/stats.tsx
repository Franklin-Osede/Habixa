
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../src/services/api.client';

interface WeightStat {
  date: string;
  weight: number;
}

export default function StatsScreen() {
  const router = useRouter();
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [stats, setStats] = useState<WeightStat[]>([]);
  const [searching, setSearching] = useState(false);

  const searchStats = async () => {
    if (!exerciseQuery.trim()) return;
    
    setSearching(true);
    try {
        const response = await apiClient.get(`/workouts/stats?exercise=${encodeURIComponent(exerciseQuery)}`);
        setStats(response.data);
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    } finally {
        setSearching(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <MaterialIcons name="arrow-back-ios" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Progression</Text>
      </View>

      <View className="px-6 mb-6">
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <MaterialIcons name="search" size={20} color="#94A3B8" />
            <TextInput 
                className="flex-1 ml-2 text-base text-slate-900 dark:text-white"
                placeholder="Search Exercise (e.g. Squat)"
                placeholderTextColor="#94A3B8"
                value={exerciseQuery}
                onChangeText={setExerciseQuery}
                onSubmitEditing={searchStats}
                returnKeyType="search"
            />
             {searching && <Text className="text-xs text-primary">...</Text>}
        </View>
        <TouchableOpacity onPress={searchStats} className="mt-2 items-end">
            <Text className="text-primary font-bold">Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {stats.length > 0 ? (
            <View>
                 <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Max Weight History</Text>
                 <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
                    {stats.map((stat, index) => (
                        <View key={index} className="flex-row justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <Text className="text-slate-500">{new Date(stat.date).toLocaleDateString()}</Text>
                            <Text className="font-bold text-slate-900 dark:text-white">{stat.weight} kg</Text>
                        </View>
                    ))}
                 </View>
                 
                 {/* Visual Bar Representation (Simple Chart) */}
                 <View className="mt-8 h-40 flex-row items-end justify-between space-x-2">
                    {stats.slice(-7).map((stat, index) => {
                        const maxW = Math.max(...stats.map(s => s.weight));
                        const heightPct = (stat.weight / maxW) * 100;
                        return (
                            <View key={index} className="flex-1 items-center">
                                <View className="w-full bg-primary/20 rounded-t-lg" style={{ height: `${heightPct}%` }}>
                                     <View className="w-full h-full bg-primary opacity-60 rounded-t-lg" />
                                </View>
                                <Text className="text-[10px] text-slate-400 mt-1">{new Date(stat.date).getDate()}/{new Date(stat.date).getMonth() + 1}</Text>
                            </View>
                        );
                    })}
                 </View>
            </View>
        ) : (
             <View className="items-center mt-10 opacity-50">
                <MaterialIcons name="show-chart" size={64} color="#94A3B8" />
                <Text className="text-slate-500 mt-4">Search for an exercise to see your progress</Text>
            </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
