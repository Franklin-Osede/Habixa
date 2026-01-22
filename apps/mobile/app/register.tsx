
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../src/services/api.client';

export default function RegisterScreen() {
  const router = useRouter();
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
      // POST /identity/register
      await apiClient.post('/identity/register', { email, password });
      
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      Alert.alert(t('common.error'), msg);
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
            <Text className="text-sm text-[#0df259]/80 text-center">Join the journey today.</Text>
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
