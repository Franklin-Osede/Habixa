
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingStep1() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // State
  const [mainQuest, setMainQuest] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  
  // Values
  const [age] = useState(28);
  const [weight] = useState(74.5);
  const [height] = useState(182);

  const tags = ['Lose Weight', 'Build Muscle', 'Energy', 'Mindfulness'];

  const handleNext = () => {
    // Navigate to next step with params or store in context
    router.push({
      pathname: '/onboarding/step2',
      params: { 
        mainQuest,
        selectedTag, 
        unitSystem, 
        age, 
        weight, 
        height 
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 160 }}>
        <View className="relative flex w-full flex-col max-w-[430px] mx-auto overflow-hidden">
          
          {/* TopAppBar */}
          <View className="flex-row items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
            <TouchableOpacity onPress={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <MaterialIcons name="arrow-back-ios" size={20} color="white" />
            </TouchableOpacity>
            
            <View className="flex-col items-center">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest leading-tight">Step 1 of 3</Text>
              <View className="mt-1 h-1 w-24 rounded-full bg-primary/20 overflow-hidden">
                <View className="h-full bg-primary w-1/3 rounded-full" />
              </View>
            </View>
            
            <View className="h-10 w-10" />
          </View>

          {/* Headline */}
          <View className="px-6 pt-8">
            <Text className="text-white text-[40px] font-bold leading-[1.1] text-left">
              {t('onboarding.step1.title', 'What is your')} {'\n'}
              <Text className="text-primary italic">{t('onboarding.step1.subtitle', 'main quest?')}</Text>
            </Text>
          </View>

          {/* Text Field */}
          <View className="px-6 py-6">
            <View className="flex flex-col w-full">
              <Text className="text-white/50 text-xs font-bold uppercase tracking-widest pb-3">
                {t('onboarding.step1.label_purpose', 'Define your purpose')}
              </Text>
              <View className="flex-row w-full items-center rounded-xl bg-[#183422] border border-primary/30 h-16 px-5 transition-all">
                <TextInput 
                  className="flex-1 text-white text-lg font-medium placeholder:text-primary/40 h-full"
                  placeholder={t('onboarding.step1.placeholder', 'I want to...')}
                  placeholderTextColor="rgba(13, 242, 89, 0.4)"
                  value={mainQuest}
                  onChangeText={setMainQuest}
                />
                <MaterialIcons name="flare" size={24} color="#0df259" />
              </View>
            </View>
          </View>

          {/* Chips */}
          <View className="px-6 pb-8">
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <TouchableOpacity 
                  key={tag}
                  onPress={() => setSelectedTag(tag)}
                  className={`h-10 items-center justify-center rounded-full px-5 border ${selectedTag === tag ? 'bg-primary border-primary' : 'bg-white/5 border-primary/30'}`}
                >
                  <Text className={`text-sm font-medium ${selectedTag === tag ? 'text-background-dark font-bold' : 'text-white'}`}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Biometrics */}
          <View className="px-6 space-y-8 gap-6">
            {/* Units Toggle */}
            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-bold uppercase tracking-widest">
                {t('common.units', 'Units')}
              </Text>
              <View className="flex-row bg-white/5 p-1 rounded-lg border border-white/10">
                <TouchableOpacity 
                  onPress={() => setUnitSystem('metric')}
                  className={`px-4 py-1.5 rounded-md ${unitSystem === 'metric' ? 'bg-primary' : 'bg-transparent'}`}
                >
                  <Text className={`text-xs font-bold ${unitSystem === 'metric' ? 'text-background-dark' : 'text-white/60'}`}>Metric</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setUnitSystem('imperial')}
                  className={`px-4 py-1.5 rounded-md ${unitSystem === 'imperial' ? 'bg-primary' : 'bg-transparent'}`}
                >
                   <Text className={`text-xs font-bold ${unitSystem === 'imperial' ? 'text-background-dark' : 'text-white/60'}`}>Imperial</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Simulating Sliders (Static for now, can implement PanGesture later) */}
            
            {/* Age */}
            <View className="space-y-4 gap-4">
              <View className="flex-row justify-between items-end">
                <Text className="text-white/50 text-xs font-bold uppercase tracking-widest">{t('onboarding.step1.age', 'Age')}</Text>
                <Text className="text-2xl font-bold text-primary">{age} <Text className="text-sm text-white/40 font-normal">yrs</Text></Text>
              </View>
              {/* Mock Ruler Visual */}
              <View className="h-16 w-full items-center justify-center overflow-hidden relative">
                 <View className="absolute inset-0 items-center justify-center z-10 pointer-events-none">
                    <View className="w-1 h-12 bg-primary rounded-full shadow-lg shadow-primary/50" />
                 </View>
                 <View className="flex-row gap-4 items-end pb-2 opacity-40">
                    <View className="items-center gap-1"><View className="w-0.5 h-4 bg-white"/><Text className="text-white text-[10px]">25</Text></View>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="items-center gap-1"><View className="w-0.5 h-8 bg-primary"/><Text className="text-primary text-[10px]">30</Text></View>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="items-center gap-1"><View className="w-0.5 h-4 bg-white"/><Text className="text-white text-[10px]">35</Text></View>
                 </View>
              </View>
            </View>

             {/* Weight */}
             <View className="space-y-4 gap-4">
              <View className="flex-row justify-between items-end">
                <Text className="text-white/50 text-xs font-bold uppercase tracking-widest">{t('onboarding.step1.weight', 'Weight')}</Text>
                <Text className="text-2xl font-bold text-primary">{weight} <Text className="text-sm text-white/40 font-normal">kg</Text></Text>
              </View>
              <View className="h-16 w-full items-center justify-center overflow-hidden relative">
                 <View className="absolute inset-0 items-center justify-center z-10 pointer-events-none">
                    <View className="w-1 h-12 bg-primary rounded-full shadow-lg shadow-primary/50" />
                 </View>
                 <View className="flex-row gap-3 items-end pb-2 opacity-40">
                    <View className="items-center gap-1"><View className="w-0.5 h-4 bg-white"/><Text className="text-white text-[10px]">70</Text></View>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="items-center gap-1"><View className="w-0.5 h-8 bg-primary"/><Text className="text-primary text-[10px]">75</Text></View>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="items-center gap-1"><View className="w-0.5 h-4 bg-white"/><Text className="text-white text-[10px]">80</Text></View>
                 </View>
              </View>
            </View>

            {/* Height */}
            <View className="space-y-4 gap-4">
              <View className="flex-row justify-between items-end">
                <Text className="text-white/50 text-xs font-bold uppercase tracking-widest">{t('onboarding.step1.height', 'Height')}</Text>
                <Text className="text-2xl font-bold text-primary">{height} <Text className="text-sm text-white/40 font-normal">cm</Text></Text>
              </View>
              <View className="h-16 w-full items-center justify-center overflow-hidden relative">
                 <View className="absolute inset-0 items-center justify-center z-10 pointer-events-none">
                    <View className="w-1 h-12 bg-primary rounded-full shadow-lg shadow-primary/50" />
                 </View>
                 <View className="flex-row gap-4 items-end pb-2 opacity-40">
                    <View className="items-center gap-1"><View className="w-0.5 h-4 bg-white"/><Text className="text-white text-[10px]">175</Text></View>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="items-center gap-1"><View className="w-0.5 h-8 bg-primary"/><Text className="text-primary text-[10px]">180</Text></View>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="w-0.5 h-2 bg-white/40"/>
                    <View className="items-center gap-1"><View className="w-0.5 h-4 bg-white"/><Text className="text-white text-[10px]">185</Text></View>
                 </View>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 pt-12">
        <TouchableOpacity 
            onPress={handleNext}
            className="w-full flex-row h-16 items-center justify-between rounded-xl bg-primary px-6 shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <Text className="text-lg font-bold tracking-tight text-background-dark">
            {t('onboarding.next', 'Next')}: {t('onboarding.step2.title_short', 'The Audit')}
          </Text>
          <MaterialIcons name="arrow-forward" size={24} color="#102216" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
