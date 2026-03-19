import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StatusBar } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { loginStyles } from "@/components/styles/loginStyles";
import { colors } from "@/constants/colors";
import { useMenuVisibility } from "@/context/MenuVisibilityContext";
import { resetPasswordUser, resendResetCode } from "@/services/auth";


export default function ResetPasswordScreen() {
    const { email } = useLocalSearchParams();

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [loading, setLoading] = useState(false);

    const { setMenuVisible } = useMenuVisibility();


    useEffect(() => {
        setMenuVisible(false);
        return () => {
            setMenuVisible(true);
        };
    }, [setMenuVisible]);

    const handleReset = async () => {
        if (!code) {
            alert("Enter verification code");
            return;
        }

        if (password !== confirmPass) {
            alert("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            await resetPasswordUser({
                email: String(email),
                code: code,
                newPassword: password,
            });

            alert("Password reset successful ✅");

            router.replace("/login");

        } catch (error: any) {
            alert(error?.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    const [resendLoading, setResendLoading] = useState(false);

    const handleResendCode = async () => {
        try {
            setResendLoading(true);

            await resendResetCode({
                email: String(email),
            });

            alert("Reset code resent to your email 📧");

        } catch (error: any) {
            alert(error?.response?.data?.message || "Failed to resend code");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <SafeAreaView style={loginStyles.container}>
            <StatusBar barStyle="light-content" />

            {/* HERO SECTION */}
            <View style={loginStyles.hero}>
                <View style={loginStyles.heroGlow} />

                {/* Back Button */}
                <TouchableOpacity
                    style={{ marginBottom: 20 }}
                    onPress={() => router.replace("/login")}
                >
                    <Icon name="arrow-back-outline" size={22} color={colors.white} />
                </TouchableOpacity>

                <View style={loginStyles.brand}>
                    <View style={loginStyles.brandIcon}>
                        <Icon name="lock-closed-outline" size={18} color={colors.navy} />
                    </View>

                    <View>
                        <Text style={loginStyles.brandName}>Reset Password</Text>
                        <Text style={loginStyles.brandTag}>
                            Secure your CardScan account
                        </Text>
                    </View>
                </View>

                <Text style={loginStyles.heroTitle}>
                    Create new password
                </Text>

                <Text style={loginStyles.heroSub}>
                    Enter the code sent to your email
                </Text>

                <Text style={{ color: colors.amber, fontWeight: "700", marginTop: 4 }}>
                    {email}
                </Text>
            </View>

            {/* CARD */}
            <View style={loginStyles.card}>

                {/* CODE */}
                <View style={loginStyles.inputGroup}>
                    <Text style={loginStyles.label}>Verification Code</Text>

                    <View style={loginStyles.inputWrap}>
                        <Icon
                            name="key-outline"
                            size={16}
                            color={colors.muted}
                            style={loginStyles.inputIcon}
                        />

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
                        <Icon
                            name="lock-closed-outline"
                            size={16}
                            color={colors.muted}
                            style={loginStyles.inputIcon}
                        />

                        <TextInput
                            style={loginStyles.input}
                            placeholder="Enter new password"
                            placeholderTextColor={colors.inputPlaceholder}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                    {/* RESEND CODE */}
                    <TouchableOpacity
                        style={{ alignSelf: "flex-end", marginTop: 6 }}
                        onPress={handleResendCode}
                        disabled={resendLoading}
                    >
                        <Text style={{ color: colors.amber, fontWeight: "600" }}>
                            {resendLoading ? "Sending..." : "Resend Code"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* CONFIRM PASSWORD */}
                <View style={loginStyles.inputGroup}>
                    <Text style={loginStyles.label}>Confirm Password</Text>

                    <View style={loginStyles.inputWrap}>
                        <Icon
                            name="shield-checkmark-outline"
                            size={16}
                            color={colors.muted}
                            style={loginStyles.inputIcon}
                        />

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

                {/* BUTTON */}
                <TouchableOpacity
                    style={loginStyles.btn}
                    onPress={handleReset}
                    disabled={loading}
                >
                    <Icon
                        name={loading ? "refresh-outline" : "lock-open-outline"}
                        size={18}
                        color={colors.navy}
                    />

                    <Text style={loginStyles.btnText}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </Text>
                </TouchableOpacity>

                {/* BACK */}
                <TouchableOpacity
                    style={{ marginTop: 20 }}
                    onPress={() => router.replace("/login")}
                >
                    <Text style={loginStyles.switchLink}>
                        Back to Sign In →
                    </Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}
