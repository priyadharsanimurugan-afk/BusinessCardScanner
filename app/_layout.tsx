// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { CardProvider } from '@/components/store/useCardStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingMenu from './FloatingMenu';
import { MenuVisibilityProvider, useMenuVisibility } from '@/context/MenuVisibilityContext';


function LayoutContent() {
  const { isMenuVisible } = useMenuVisibility();
  
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: '#131C30' }} edges={['top']} />
      <StatusBar style="light" translucent />
      <Stack screenOptions={{ headerShown: false }} />

      {/* Floating Menu - hidden when menu visibility is false */}
      {isMenuVisible && <FloatingMenu />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <CardProvider>
      <MenuVisibilityProvider>
        <LayoutContent />
      </MenuVisibilityProvider>
    </CardProvider>
  );
}