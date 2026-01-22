
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../src/services/api.client';

interface SetData {
  reps: string;
  weight: string;
}

interface ExerciseData {
  id: string;
  name: string;
  sets: SetData[];
}

export default function LogWorkoutScreen() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: '', sets: [{ reps: '', weight: '' }] }]);
  };

  const updateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, name } : ex));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] } : ex
    ));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof SetData, value: string) => {
    setExercises(exercises.map(ex => {
        if (ex.id === exerciseId) {
            const newSets = [...ex.sets];
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            return { ...ex, sets: newSets };
        }
        return ex;
    }));
  };

  const removeExercise = (id: string) => {
      setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
        Alert.alert('Error', 'Add at least one exercise');
        return;
    }

    setLoading(true);
    try {
        const payload = {
            name: workoutName || 'Workout',
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
            exercises: exercises.map(ex => ({
                exerciseName: ex.name || 'Unknown Exercise',
                type: 'STRENGTH',
                sets: ex.sets.map(s => ({
                    reps: parseInt(s.reps) || 0,
                    weight: parseFloat(s.weight) || 0
                }))
            }))
        };

        await apiClient.post('/workouts', payload);
        Alert.alert('Success', 'Workout logged!', [
            { text: 'OK', onPress: () => router.back() }
        ]);
        // Trigger refresh on previous screen if needed (usually handled by focus effect or global state)
        
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to save workout');
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar style="auto" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-slate-500 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Log Workout</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
                <Text className="text-primary font-bold text-base">{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
            
            <TextInput 
                className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 py-2"
                placeholder="Workout Name (e.g. Leg Day)"
                placeholderTextColor="#94A3B8"
                value={workoutName}
                onChangeText={setWorkoutName}
            />

            {exercises.map((exercise, index) => (
                <View key={exercise.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                    <View className="flex-row justify-between items-center mb-3">
                        <TextInput 
                            className="flex-1 text-lg font-semibold text-slate-900 dark:text-white mr-2"
                            placeholder={`Exercise ${index + 1}`}
                            placeholderTextColor="#94A3B8"
                            value={exercise.name}
                            onChangeText={(text) => updateExerciseName(exercise.id, text)}
                        />
                        <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                            <MaterialIcons name="close" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    {/* Sets Header */}
                    <View className="flex-row mb-2 px-2">
                        <Text className="w-12 text-center text-xs text-slate-400 font-bold uppercase">Set</Text>
                        <Text className="flex-1 text-center text-xs text-slate-400 font-bold uppercase">kg / lbs</Text>
                        <Text className="flex-1 text-center text-xs text-slate-400 font-bold uppercase">Reps</Text>
                    </View>

                    {exercise.sets.map((set, setIndex) => (
                        <View key={setIndex} className="flex-row items-center mb-2 px-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg py-1">
                            <View className="w-12 items-center justify-center">
                                <View className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                    <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">{setIndex + 1}</Text>
                                </View>
                            </View>
                            
                            <TextInput 
                                className="flex-1 text-center py-2 text-slate-900 dark:text-white font-medium border-r border-slate-200 dark:border-slate-700"
                                placeholder="0"
                                keyboardType="numeric"
                                value={set.weight}
                                onChangeText={(text) => updateSet(exercise.id, setIndex, 'weight', text)}
                            />
                            
                            <TextInput 
                                className="flex-1 text-center py-2 text-slate-900 dark:text-white font-medium"
                                placeholder="0"
                                keyboardType="numeric"
                                value={set.reps}
                                onChangeText={(text) => updateSet(exercise.id, setIndex, 'reps', text)}
                            />
                        </View>
                    ))}

                    <TouchableOpacity 
                        onPress={() => addSet(exercise.id)}
                        className="items-center py-2 mt-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg active:bg-slate-200"
                    >
                        <Text className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">+ Add Set</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity 
                onPress={addExercise}
                className="flex-row items-center justify-center p-4 border-2 border-dashed border-primary/50 bg-primary/5 rounded-xl mb-10"
            >
                <MaterialIcons name="add" size={24} color="#0df259" />
                <Text className="text-primary font-bold ml-2">Add Exercise</Text>
            </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
