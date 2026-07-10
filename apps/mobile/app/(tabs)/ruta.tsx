import React from 'react';
import { useRouter } from 'expo-router';

import { MapScreen } from '@/src/features/saga-map/screens/MapScreen';

export default function RutaTab() {
  const router = useRouter();
  // The Ruta tab has no bottom nav of its own, so give MapScreen a back
  // affordance — otherwise there is no way out of this screen.
  const handleBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  return <MapScreen onBack={handleBack} />;
}
