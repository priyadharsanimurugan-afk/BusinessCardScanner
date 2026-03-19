import { Stack, useRouter, useSegments, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { getAccessToken, deleteTokens } from "@/utils/tokenStorage";
import { CardProvider } from "@/components/store/useCardStore";
import { SafeAreaView } from "react-native-safe-area-context";
import FloatingMenu from "./FloatingMenu";
import { MenuVisibilityProvider, useMenuVisibility } from "@/context/MenuVisibilityContext";
import { setLogoutHandler } from "@/utils/logout";

function LayoutContent() {
  const { isMenuVisible } = useMenuVisibility();
  const router = useRouter();
  const segments = useSegments();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await getAccessToken();

      const inAuthGroup = segments[0] === "login";

      if (!token && !inAuthGroup) {
        router.replace("/login");
      } else if (token && inAuthGroup) {
        router.replace("/(tabs)/dashboard");
      }

      setLoading(false);
    };

    checkLogin();
  }, [segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ backgroundColor: "#131C30" }} edges={["top"]} />
      <StatusBar style="light" translucent />
      <Stack screenOptions={{ headerShown: false }} />

      {isMenuVisible && <FloatingMenu />}
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // ✅ REGISTER GLOBAL LOGOUT HANDLER
    setLogoutHandler(async () => {
      await deleteTokens();
      router.replace("/login");
    });
  }, []);

  return (
    <CardProvider>
      <MenuVisibilityProvider>
        <LayoutContent />
      </MenuVisibilityProvider>
    </CardProvider>
  );
}
