// app/_layout.tsx

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { CardProvider } from '@/components/store/useCardStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <CardProvider>
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ backgroundColor: '#131C30' }} edges={['top']} />
        <StatusBar style="light" translucent />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </CardProvider>
  );
}
