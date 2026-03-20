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
import { loginStyles } from "@/components/styles/loginStyles";
import { colors } from "@/constants/colors";
import { useMenuVisibility } from "@/context/MenuVisibilityContext";
import { resetPasswordUser, resendResetCode } from "@/services/auth";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isLargeScreen = isDesktop || isTablet;

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { setMenuVisible } = useMenuVisibility();
  useEffect(() => {
    setMenuVisible(false);
    return () => { setMenuVisible(true); };
  }, [setMenuVisible]);

  const handleReset = async () => {
    if (!code) { alert("Enter verification code"); return; }
    if (password !== confirmPass) { alert("Passwords do not match"); return; }

    try {
      setLoading(true);
      await resetPasswordUser({ email: String(email), code, newPassword: password });
      alert("Password reset successful ✅");
      router.replace("/login");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      await resendResetCode({ email: String(email) });
      alert("Reset code resent to your email 📧");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
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
          <Icon name="lock-closed-outline" size={isDesktop ? 22 : 18} color={colors.navy} />
        </View>
        <View>
          <Text style={loginStyles.brandName}>Reset Password</Text>
          <Text style={loginStyles.brandTag}>Secure your CardScan account</Text>
        </View>
      </View>

      <Text style={loginStyles.heroTitle}>Create new password</Text>
      <Text style={loginStyles.heroSub}>Enter the code sent to your email</Text>
      <Text style={{ color: colors.amber, fontWeight: "700", marginTop: 4, fontSize: isDesktop ? 15 : 13 }}>
        {email}
      </Text>

      {/* Decorative info block for desktop */}
      {isDesktop && (
        <View style={{ marginTop: 40, gap: 16 }}>
          {[
            { icon: "key-outline", text: "Check your email for the reset code" },
            { icon: "lock-open-outline", text: "Choose a strong new password" },
            { icon: "shield-checkmark-outline", text: "Your data is encrypted & safe" },
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

      {/* CODE */}
      <View style={loginStyles.inputGroup}>
        <Text style={loginStyles.label}>Verification Code</Text>
        <View style={loginStyles.inputWrap}>
          <Icon name="key-outline" size={16} color={colors.muted} style={loginStyles.inputIcon} />
          <TextInput
            style={loginStyles.input}
            placeholder="Enter code"
            placeholderTextColor={colors.inputPlaceholder}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* NEW PASSWORD */}
      <View style={loginStyles.inputGroup}>
        <Text style={loginStyles.label}>New Password</Text>
        <View style={loginStyles.inputWrap}>
          <Icon name="lock-closed-outline" size={16} color={colors.muted} style={loginStyles.inputIcon} />
          <TextInput
            style={loginStyles.input}
            placeholder="Enter new password"
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {/* Resend Code */}
        <TouchableOpacity
          style={{ alignSelf: "flex-end", marginTop: 6 }}
          onPress={handleResendCode}
          disabled={resendLoading}
        >
          <Text style={{ color: colors.amber, fontWeight: "600", fontSize: 12 }}>
            {resendLoading ? "Sending..." : "Resend Code"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONFIRM PASSWORD */}
      <View style={loginStyles.inputGroup}>
        <Text style={loginStyles.label}>Confirm Password</Text>
        <View style={loginStyles.inputWrap}>
          <Icon name="shield-checkmark-outline" size={16} color={colors.muted} style={loginStyles.inputIcon} />
          <TextInput
            style={loginStyles.input}
            placeholder="Confirm password"
            placeholderTextColor={colors.inputPlaceholder}
            secureTextEntry
            value={confirmPass}
            onChangeText={setConfirmPass}
          />
        </View>
      </View>

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={loginStyles.btn} onPress={handleReset} disabled={loading}>
        <Icon name={loading ? "refresh-outline" : "lock-open-outline"} size={18} color={colors.navy} />
        <Text style={loginStyles.btnText}>{loading ? "Resetting..." : "Reset Password"}</Text>
      </TouchableOpacity>

      {/* BACK */}
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
              Reset your password
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