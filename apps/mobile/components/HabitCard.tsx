
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface HabitCardProps {
  title: string;
  subtitle?: string;
  completed: boolean;
  streak: number;
  onToggle: () => void;
}

export function HabitCard({ title, subtitle, completed, streak, onToggle }: HabitCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      className={`flex-row items-center p-4 rounded-xl mb-3 border transition-all ${
        completed
          ? 'bg-primary/10 border-primary/30'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Search/Check Icon */}
      <View
        className={`h-12 w-12 rounded-full items-center justify-center mr-4 border ${
          completed
            ? 'bg-primary border-primary'
            : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
        }`}
      >
        {completed ? (
          <MaterialIcons name="check" size={24} color="#000" />
        ) : (
          <View className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-500" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${
            completed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Streak Badge */}
      <View className="items-end">
        <View className="flex-row items-center bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
            <MaterialIcons name="local-fire-department" size={14} color="#F97316" />
            <Text className="text-xs font-bold text-orange-600 dark:text-orange-400 ml-1">
                {streak}
            </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
