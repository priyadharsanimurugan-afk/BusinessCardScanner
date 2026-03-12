import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { loginStyles } from "@/components/styles/loginStyles";
import { colors } from "../constants/colors";
import { useAuth } from "@/hooks/useLoginAuth";
import { AuthForms } from "@/components/authForm";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const LoginScreen = () => {
  const {
    // Login
    loginEmail,
    setLoginEmail,
    loginPass,
    setLoginPass,
    showLoginPass,
    setShowLoginPass,

    // Signup - UPDATED prop names
    userName,           // Changed from firstName
    setUserName,        // Changed from setFirstName
    phoneNumber,        // Changed from lastName
    setPhoneNumber,     // Changed from setLastName
    signupEmail,
    setSignupEmail,
    signupPass,
    setSignupPass,
    confirmPass,
    setConfirmPass,
    showSignupPass,
    setShowSignupPass,
    showConfirmPass,
    setShowConfirmPass,
    passStrength,

    // Forgot
    forgotEmail,
    setForgotEmail,

    // UI
    activeTab,
    setActiveTab,
    showForgot,
    setShowForgot,
    remember,
    setRemember,
    loading,
    toast,

    // Functions
    handleLogin,
    handleSignup,
    handleForgot,
    checkStrength,
  } = useAuth();

  return (
    <SafeAreaView
      style={loginStyles.container}
      edges={['bottom']}
    >
      {/* Toast */}
      {toast.show && (
        <View
          style={[
            loginStyles.toast,
            toast.type === "error" && { backgroundColor: "#ff4d4d" },
            toast.type === "success" && { backgroundColor: "#4CAF50" },
            toast.type === "info" && { backgroundColor: "#333" },
          ]}
        >
          <Icon
            name={
              toast.type === "error"
                ? "close-circle"
                : toast.type === "success"
                  ? "checkmark-circle"
                  : "information-circle"
            }
            size={18}
            color="#fff"
          />
          <Text style={loginStyles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <KeyboardAwareScrollView
        style={loginStyles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
        extraHeight={120}
      >
        {/* Hero Section */}
        <View style={loginStyles.hero}>
          <View style={loginStyles.heroGlow} />

          <View style={loginStyles.brand}>
            <View style={loginStyles.brandIcon}>
              <Icon name="card" size={18} color={colors.navy} />
            </View>
            <View>
              <Text style={loginStyles.brandName}>CardScan Pro</Text>
              <Text style={loginStyles.brandTag}>
                Smart Business Card Scanner
              </Text>
            </View>
          </View>

          <Text style={loginStyles.heroTitle}>
            Your contacts,{"\n"}
            <Text style={loginStyles.heroSpan}>always with you.</Text>
          </Text>
          <Text style={loginStyles.heroSub}>
            Sign in to access your scanned cards & network
          </Text>

          {/* Tabs */}
          <View style={loginStyles.tabs}>
            <TouchableOpacity
              style={[
                loginStyles.tab,
                activeTab === "login" && loginStyles.activeTab,
              ]}
              onPress={() => setActiveTab("login")}
            >
              <Text
                style={[
                  loginStyles.tabText,
                  activeTab === "login" && loginStyles.activeTabText,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                loginStyles.tab,
                activeTab === "signup" && loginStyles.activeTab,
              ]}
              onPress={() => setActiveTab("signup")}
            >
              <Text
                style={[
                  loginStyles.tabText,
                  activeTab === "signup" && loginStyles.activeTabText,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auth Forms - UPDATED props */}
        <AuthForms
          // Login
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPass={loginPass}
          setLoginPass={setLoginPass}
          showLoginPass={showLoginPass}
          setShowLoginPass={setShowLoginPass}
          
          // Signup - UPDATED with new prop names
          userName={userName}
          setUserName={setUserName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupPass={signupPass}
          setSignupPass={setSignupPass}
          confirmPass={confirmPass}
          setConfirmPass={setConfirmPass}
          showSignupPass={showSignupPass}
          setShowSignupPass={setShowSignupPass}
          showConfirmPass={showConfirmPass}
          setShowConfirmPass={setShowConfirmPass}
          passStrength={passStrength}
          
          // Forgot
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          
          // UI
          activeTab={activeTab}
          showForgot={showForgot}
          remember={remember}
          setRemember={setRemember}
          loading={loading}
          setActiveTab={setActiveTab}
          setShowForgot={setShowForgot}
          
          // Functions
          handleLogin={handleLogin}
          handleSignup={handleSignup}
          handleForgot={handleForgot}
          checkStrength={checkStrength}
        />

        {/* Bottom Info */}
        <View style={loginStyles.bottomInfo}>
          <Text style={loginStyles.bottomText}>
            By continuing, you agree to our{" "}
            <Text style={loginStyles.bottomLink}>Terms of Service</Text>
            {"\n"}
            and <Text style={loginStyles.bottomLink}>Privacy Policy</Text>. Your
            data is encrypted & secure.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;