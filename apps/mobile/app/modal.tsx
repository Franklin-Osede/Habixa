import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

export default function ModalScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const secondaryItems = [
      { icon: 'settings', label: t('menu.secondary.settings'), route: '/settings' },
      { icon: 'help-outline', label: t('menu.secondary.support'), route: '/support' },
  ];

  return (
    <View className="flex-1 bg-background-dark">
      <StatusBar style="light" />
      
      {/* Close Button / Header */}
      <View className="flex-row justify-end p-6 pt-12">
           <TouchableOpacity 
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
           >
               <MaterialIcons name="close" size={24} color="#fff" />
           </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
          
          {/* User Profile */}
          <View className="flex-row items-center mb-10">
              <View className="h-16 w-16 rounded-full border-2 border-primary p-0.5 mr-4">
                  <View className="h-full w-full bg-slate-700 rounded-full items-center justify-center">
                        <MaterialIcons name="person" size={32} color="#fff" />
                  </View>
                   <View className="absolute bottom-0 right-0 h-4 w-4 bg-primary rounded-full border-2 border-background-dark" />
              </View>
              <View>
                  <Text className="text-white text-xl font-bold">{t('menu.profile.title')}</Text>
                  <Text className="text-primary text-xs font-bold uppercase tracking-widest">{t('menu.profile.subtitle')}</Text>
              </View>
          </View>

          {/* Primary Menu */}
          <View className="space-y-2 mb-8">
               {/* Highlighted Item */}
               <TouchableOpacity className="flex-row items-center bg-[#142d1d] p-4 rounded-2xl border border-primary/20 mb-2">
                   <MaterialIcons name="people" size={24} color="#0df259" />
                   <Text className="text-primary font-bold ml-4 text-base flex-1">{t('menu.primary.community')}</Text>
                   <View className="h-2 w-2 rounded-full bg-primary" />
               </TouchableOpacity>

               <TouchableOpacity className="flex-row items-center p-4 rounded-2xl active:bg-white/5">
                   <MaterialCommunityIcons name="bookshelf" size={24} color="rgba(255,255,255,0.6)" />
                   <Text className="text-white/80 font-medium ml-4 text-base">{t('menu.primary.library')}</Text>
               </TouchableOpacity>

               <TouchableOpacity className="flex-row items-center p-4 rounded-2xl active:bg-white/5">
                   <MaterialIcons name="leaderboard" size={24} color="rgba(255,255,255,0.6)" />
                   <Text className="text-white/80 font-medium ml-4 text-base">{t('menu.primary.leaderboards')}</Text>
               </TouchableOpacity>
          </View>

          <View className="h-px w-full bg-white/10 mb-8" />

          {/* Secondary Menu */}
          <View className="space-y-4 mb-12">
               {secondaryItems.map((item, idx) => (
                   <TouchableOpacity key={idx} className="flex-row items-center p-2 rounded-xl active:bg-white/5">
                       <MaterialIcons name={item.icon as any} size={24} color="rgba(255,255,255,0.6)" />
                       <Text className="text-white/80 font-medium ml-4 text-base">{item.label}</Text>
                   </TouchableOpacity>
               ))}
          </View>

          {/* Premium Card */}
          <View className="bg-forest-card rounded-3xl p-6 border border-white/5 relative overflow-hidden mb-8">
                <View className="absolute -right-10 -top-10 opacity-5">
                    <MaterialIcons name="verified" size={150} color="#0df259" />
                </View>
                
                <View className="flex-row items-center gap-2 mb-2">
                    <MaterialIcons name="verified" size={20} color="#0df259" />
                    <Text className="text-white font-bold text-lg">{t('menu.premium.title')}</Text>
                </View>
                <Text className="text-white/60 text-xs mb-4 leading-5">
                    {t('menu.premium.desc')}
                </Text>

                <TouchableOpacity className="bg-primary w-full py-3 rounded-xl items-center shadow-lg shadow-green-500/20">
                     <Text className="text-background-dark font-bold uppercase tracking-wider text-xs">{t('menu.premium.cta')}</Text>
                </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity className="flex-row items-center p-2 mb-10">
               <MaterialIcons name="logout" size={20} color="rgba(255,255,255,0.4)" />
               <Text className="text-white/40 font-bold ml-4 text-sm tracking-widest uppercase">{t('menu.signOut')}</Text>
          </TouchableOpacity>

          <Text className="text-white/20 text-[10px] text-center mb-10 uppercase tracking-widest">{t('menu.version', { version: '2.4.0 • Build 882' })}</Text>

      </ScrollView>
    </View>
  );
}
