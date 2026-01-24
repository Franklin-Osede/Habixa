import React, { useState } from 'react';
import { View, Text, TouchableOpacity,  StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';

export default function OnboardingStep6() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock function to simulate health permission request
  const handleSync = () => {
    setIsSyncing(true);
    // In a real app, this would be: await HealthKit.requestPermissions(...)
    setTimeout(() => {
      setIsSyncing(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const FeatureRow = ({ icon, label, sub }: { icon: string, label: string, sub: string }) => (
      <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
              <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
          </View>
          <View style={styles.featureText}>
              <Text style={styles.featureLabel}>{label}</Text>
              <Text style={styles.featureSub}>{sub}</Text>
          </View>
      </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.content}>
            <View style={styles.iconContainer}>
                <Ionicons name="heart-circle" size={120} color={Colors.primary} />
                <View style={styles.connectedIcon}>
                     <MaterialIcons name="sync" size={32} color={Colors.backgroundDark} />
                </View>
            </View>

            <Text style={styles.headline}>
                Connect to <Text style={styles.headlineAccent}>Health</Text>
            </Text>
            
            <Text style={styles.description}>
                Habixa uses your health data to provide personalized workout and nutrition plans that adapt to your body's needs.
            </Text>

            <View style={styles.features}>
                <FeatureRow 
                    icon="directions-walk" 
                    label="Track Steps" 
                    sub="Auto-log your daily movement."
                />
                <FeatureRow 
                    icon="nights-stay" 
                    label="Sleep Analysis" 
                    sub="Optimize recovery based on rest."
                />
                 <FeatureRow 
                    icon="local-fire-department" 
                    label="Burned Calories" 
                    sub="Adjust nutrition dynamically."
                />
            </View>

        </View>

        <View style={styles.bottomContainer}>
             <TouchableOpacity 
                onPress={handleSync}
                style={styles.syncButton}
                activeOpacity={0.9}
                disabled={isSyncing}
            >
                {isSyncing ? (
                    <Text style={styles.syncButtonText}>Syncing...</Text>
                ) : (
                    <>
                        <Text style={styles.syncButtonText}>Sync Health Data</Text>
                        <MaterialIcons name="check-circle" size={24} color={Colors.backgroundDark} />
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
     position: 'relative',
     marginBottom: 32,
  },
  connectedIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors.primary,
      borderRadius: 20,
      padding: 4,
  },
  headline: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  description: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 48,
      lineHeight: 24,
  },
  features: {
      width: '100%',
      gap: 24,
  },
  featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      padding: 16,
      borderRadius: 16,
  },
  featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(13, 242, 89, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  featureText: {
      flex: 1,
  },
  featureLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  featureSub: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
  },
  bottomContainer: {
    padding: 32,
    width: '100%',
  },
  syncButton: {
    width: '100%',
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.primary,
    gap: 12,
    marginBottom: 16,
  },
  syncButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.backgroundDark,
  },
  skipButton: {
      alignItems: 'center',
      padding: 12,
  },
  skipText: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 16,
      fontWeight: '600',
  },
});
