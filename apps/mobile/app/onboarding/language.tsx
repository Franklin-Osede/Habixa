import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';



export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState('en');

  const languages = [
    { 
        id: 'en', 
        name: 'English', 
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCo03Sh1UH-SKGb1_JFfpE4RJi1HnDm6d3Sxm3yosPb8jvnw8rRv4PgBMh3iRIGl2RiiL62TevWoxyfHBKvUgCsayQe1qLzb_wQHatxAHMlvgsDQpD2OpiuDDqSL4kFV9HXd_FfBA-PIOzg1N_qxJRLfdezM90dyfkc6mbN0iunH0re0D5L9YhfPFeEF88vwu32F-eD1_hFogLX2iT74RYmVZIV8oKtHsZAMy4HxDKevRyjqY-SxnScLx_isMkJ826bu5zcFn6tVHk' 
    },
    { 
        id: 'es', 
        name: 'Español', 
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2GBte0yd551mbPgcJ_rawT6JOpGyHeS_2rcvO7CWtfrFyvAYLn3DU1QjyW5FMeoRwBmk8x23GiyZva5EWAgaAoNiQQRUl7HVOiq-ihZ8uVfK1VCdmLGJ_LxRTM1IGWFDiFuQmiCn2VrROdVbAEBKRsypU3ySucqNyBmt9UoT1TYp2pL78sRE4vFArwDXZRmq5k-myzMQEH-thZeGfpkHp2BNBv2KHmTCssoQrTEayXZVqvoOYlK3GevJBYdHfbgQQtxwne4gUUro'
    },
    { 
        id: 'de', 
        name: 'Deutsch', 
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEGR1IRyKZNOIdsaKogotgPnniceG0Vj1YgdX5EsYQNsLmeddH8bZplFJR6mVEM37XjytcP206OfRbWwFlUvuVfv2a3aeAsnZJx8e2jAoBUMYUZpUxYlyfGzBJ0p-LTCl_6ycdtVo7l85oouLQUA9SOP-njBfBKW_MACKgbJHtHjrSc2deQFTl3A47im0TjaHQlQCESSSrB9vI23doNqIQd2FQYXxLHtZWbh1326ZLDnx5U-0_xmbI41cAiX6IbckwxmtrZ9mhZHE'
    },
    { 
        id: 'fr', 
        name: 'Français', 
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz3m_rLHHfoLm5XrCWya7XUHcItGRllMCY-3W64QPM-bL7v2Gdjlqy7xTHmhZDCPgUCAb7k3pfJxj2vtDn6Xld1omkDq-amH_ptDbm8hDT6qRUjCCaJgd2d2slCxXa4CW-Yx_b-7joZY4ta3e8yRYyA2Ao1GSK9cIbjFprOw2F1LPuQqYd7otiQtG6vQkqGg8lD0wU07428LxKf-1DWTVL62dPd_6XSnaGImsNMEVHYxswrKKWEVRijaIzjlfMEVDXVxpjOqo7qkg'
    },
    { 
        id: 'pt', 
        name: 'Português', 
        imageUrl: 'https://flagcdn.com/w320/pt.png'
    }
  ];

  const handleContinue = () => {
    router.push('/onboarding/step1'); 
  };

  const isSelected = (langId: string) => selectedLang === langId;

  return (
    <>
      {/* Absolute background layer to force dark green */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#15241a',
        zIndex: 0,
      }} />
      <View style={{ 
        flex: 1, 
        backgroundColor: '#15241a',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
      }} data-onboarding="true">
        <StatusBar style="light" />
        <View style={{ 
          flex: 1, 
          backgroundColor: '#15241a',
          width: '100%',
          height: '100%',
        }}>
        <SafeAreaView style={{ 
          flex: 1, 
          backgroundColor: '#15241a',
          width: '100%',
          height: '100%',
        }} edges={['top']}>
        {/* Top Navigation Bar - Centered layout */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: '#15241a',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(49, 104, 67, 0.3)',
          ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(12px)',
          } : {}),
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            <TouchableOpacity 
              onPress={() => router.push('/')} 
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                backgroundColor: 'transparent',
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back-ios" size={18} color="#ffffff" />
            </TouchableOpacity>
            <Text style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 3.2,
            }}>SELECT LANGUAGE</Text>
          </View>
        </View>

        <ScrollView 
          style={{ 
            flex: 1, 
            backgroundColor: '#15241a',
            width: '100%',
          }}
          contentContainerStyle={{ 
            paddingBottom: 150, 
            paddingHorizontal: 24,
            backgroundColor: '#15241a',
            minHeight: '100%',
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ 
            maxWidth: 430, 
            width: '100%', 
            alignSelf: 'center',
            backgroundColor: '#15241a',
          }}>
            {/* Logo / Decorative Element - Match HTML: size-12 = 48px */}
            <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: 'rgba(13, 242, 89, 0.2)', // bg-primary/20
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(13, 242, 89, 0.3)', // border-primary/30
              }}>
                <MaterialIcons name="language" size={36} color="#0df259" />
              </View>
            </View>

            {/* Headline Section */}
            <View style={{ alignItems: 'center', marginBottom: 40, marginTop: 16, paddingTop: 16 }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 24,
                fontWeight: '700',
                lineHeight: 28,
                textAlign: 'center',
                letterSpacing: -0.5,
              }}>
                How would you like to experience Habixa?
              </Text>
              <Text style={{
                color: '#90cba4',
                fontSize: 14,
                fontWeight: '400',
                textAlign: 'center',
                marginTop: 12,
              }}>
                Choose your preferred language for the AI coaching and tracking tools.
              </Text>
            </View>

            {/* Language Options */}
            <View style={{ width: '100%' }}>
              {languages.map((lang, index) => {
                const selected = isSelected(lang.id);
                return (
                  <TouchableOpacity
                    key={lang.id}
                    onPress={() => setSelectedLang(lang.id)}
                    activeOpacity={0.8}
                    style={{
                      borderRadius: 12,
                      padding: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: selected ? 'rgba(13, 242, 89, 0.05)' : 'rgba(22, 43, 29, 0.4)',
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? '#0df259' : '#316843',
                      marginTop: index > 0 ? 16 : 0,
                      // Match HTML: shadow-neon-strong for selected
                      ...(selected && Platform.OS === 'web' ? {
                        boxShadow: '0 0 15px rgba(13, 242, 89, 0.5), 0 0 30px rgba(13, 242, 89, 0.2)',
                      } : selected ? {
                        shadowColor: '#0df259',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 15,
                        elevation: 8,
                      } : {}),
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}>
                      <Image 
                        source={{ uri: lang.imageUrl }} 
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: selected ? '600' : '500',
                        color: '#ffffff',
                        lineHeight: 20,
                      }}>
                        {lang.name}
                      </Text>
                      {selected && (
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: '#0df259',
                          marginTop: 2,
                          letterSpacing: 1.5,
                        }}>
                          Selected
                        </Text>
                      )}
                    </View>

                    {/* Radio Button */}
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selected ? '#0df259' : '#316843',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selected && <View style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#0df259',
                      }} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 48,
          paddingBottom: 40,
          backgroundColor: '#15241a',
          ...(Platform.OS === 'web' ? {
            background: 'linear-gradient(to top, #102216, transparent)',
          } : {}),
        }}>
          <View style={{ maxWidth: 430, width: '100%', alignSelf: 'center' }}>
            <TouchableOpacity 
              onPress={handleContinue}
              style={{
                width: '100%',
                height: 56,
                backgroundColor: '#0df259',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                // Match HTML: shadow-neon (not shadow-neon-strong)
                ...(Platform.OS === 'web' ? {
                  boxShadow: '0 0 10px rgba(13, 242, 89, 0.3), 0 0 20px rgba(13, 242, 89, 0.1)',
                } : {
                  shadowColor: '#0df259',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 8,
                }),
              }}
              activeOpacity={0.98}
            >
              <Text style={{
                color: '#102216', // Match HTML: text-background-dark
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
                CONTINUE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtle Background Glow */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          marginLeft: -200,
          width: 400,
          height: '50%',
          backgroundColor: 'rgba(13, 242, 89, 0.05)',
          borderRadius: 200,
          opacity: 0.5,
          zIndex: -1,
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          marginLeft: -200,
          width: 400,
          height: '25%',
          backgroundColor: 'rgba(13, 242, 89, 0.05)',
          borderRadius: 200,
          opacity: 0.3,
          zIndex: -1,
        }} />
      </SafeAreaView>
      </View>
    </View>
    </>
  );
}


