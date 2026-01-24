import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Language options with flags
  const languages = [
    { id: 'en', name: 'English', flag: '🇬🇧' },
    { id: 'es', name: 'Español', flag: '🇪🇸' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' },
    { id: 'it', name: 'Italiano', flag: '🇮🇹' },
    { id: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  // Load saved language on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await SecureStore.getItemAsync('user_language');
        if (savedLang) {
          setSelectedLang(savedLang);
          await i18n.changeLanguage(savedLang);
        }
      } catch (error) {
        console.warn('Error loading saved language:', error);
      }
    };
    loadSavedLanguage();
  }, [i18n]);

  // Handle language change
  const handleLanguageChange = async (langId: string) => {
    setSelectedLang(langId);
    await i18n.changeLanguage(langId);
    setShowLanguageDropdown(false);
    try {
      await SecureStore.setItemAsync('user_language', langId);
    } catch (error) {
      console.warn('Error saving language:', error);
    }
  };

  // Navigate directly to onboarding step 1 (skip language screen)
  const handleGetStarted = () => {
    router.push('/onboarding/step1');
  };

  // Get current language info
  const currentLanguage = languages.find(lang => lang.id === selectedLang) || languages[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.webContainer}>
      
      {/* Top Bar with Language Selector */}
      <View style={styles.topBar}>
        <View /> {/* Spacer */}
        <View style={styles.languageContainer}>
          <TouchableOpacity 
            style={styles.langButton} 
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Text style={styles.langFlag}>{currentLanguage.flag}</Text>
            <Text style={styles.langText}>{currentLanguage.id.toUpperCase()}</Text>
            <MaterialIcons 
              name={showLanguageDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
              size={20} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
          
          {/* Dropdown Menu */}
          {showLanguageDropdown && (
            <View style={styles.dropdown}>
              {languages.map((lang) => {
                const isSelected = selectedLang === lang.id;
                return (
                  <TouchableOpacity
                    key={lang.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleLanguageChange(lang.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.dropdownText,
                      isSelected && styles.dropdownTextSelected
                    ]}>
                      {lang.name}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
          onPress={handleGetStarted}
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
    width: Platform.OS === 'web' ? '100%' : '100%', // Use 100% first
    maxWidth: Platform.OS === 'web' ? 430 : '100%', // Limit width only on desktop
    height: '100%',
    // Remove maxHeight restriction that cuts off content
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    ...(Platform.OS === 'web' ? {
      // Only apply "phone frame" styles if screen is large enough (simulating desktop)
      // Otherwise allow full width/height
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: '#333',
      borderRadius: 40,
      overflow: 'hidden',
      height: 900,
      maxHeight: '100%', // Safer than 95vh for types
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
    } : {})
  },
  heroContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  glow: {
    position: 'absolute',
    width: 200, // Reduced from 300
    height: 200, // Reduced from 300
    borderRadius: 100,
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
    marginBottom: 20,
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
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
    zIndex: 100, // Ensure topBar sits above hero content
    position: 'relative',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  langFlag: {
    fontSize: 18,
  },
  langText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  languageContainer: {
    position: 'relative',
    zIndex: 101, // Ensure dropdown container is higher
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: Colors.surface, // Solid background color
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999, // Very high z-index
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14, // Increased touch area
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(13, 242, 89, 0.1)',
  },
  dropdownFlag: {
    fontSize: 20,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  dropdownTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
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
