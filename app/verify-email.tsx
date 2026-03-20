import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { verifyEmail } from "@/services/auth";
import { loginStyles } from "@/components/styles/loginStyles";
import { colors } from "@/constants/colors";
import { useMenuVisibility } from "@/context/MenuVisibilityContext";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isLargeScreen = isDesktop || isTablet;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const { setMenuVisible } = useMenuVisibility();
  useEffect(() => {
    setMenuVisible(false);
    return () => { setMenuVisible(true); };
  }, [setMenuVisible]);

  const handleVerify = async () => {
    try {
      setLoading(true);
      await verifyEmail({ email: String(email), code });
      alert("Email verified successfully!");
      router.replace("/login");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared Hero Content ────────────────────────────────────────────────────
  const renderHeroContent = () => (
    <>
      <View style={loginStyles.heroGlow} />

      <TouchableOpacity
             style={{ marginBottom: isDesktop ? 32 : 20 ,marginTop: isDesktop ? -100 : 20 }}
        onPress={() => router.replace("/login")}
      >
        <Icon name="arrow-back-outline" size={22} color={colors.white} />
      </TouchableOpacity>

      <View style={loginStyles.brand}>
        <View style={loginStyles.brandIcon}>
          <Icon name="mail-open-outline" size={isDesktop ? 22 : 18} color={colors.navy} />
        </View>
        <View>
          <Text style={loginStyles.brandName}>Verify Email</Text>
          <Text style={loginStyles.brandTag}>Secure your CardScan account</Text>
        </View>
      </View>

      <Text style={loginStyles.heroTitle}>Check your inbox</Text>
      <Text style={loginStyles.heroSub}>Enter the verification code sent to</Text>
      <Text style={{ color: colors.amber, fontWeight: "700", marginTop: 4, fontSize: isDesktop ? 15 : 13 }}>
        {email}
      </Text>

      {/* Decorative info block for desktop */}
      {isDesktop && (
        <View style={{ marginTop: 40, gap: 16 }}>
          {[
            { icon: "shield-checkmark-outline", text: "6-digit code sent to your email" },
            { icon: "time-outline", text: "Code expires in 10 minutes" },
            { icon: "refresh-outline", text: "Didn't get it? Check your spam folder" },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: "rgba(245,159,10,0.15)",
                justifyContent: "center", alignItems: "center",
              }}>
                <Icon name={item.icon} size={18} color={colors.amber} />
              </View>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" }}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  // ── Shared Form Content ────────────────────────────────────────────────────
  const renderFormContent = () => (
    <View style={[loginStyles.card, isDesktop && { marginHorizontal: 0, marginTop: 0 }]}>
      <View style={loginStyles.inputGroup}>
        <Text style={loginStyles.label}>Verification Code</Text>
        <View style={loginStyles.inputWrap}>
          <Icon name="key-outline" size={16} color={colors.muted} style={loginStyles.inputIcon} />
          <TextInput
            style={loginStyles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor={colors.inputPlaceholder}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TouchableOpacity style={loginStyles.btn} onPress={handleVerify} disabled={loading}>
        <Icon name={loading ? "refresh-outline" : "checkmark-circle-outline"} size={18} color={colors.navy} />
        <Text style={loginStyles.btnText}>{loading ? "Verifying..." : "Verify Email"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace("/login")}>
        <Text style={loginStyles.switchLink}>Back to Sign In →</Text>
      </TouchableOpacity>
    </View>
  );

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <SafeAreaView style={[loginStyles.container, { flexDirection: "row" }]} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Left hero panel */}
        <View style={[loginStyles.leftPanel, { flex: 1 }]}>
          {renderHeroContent()}
        </View>

        {/* Right form panel */}
        <View style={loginStyles.rightPanel}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          >
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.navy, marginBottom: 24 }}>
              Enter your code
            </Text>
            {renderFormContent()}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ── TABLET LAYOUT ──────────────────────────────────────────────────────────
  if (isTablet) {
    return (
      <SafeAreaView style={loginStyles.container} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ alignSelf: "center", width: "100%", maxWidth: 680 }}>
            <View style={loginStyles.hero}>{renderHeroContent()}</View>
            {renderFormContent()}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MOBILE LAYOUT (original) ───────────────────────────────────────────────
  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar barStyle="light-content" />
      <View style={loginStyles.hero}>{renderHeroContent()}</View>
      {renderFormContent()}
    </SafeAreaView>
  );
}