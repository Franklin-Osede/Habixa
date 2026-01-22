
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ActionPanelProps {
  title: string;
  message: string;
  onPress?: () => void;
  type?: 'info' | 'warning' | 'success';
}

export function ActionPanel({ title, message, onPress, type = 'info' }: ActionPanelProps) {
  const bgColors = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
  };

  const iconColors = {
    info: '#3B82F6', // blue-500
    warning: '#F97316', // orange-500
    success: '#22C55E', // green-500
  };

  const icons = {
    info: 'lightbulb',
    warning: 'warning',
    success: 'check-circle',
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      className={`flex-row p-4 rounded-2xl border ${bgColors[type]} mb-4`}
    >
      <View className="mr-4 mt-1">
        <MaterialIcons name={icons[type] as any} size={24} color={iconColors[type]} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          {title}
        </Text>
        <Text className="text-sm text-slate-600 dark:text-slate-300 leading-5">
          {message}
        </Text>
      </View>
      {onPress && (
        <View className="justify-center pl-2">
            <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
        </View>
      )}
    </TouchableOpacity>
  );
}
