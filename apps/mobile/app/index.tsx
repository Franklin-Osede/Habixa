import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.webContainer}>
      
      {/* Top Bar with Language Toggle */}
      <View style={styles.topBar}>
        <View /> {/* Spacer */}
        <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
          <MaterialIcons name="language" size={20} color={Colors.primary} />
          <Text style={styles.langText}>{i18n.language.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section - Clean, No Mascot */}
      <View style={styles.heroContainer}>
        {/* Glow Effect */}
        <View style={styles.glow} />
        
        {/* Brand Icon (Alternative to Mascot, cleaner) */}
         <View style={styles.brandIcon}>
            <MaterialIcons name="eco" size={80} color={Colors.primary} />
         </View>
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.headline}>
          {t('welcome.headline')}
        </Text>
        <Text style={styles.subheadline}>
          {t('welcome.subheadline')}
        </Text>
      </View>

      {/* Gamification Pills */}
      <View style={styles.pillsContainer}>
        <View style={styles.pill}>
          <MaterialIcons name="local-fire-department" size={16} color={Colors.primary} />
          <Text style={styles.pillText}>{t('welcome.streak')}</Text>
        </View>
        <View style={styles.pill}>
          <MaterialIcons name="psychology" size={16} color={Colors.primary} />
          <Text style={styles.pillText}>{t('welcome.aiPowered')}</Text>
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonTextPrimary}>{t('welcome.getStarted')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonTextSecondary}>{t('welcome.haveAccount')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.legalText}>
          {t('auth.agreeTerms')}
        </Text>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center', // Center the phone frame on desktop
  },
  webContainer: {
    width: Platform.OS === 'web' ? 430 : '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: Platform.OS === 'web' ? 932 : '100%',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    ...(Platform.OS === 'web' ? {
      borderWidth: 1,
      borderColor: '#333',
      borderRadius: 40,
      overflow: 'hidden',
      marginVertical: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
    } : {})
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  langText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(13, 242, 89, 0.1)', // More subtle
  },
  brandIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(13, 242, 89, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 89, 0.2)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  headline: {
    fontFamily: 'System',
    fontWeight: '800',
    fontSize: 42, // Bigger
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 18,
    color: Colors.textDim,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: '80%',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  pillText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22492f',
  },
  buttonTextPrimary: {
    color: Colors.backgroundDark,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextSecondary: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legalText: {
    fontSize: 10,
    color: Colors.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
});
