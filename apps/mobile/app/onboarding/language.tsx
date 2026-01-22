
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState('en');

  const languages = [
    { id: 'en', name: 'English', flag: '🇬', flagEmoji: '🇬🇧' }, // Using emojis as placeholder for flags if images fail
    { id: 'es', name: 'Español', flag: '🇪', flagEmoji: '🇪🇸' },
    { id: 'de', name: 'Deutsch', flag: '🇩', flagEmoji: '🇩🇪' },
    { id: 'fr', name: 'Français', flag: '🇫', flagEmoji: '🇫🇷' },
  ];

  const handleContinue = () => {
    // Save language preference here
    router.push('/login'); // Proceed to Auth or Onboarding
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <StatusBar style="auto" />
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
            <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
                <MaterialIcons name="arrow-back-ios" size={20} color="#E0E0E0" />
            </TouchableOpacity>
            <Text className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white flex-1 text-center">Select Language</Text>
            <View className="h-10 w-10" />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 128 }}>
            <View className="px-6 pt-4">
                {/* Icon */}
                <View className="items-center mb-8">
                    <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
                        <MaterialIcons name="language" size={32} color="#0df259" />
                    </View>
                </View>

                {/* Headline */}
                <View className="items-center mb-10">
                    <Text className="text-2xl font-bold text-center text-slate-900 dark:text-white leading-tight">
                        How would you like to experience Habixa?
                    </Text>
                    <Text className="text-slate-500 dark:text-[#90cba4] text-sm text-center mt-3 font-normal">
                        Choose your preferred language for the AI coaching and tracking tools.
                    </Text>
                </View>

                {/* Language Options */}
                <View className="gap-4">
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.id}
                            onPress={() => setSelectedLang(lang.id)}
                            className={`flex-row items-center p-5 rounded-xl border transition-all ${
                                selectedLang === lang.id 
                                ? 'border-2 border-primary bg-primary/5 shadow-[0_0_15px_rgba(13,242,89,0.2)]' // Neon glow
                                : 'border-slate-200 dark:border-[#316843] bg-white dark:bg-[#162b1d]/40'
                            }`}
                        >
                            {/* Flag Placeholder - Replace with Image if needed */}
                            <View className="h-10 w-10 rounded-full bg-slate-200 items-center justify-center overflow-hidden border border-white/20 mr-4">
                                <Text className="text-2xl">{lang.flagEmoji}</Text>
                            </View>

                            <View className="flex-1">
                                <Text className={`text-base ${selectedLang === lang.id ? 'font-bold' : 'font-medium'} text-slate-900 dark:text-white`}>
                                    {lang.name}
                                </Text>
                                {selectedLang === lang.id && (
                                    <Text className="text-primary text-xs font-medium tracking-wide mt-0.5">Selected</Text>
                                )}
                            </View>

                            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                                selectedLang === lang.id ? 'border-primary' : 'border-slate-300 dark:border-[#316843]'
                            }`}>
                                {selectedLang === lang.id && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>

        {/* Footer */}
         <View className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent">
             <TouchableOpacity 
                onPress={handleContinue}
                className="w-full h-14 bg-primary rounded-xl items-center justify-center shadow-[0_0_10px_rgba(13,242,89,0.3)] active:scale-[0.98]"
            >
                <Text className="text-[#102216] text-base font-bold uppercase tracking-wider">Continue</Text>
             </TouchableOpacity>
         </View>
    </SafeAreaView>
  );
}
