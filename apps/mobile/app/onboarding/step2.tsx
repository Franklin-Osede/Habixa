import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function OnboardingStep2() {
  return (
    <View>
      <Stack.Screen options={{ headerShown: false }} />
      <Text>Step 2 Placeholder</Text>
    </View>
  );
}
