/**
 * Home tab: Saga Map (Phase 1 – Duolingo for Fitness).
 * Preserves bottom nav for Workouts, Profile, etc.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MapScreen } from '@/src/features/saga-map/screens/MapScreen';
import { ChallengeDashboard } from '@/components/challenge/ChallengeDashboard';

export default function HomeTab() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <MapScreen />
      <ChallengeDashboard />

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
            top: -24,
            left: '50%',
            marginLeft: -28,
            zIndex: 60,
          }}
        >
          <TouchableOpacity
            style={{
              width: 56,
              height: 56,
              backgroundColor: '#0df259',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0df259',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
            activeOpacity={0.9}
          >
            <MaterialIcons name="add" size={32} color="#0a1a0f" style={{ transform: [{ rotate: '-45deg' }] }} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(16, 34, 22, 0.95)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
            flexDirection: 'row',
            paddingTop: 12,
            justifyContent: 'space-around',
            paddingHorizontal: 8,
          }}
        >
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', gap: 4 }} onPress={() => router.push('/(tabs)')}>
            <MaterialIcons name="home" size={28} color="#0df259" />
            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#0df259' }}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1, alignItems: 'center', gap: 4 }} onPress={() => router.push('/workouts')}>
            <MaterialIcons name="fitness-center" size={28} color="rgba(255,255,255,0.4)" />
            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Workouts</Text>
          </TouchableOpacity>

          <View style={{ width: 56 }} />

          <TouchableOpacity style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="restaurant-menu" size={28} color="rgba(255,255,255,0.4)" />
            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Nutrition</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1, alignItems: 'center', gap: 4 }} onPress={() => router.push('/(tabs)/profile')}>
            <MaterialIcons name="person" size={28} color="rgba(255,255,255,0.4)" />
            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Profile</Text>
          </TouchableOpacity>
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
