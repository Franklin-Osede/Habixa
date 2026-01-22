
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../src/services/api.client';

interface Workout {
  id: string;
  name: string;
  startedAt: string;
  exercises: any[];
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('/workouts/history');
      setWorkouts(response.data);
    } catch (error) {
      console.error('Failed to fetch workouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar style="auto" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
            <MaterialIcons name="arrow-back-ios" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Workouts</Text>
         <TouchableOpacity onPress={() => router.push('/workouts/stats')} className="h-10 w-10 items-center justify-center">
            <MaterialIcons name="bar-chart" size={24} color="#0df259" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0df259" />}
      >
        
        {/* Start Workout Button */}
        <TouchableOpacity 
            onPress={() => router.push('/workouts/log')}
            className="flex-row items-center justify-center bg-primary p-4 rounded-xl mb-6 shadow-lg shadow-primary/30"
        >
            <MaterialIcons name="add" size={24} color="#102216" />
            <Text className="text-[#102216] font-bold text-lg ml-2">Log Workout</Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent History</Text>

        {loading ? (
            <Text className="text-slate-500 text-center mt-10">Loading history...</Text>
        ) : workouts.length === 0 ? (
            <View className="items-center py-10">
                <MaterialIcons name="fitness-center" size={48} color="#94A3B8" />
                <Text className="text-slate-500 mt-4 text-center">No workouts logged yet.{'\n'}Start your journey today!</Text>
            </View>
        ) : (
            workouts.map((workout) => (
                <View key={workout.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-3 border border-slate-200 dark:border-slate-700">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-slate-900 dark:text-white text-base">{workout.name || 'Untitled Workout'}</Text>
                        <Text className="text-xs text-slate-500">{new Date(workout.startedAt).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                        {workout.exercises.length} Exercises Completed
                    </Text>
                </View>
            ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
