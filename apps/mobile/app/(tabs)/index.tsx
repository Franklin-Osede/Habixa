/**
 * Home tab: Saga Map (Phase 1 – Duolingo for Fitness).
 * Preserves bottom nav for Workouts, Nutrition, Profile.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Brand } from '@/constants/theme';
import { TodayPlanDashboard } from '@/src/components/plan/TodayPlanDashboard';

export default function HomeTab() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, paddingBottom: 96, backgroundColor: Brand.bgDark }}>
      <TodayPlanDashboard />

      {/* Custom Bottom Navigation */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 96,
          zIndex: 50,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: -28,
            left: '50%',
            marginLeft: -36,
            zIndex: 60,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            style={{
              width: 72,
              height: 56,
              backgroundColor: Brand.accent,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              shadowColor: Brand.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
            activeOpacity={0.9}
            onPress={() => router.push('/coach' as never)}
            accessibilityLabel={t('coach.openCoach')}
          >
            <MaterialIcons name="chat-bubble" size={20} color={Brand.accentInk} />
            <Text
              style={{
                color: Brand.accentInk,
                fontWeight: '800',
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {t('coach.tabLabel')}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(16, 34, 22, 0.95)',
            borderTopWidth: 1,
            borderTopColor: Brand.border,
            flexDirection: 'row',
            paddingTop: 12,
            justifyContent: 'space-around',
            paddingHorizontal: 8,
          }}
        >
          <NavButton
            icon="home"
            label={t('tabs.home')}
            active
            onPress={() => router.push('/(tabs)')}
          />
          <NavButton
            icon="map"
            label={t('tabs.ruta')}
            onPress={() => router.push('/(tabs)/ruta' as never)}
          />

          <View style={{ width: 72 }} />

          <NavButton
            icon="restaurant-menu"
            label={t('tabs.nutrition')}
            onPress={() => router.push('/nutrition' as never)}
          />
          <NavButton
            icon="person"
            label={t('tabs.profile')}
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>

        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            marginLeft: -64,
            width: 128,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

function NavButton({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const color = active ? Brand.accent : Brand.textDim;
  return (
    <TouchableOpacity
      style={{ flex: 1, alignItems: 'center', gap: 4 }}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <MaterialIcons name={icon} size={26} color={color} />
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
