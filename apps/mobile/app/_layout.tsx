import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import '../global.css';
import '../i18n';

// Force dark green background immediately on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Run immediately
  (function() {
      document.body.style.backgroundColor = '#15241a';
      document.body.style.color = '#ffffff';
      const root = document.getElementById('root');
      if (root) {
        root.style.backgroundColor = '#15241a';
        root.style.color = '#ffffff';
      }
  })();
  
  // Also run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.style.backgroundColor = '#15241a';
      document.body.style.color = '#ffffff';
      const root = document.getElementById('root');
      if (root) {
        root.style.backgroundColor = '#15241a';
        root.style.color = '#ffffff';
      }
    });
  }
}

export const unstable_settings = {
  anchor: '(tabs)',
};

// Custom green theme that forces dark green background
const HabixaTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#0df259',
    background: '#15241a',
    card: '#102216',
    text: '#ffffff',
    border: '#316843',
    notification: '#0df259',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={HabixaTheme}>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: '#102216',
        },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen 
          name="onboarding/language" 
          options={{ 
            headerShown: false,
            contentStyle: {
              backgroundColor: '#102216',
            },
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
