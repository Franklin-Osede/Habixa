
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ActionPanel } from '../../components/ActionPanel';
import { HabitCard } from '../../components/HabitCard';

export default function DashboardScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState([
    { id: '1', title: 'Morning Meditation', subtitle: '15 minutes • Mindfulness', completed: false, streak: 5 },
    { id: '2', title: 'Drink Water', subtitle: '2 Liters • Hydration', completed: true, streak: 12 },
    { id: '3', title: 'Read a Book', subtitle: '10 Pages • Knowledge', completed: false, streak: 3 },
    { id: '4', title: 'Workout', subtitle: 'Upper Body • Strength', completed: false, streak: 8 },
  ]);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
  };

  const completedCount = habits.filter(h => h.completed).length;
  const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Today&apos;s Plan
          </Text>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            Hello, Domo
          </Text>
        </View>
        <TouchableOpacity className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center border border-white/20">
             <MaterialIcons name="person" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Level / Progress Card */}
        <View className="bg-slate-900 rounded-3xl p-6 mb-6 shadow-xl shadow-slate-900/20">
          <View className="flex-row justify-between items-start mb-4">
            <View>
               <Text className="text-white font-bold text-lg">Level 4</Text>
               <Text className="text-slate-400 text-xs">Consistent Achiever</Text>
            </View>
            <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/20">
                <Text className="text-primary text-xs font-bold">+450 XP</Text>
            </View>
          </View>
          
          <View className="mb-2">
            <View className="flex-row justify-between mb-1">
                <Text className="text-slate-400 text-xs">Progress today</Text>
                <Text className="text-white text-xs font-bold">{Math.round(progress)}%</Text>
            </View>
            <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <View 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progress}%` }} 
                />
            </View>
          </View>
        </View>

        {/* AI Coach Action Panel */}
        <ActionPanel 
            title="AI Coach Tip"
            message="You missed your meditation yesterday. Try doing it first thing this morning to get back on track!"
            type="info"
            onPress={() => {}}
        />

        {/* Context / Mode Selector (Tabs) */}
        <View className="flex-row mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
             <TouchableOpacity className="flex-1 py-2 items-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                 <Text className="font-bold text-slate-900 dark:text-white text-sm">Today</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                className="flex-1 py-2 items-center"
                onPress={() => router.push('/workouts')}
            >
                 <Text className="font-medium text-slate-500 text-sm">Workouts</Text>
             </TouchableOpacity>
             <TouchableOpacity className="flex-1 py-2 items-center">
                 <Text className="font-medium text-slate-500 text-sm">Stats</Text>
             </TouchableOpacity>
        </View>

        {/* Habits List */}
        <View className="mb-6">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Your Habits</Text>
            {habits.map(habit => (
                <HabitCard 
                    key={habit.id}
                    {...habit}
                    onToggle={() => toggleHabit(habit.id)}
                />
            ))}
        </View>

        {/* Add New Button */}
        <TouchableOpacity className="flex-row items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            <MaterialIcons name="add" size={20} color="#94A3B8" />
            <Text className="text-slate-500 font-medium ml-2">Add New Habit</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
