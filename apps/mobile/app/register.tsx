
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../src/services/api.client';

import { getStoredItem, setStoredItem } from '../src/services/storage';

/** Build profile payload from onboarding params for PUT /identity/profile */
function buildProfilePayload(params: Record<string, string | undefined>) {
  const age = params.age ? Number(params.age) : undefined;
  const weight = params.weight ? Number(params.weight) : undefined;
  const height = params.height ? Number(params.height) : undefined;
  const goals = params.selectedTags ? params.selectedTags.split(',') : [];

  let mealPreferences: Record<string, Record<number, string>> | undefined;
  if (params.weeklyPlan) {
    try {
      mealPreferences = JSON.parse(params.weeklyPlan);
    } catch {
      mealPreferences = undefined;
    }
  }

  return {
    age,
    weight,
    height,
    goals,
    measurementSystem: (params.unitSystem as 'metric' | 'imperial') || 'metric',
    dietaryPreference: params.dietType,
    mealPreferences,
  };
}

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Create account
      await apiClient.post('/identity/register', { email, password });
      
      // 2. Auto-login to get the token
      const loginResponse = await apiClient.post('/auth/login', { email, password });
      const { accessToken } = loginResponse.data;
      if (accessToken) {
        await setStoredItem('user_token', accessToken);
      }

      // 3. If from onboarding, put profile data and redirect to contract
      if (params.fromOnboarding === 'true') {
        const payload = buildProfilePayload(params as unknown as Record<string, string | undefined>);
        try {
          await apiClient.put('/identity/profile', payload);
        } catch (e) {
          console.warn('Failed to put profile', e);
        }
        router.replace({ pathname: '/onboarding/step-contract', params: { ...params } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const devEmail = `dev-${Date.now()}@habixa.ai`;
      await apiClient.post('/identity/register', { email: devEmail, password: 'password' });
      const loginResponse = await apiClient.post('/auth/login', { email: devEmail, password: 'password' });
      const { accessToken } = loginResponse.data;
      if (accessToken) {
        await setStoredItem('user_token', accessToken);
      }
      const isFromOnboarding = params.fromOnboarding === 'true';
      let cachedParams: any = null;

      if (isFromOnboarding) {
        await setStoredItem('dev_onboarding_cache', JSON.stringify(params));
        cachedParams = { ...params };
      } else {
        const cacheStr = await getStoredItem('dev_onboarding_cache');
        if (cacheStr) {
          try { cachedParams = JSON.parse(cacheStr); } catch (e) {}
        }
      }

      if (cachedParams && Object.keys(cachedParams).length > 0) {
        const payload = buildProfilePayload(cachedParams as any);
        try {
          await apiClient.put('/identity/profile', payload);
        } catch (e) {
          console.warn('Failed to put profile', e);
        }
        router.replace({ pathname: '/onboarding/step-contract', params: cachedParams });
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Dev login failed';
      Alert.alert('Dev Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          
          {/* Top Bar */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <MaterialIcons name="arrow-back-ios" size={24} color="#E0E0E0" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-[#E0E0E0]">{t('auth.signUp')}</Text>
            <View className="w-11" />
          </View>

          {/* Header */}
          <View className="items-center mt-5 mb-8 px-6">
            <Text className="text-3xl font-bold text-[#E0E0E0] text-center mb-2">Create Account</Text>
            {params.fromOnboarding === 'true' ? (
              <Text className="text-sm text-[#0df259]/80 text-center">Your custom plan is ready! Create a free account to save it and start.</Text>
            ) : (
              <Text className="text-sm text-[#0df259]/80 text-center">Join the journey today.</Text>
            )}
          </View>

          {/* Form */}
          <View className="px-6 gap-5">
            
            {/* Email */}
            <View className="gap-2">
              <Text className="text-white/70 text-sm font-medium ml-1">{t('auth.email')}</Text>
              <TextInput
                className="h-14 rounded-xl border border-[#316843] bg-[#183422]/60 px-4 text-[#E0E0E0] text-base"
                placeholder="email@habixa.ai"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View className="gap-2">
              <Text className="text-white/70 text-sm font-medium ml-1">{t('auth.password')}</Text>
              <View className="flex-row h-14 rounded-xl border border-[#316843] bg-[#183422]/60 items-center transition-all">
                <TextInput
                  className="flex-1 px-4 text-[#E0E0E0] text-base h-full"
                  placeholder={t('auth.password')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
                  className="p-3 mr-1"
                >
                  <MaterialIcons 
                    name={isPasswordVisible ? "visibility" : "visibility-off"} 
                    size={24} 
                    color="rgba(255,255,255,0.5)" 
                  />
                </TouchableOpacity>
              </View>
            </View>

             {/* Confirm Password */}
             <View className="gap-2">
              <Text className="text-white/70 text-sm font-medium ml-1">Confirm Password</Text>
              <View className="flex-row h-14 rounded-xl border border-[#316843] bg-[#183422]/60 items-center transition-all">
                <TextInput
                  className="flex-1 px-4 text-[#E0E0E0] text-base h-full"
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!isPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              className={`h-14 bg-primary rounded-xl flex-row items-center justify-center mt-5 gap-2 shadow-lg shadow-primary/40 active:scale-95 transition-transform ${loading ? 'opacity-80' : ''}`} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text className="text-background-dark text-lg font-bold">
                {loading ? t('common.loading') : t('auth.signUp')}
              </Text>
              {!loading && <MaterialIcons name="person-add" size={24} color="#102216" />}
            </TouchableOpacity>

            {/* Dev Mode Button */}
            <TouchableOpacity 
              className={`h-14 bg-[#183422] rounded-xl flex-row items-center justify-center mt-2 gap-2 border border-[#0df259]/30 active:scale-95 transition-transform ${loading ? 'opacity-80' : ''}`} 
              onPress={handleDevLogin}
              disabled={loading}
            >
              <Text className="text-[#0df259] text-lg font-bold">
                {loading ? '...' : 'Continuar Modo Dev'}
              </Text>
              {!loading && <MaterialIcons name="developer-mode" size={24} color="#0df259" />}
            </TouchableOpacity>

          </View>

          {/* Social Divider */}
          <View className="flex-row items-center my-8 px-6">
            <View className="flex-1 h-[1px] bg-white/10" />
            <Text className="text-white/40 text-xs font-semibold uppercase mx-4 tracking-widest">{t('auth.continueWith', 'OR CONTINUE WITH')}</Text>
            <View className="flex-1 h-[1px] bg-white/10" />
          </View>

          {/* Social Icons */}
          <View className="flex-row justify-center gap-6 mb-10">
            <TouchableOpacity className="w-14 h-14 rounded-full bg-white/5 border border-white/10 items-center justify-center active:bg-white/10" onPress={() => Alert.alert('Apple Sign In')}>
              <FontAwesome name="apple" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="w-14 h-14 rounded-full bg-white/5 border border-white/10 items-center justify-center active:bg-white/10" onPress={() => Alert.alert('Google Sign In')}>
              <FontAwesome name="google" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-10 mb-5">
            <Text className="text-white/50 text-sm">{t('auth.hasAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text className="text-primary text-sm font-bold">{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
