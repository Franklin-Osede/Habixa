import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock Data for MVP - In real app, fetch from specific API endpoint for "Today's Plan"
// We reuse the structure we agreed on.
const MOCK_PLAN = {
    mood: 'FIRE',
    workout: {
        icon: 'dumbbell',
        title: 'Day 1: Leg Destruction',
        steps: [
            { name: 'Warmup Jog', reps: '5 min', icon: 'walk' },
            { name: 'Squats', reps: '3x12', icon: 'arrow-down' },
            { name: 'Lunges', reps: '3x10', icon: 'repeat' },
        ]
    },
    meals: [
        { emoji: '🥗', title: 'Power Salad', details: 'Chicken, Spinach, No Dressing' },
        { emoji: '🥩', title: 'Steak Dinner', details: 'High protein, minimal carbs tonight.' }
    ]
};

export default function DayViewScreen() {
    const router = useRouter();
    // In real app: const { data } = useQuery(...) logic
    const [plan, setPlan] = useState<typeof MOCK_PLAN | null>(null);

    useEffect(() => {
        // Simulate fetch
        setTimeout(() => setPlan(MOCK_PLAN), 500);
    }, []);

    if (!plan) {
        return (
            <SafeAreaView className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator color="#0df259" size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Today's Mission</Text>
            </View>

            <ScrollView className="flex-1 px-6">
                
                {/* WORKOUT SECTION */}
                <View className="mb-8">
                    <Text className="text-[#0df259] font-bold text-sm tracking-widest mb-4 uppercase">Training Block</Text>
                    
                    <View className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                        <View className="flex-row items-center mb-6">
                            <View className="bg-[#0df259] p-3 rounded-full mr-4">
                                <Ionicons name="barbell" size={24} color="black" />
                            </View>
                            <View>
                                <Text className="text-white text-2xl font-bold">{plan.workout.title}</Text>
                                <Text className="text-gray-400">45 Minutes • High Intensity</Text>
                            </View>
                        </View>

                        {plan.workout.steps.map((step, index) => (
                            <View key={index} className="flex-row items-center mb-4 bg-black/40 p-3 rounded-xl">
                                <View className="w-8 h-8 justify-center items-center bg-gray-800 rounded-full mr-3">
                                    <Ionicons name={step.icon === 'arrow-down' ? 'arrow-down' : 'fitness'} size={16} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-semibold text-lg">{step.name}</Text>
                                    <Text className="text-gray-400">{step.reps}</Text>
                                </View>
                                <TouchableOpacity>
                                     <Ionicons name="checkbox-outline" size={24} color="#444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* NUTRITION SECTION */}
                <View className="mb-20">
                    <Text className="text-orange-400 font-bold text-sm tracking-widest mb-4 uppercase">Nutrition Protocol</Text>
                    
                    {plan.meals.map((meal, index) => (
                         <View key={index} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-3 flex-row items-center">
                            <Text className="text-4xl mr-4">{meal.emoji}</Text>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">{meal.title}</Text>
                                <Text className="text-gray-400">{meal.details}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>

            <View className="absolute bottom-8 left-6 right-6">
                <TouchableOpacity className="bg-[#0df259] py-4 rounded-xl items-center shadow-lg shadow-green-900/20">
                    <Text className="text-black font-bold text-lg">Complete Day</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
