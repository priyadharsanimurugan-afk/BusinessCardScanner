import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getAccessToken } from "@/utils/tokenStorage";
import { ActivityIndicator, View, Platform } from "react-native";
import { getIsLoggingOut } from "@/utils/logout";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {

      // 🚨 IMPORTANT: skip during logout
      if (getIsLoggingOut()) {
        return;
      }

      const token = await getAccessToken();

      console.log("TOKEN:", token);

      if (token) {
        router.replace("/(tabs)/dashboard");
      } else {
        // ✅ Web safe redirect
        if (Platform.OS === "web") {
          window.location.href = "/login";
        } else {
          router.replace("/login");
        }
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
