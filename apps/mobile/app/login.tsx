import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../src/services/api.client';

import { useAuth } from '../src/services/auth/AuthContext';


export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const params = useLocalSearchParams();
  const sessionExpired = params.expired === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });

      const { accessToken, refreshToken } = response.data;
      if (accessToken && refreshToken) {
        await signIn({ accessToken, refreshToken });
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
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
      const response = await apiClient.post('/auth/login', { email: devEmail, password: 'password' });

      const { accessToken, refreshToken } = response.data;
      if (accessToken && refreshToken) {
        await signIn({ accessToken, refreshToken });
        // A fresh dev user has no plan yet — go through plan generation so the
        // home lands on a real plan instead of the empty "set up your plan" state.
        router.replace('/onboarding/building-plan');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Dev Login failed';
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
          <View className="w-full max-w-md self-center flex-1">
            {/* Top Bar */}
            <View className="flex-row items-center justify-between px-4 py-3">
              <TouchableOpacity onPress={() => router.back()} className="p-2">
                <MaterialIcons name="arrow-back-ios" size={24} color="#E0E0E0" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-[#E0E0E0]">{t('auth.signIn')}</Text>
              <View className="w-11" />
            </View>

            {/* Brand Icon */}
            <View className="items-center mt-5 mb-8">
              <View className="w-20 h-20 rounded-full bg-[#0df259]/20 items-center justify-center border border-[#0df259]/40 shadow-lg shadow-primary/50">
                <MaterialIcons name="eco" size={48} color="#0df259" />
              </View>
            </View>

            {/* Headlines */}
            <View className="items-center mb-8 px-6">
              <Text className="text-3xl font-bold text-[#E0E0E0] text-center mb-2">{t('auth.welcomeBack')}</Text>
              <Text className="text-sm text-[#0df259]/80 text-center">{t('auth.coachWaiting')}</Text>
            </View>

            {/* Session-expired notice (redirected here by the auth guard) */}
            {sessionExpired && (
              <View className="mx-6 mb-6 px-4 py-3 rounded-xl bg-[#3a2a12] border border-[#f2a60d]/40 flex-row items-center gap-2">
                <MaterialIcons name="info-outline" size={20} color="#f2a60d" />
                <Text className="text-[#f2c67d] text-sm flex-1">
                  {t('auth.sessionExpired', 'Your session expired. Please sign in again.')}
                </Text>
              </View>
            )}

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
                <View className="flex-row justify-between items-center px-1">
                  <Text className="text-white/70 text-sm font-medium">{t('auth.password')}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('TODO', 'Forgot Password Flow')}>
                    <Text className="text-[#0df259] text-xs font-semibold">{t('auth.forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons 
                      name={isPasswordVisible ? "visibility" : "visibility-off"} 
                      size={24} 
                      color="rgba(255,255,255,0.5)" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                className={`h-14 bg-primary rounded-xl flex-row items-center justify-center mt-5 gap-2 shadow-lg shadow-primary/40 active:scale-95 transition-transform ${loading ? 'opacity-80' : ''}`} 
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text className="text-background-dark text-lg font-bold">
                  {loading ? t('common.loading') : t('auth.signIn')}
                </Text>
                {!loading && <MaterialIcons name="bolt" size={24} color="#102216" />}
              </TouchableOpacity>

              {/* Dev Mode Button */}
              <TouchableOpacity 
                className={`h-14 bg-[#183422] rounded-xl flex-row items-center justify-center mt-2 gap-2 border border-[#0df259]/30 active:scale-95 transition-transform ${loading ? 'opacity-80' : ''}`} 
                onPress={handleDevLogin}
                disabled={loading}
                activeOpacity={0.8}
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
              <Text className="text-white/40 text-xs font-semibold uppercase mx-4 tracking-widest">{t('auth.continueWith')}</Text>
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
            <View className="flex-row justify-center mb-5">
              <Text className="text-white/50 text-sm">{t('auth.noAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text className="text-primary text-sm font-bold">{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
