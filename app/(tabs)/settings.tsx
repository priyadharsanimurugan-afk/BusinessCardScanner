import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { settingsStyles } from '@/components/styles/settingsStyles';
import { colors } from '@/constants/colors';
import { useProfile } from '@/hooks/useProfile';
import { useDashboard } from '@/hooks/useDashboard';
import { router } from 'expo-router';
import { deleteTokens, getRoles } from '@/utils/tokenStorage';

export default function SettingsScreen() {
  const [toast, setToast] = useState({ show: false, msg: '' });
  const { profile, loading: profileLoading, editProfile, fetchProfile ,  error: profileError,} = useProfile();
  const { summary, loading: dashboardLoading } = useDashboard();
  const [isEditing, setIsEditing] = useState(false); // new edit mode
  // Local state for editable fields
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setUserName(profile.userName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setEmail(profile.email || '');
    }
  }, [profile]);
  useEffect(() => {
    const checkRole = async () => {
      const roles = await getRoles();
      if (roles?.includes("Admin")) {
        setIsAdmin(true);
      }
    };

    checkRole();
  }, []);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const handleEditPress = () => setIsEditing(prev => !prev);

  // Save changes
  const handleSave = async () => {
    try {
      await editProfile(userName, phoneNumber);

      // update local UI instantly
      setUserName(userName);
      setPhoneNumber(phoneNumber);

      showToast("Profile saved successfully!");
      setIsEditing(false);

      // optional background refresh
      fetchProfile();

    } catch (error) {
      showToast("Failed to save profile");
    }
  };

const handleLogout = () => {
  Alert.alert(
    "Confirm Logout",
    "Are you sure you want to log out?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await deleteTokens();   // ✅ clear storage
          router.replace("/login"); // ✅ redirect after clearing
        },
      },
    ],
    { cancelable: true }
  );
};

  // Get initials for avatar
  const getInitials = () => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

const isLoading = profileLoading && dashboardLoading;


  const isPremium = profile?.accountType === "Premium";





  return (
    <View style={settingsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Toast */}
      {toast.show && (
        <View style={settingsStyles.toast}>
          <Icon name="checkmark-circle" size={18} color={colors.white} />
          <Text style={settingsStyles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <ScrollView
        style={settingsStyles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 20,
          backgroundColor: colors.phoneBg,
        }}
      >


        {/* Profile Hero */}
        <View style={settingsStyles.profileHero}>
          <View style={settingsStyles.heroGlow} />

          <View style={settingsStyles.heroTop}>
            <Text style={settingsStyles.heroTitle}>Settings</Text>
            <TouchableOpacity style={settingsStyles.heroEdit} onPress={handleEditPress}>
              <Icon name={isEditing ? "close-outline" : "pencil-outline"} size={14} color={colors.amber} />
            </TouchableOpacity>

          </View>

          <View style={settingsStyles.heroBody}>
            <View style={settingsStyles.avatarWrap}>
              <View style={settingsStyles.avatar}>
                <Text style={settingsStyles.avatarText}>{getInitials()}</Text>
              </View>
              <View style={settingsStyles.avatarEdit}>
                <Icon name="camera" size={9} color={colors.navy} />
              </View>
            </View>

            <View style={settingsStyles.heroInfo}>
              <Text style={settingsStyles.heroName}>{userName || 'User'}</Text>
              <Text style={settingsStyles.heroEmail}>{email}</Text>

              <View style={settingsStyles.heroBadges}>
                <View style={[settingsStyles.badge, settingsStyles.badgeAmber]}>
                  <Icon name="star" size={9} color={colors.navy} />
                  <Text style={settingsStyles.badgeTextAmber}>
                    {profile?.accountType || 'Free'} Plan
                  </Text>
                </View>
                <View style={[settingsStyles.badge, settingsStyles.badgeGreen]}>
                  <Icon name="ellipse" size={7} color={colors.partner} />
                  <Text style={settingsStyles.badgeTextGreen}>Active</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {profileError && (
    <View style={{ padding: 10 }}>
      <Text style={{ color: "red", textAlign: "center" }}>
        {profileError}
      </Text>

      <TouchableOpacity onPress={fetchProfile} style={{ marginTop: 5 }}>
        <Text style={{ color: colors.amber, textAlign: "center" }}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  )}
        {/* Mini Stats */}
        <View style={settingsStyles.miniStats}>
          <View style={settingsStyles.miniStat}>
            <Text style={settingsStyles.statValue}>{summary?.totalContactsCount || 0}</Text>
            <Text style={settingsStyles.statLabel}>Contacts</Text>
          </View>
          <View style={[settingsStyles.miniStat, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={settingsStyles.statValue}>{summary?.totalScansUsed || 0}</Text>
            <Text style={settingsStyles.statLabel}>Scanned</Text>
          </View>
          <View style={[settingsStyles.miniStat, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={settingsStyles.statValue}>{summary?.totalExportsCount || 0}</Text>
            <Text style={settingsStyles.statLabel}>Exports</Text>
          </View>
        </View>
        {isAdmin && (
          <>
            <Text style={settingsStyles.sectionLabel}>Admin</Text>

            <View style={settingsStyles.menuCard}>
              <TouchableOpacity
                style={settingsStyles.menuItem}
                onPress={() => router.push("/users")}
              >
                <View style={[settingsStyles.menuIconWrap, { backgroundColor: colors.amberLight }]}>
                  <Icon name="people-outline" size={16} color={colors.amberDark} />
                </View>

                <View style={settingsStyles.menuText}>
                  <Text style={settingsStyles.menuLabel}>Users</Text>
                  <Text style={settingsStyles.menuSub}>Access and manage all users</Text>
                </View>

                <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Profile Form - Only show editable fields from API */}
        <Text style={settingsStyles.sectionLabel}>Profile Information</Text>
        <View style={settingsStyles.formCard}>
          <View style={settingsStyles.formInner}>
            <View style={settingsStyles.formGroup}>
              <Text style={settingsStyles.formLabel}>Username</Text>
              <TextInput
                style={settingsStyles.formInput}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter username"
                placeholderTextColor={colors.muted}
                editable={isEditing}
              />
            </View>

            <View style={settingsStyles.formGroup}>
              <Text style={settingsStyles.formLabel}>Phone Number</Text>
              <TextInput
                style={settingsStyles.formInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={settingsStyles.formGroup}>
              <Text style={settingsStyles.formLabel}>Email Address</Text>
              <TextInput
                style={[settingsStyles.formInput, { color: colors.muted }]}
                value={email}
                editable={false} // Email might not be editable based on your API
              />
            </View>
            <TouchableOpacity
              style={[
                settingsStyles.saveButton,
                (!isEditing || profileLoading) && settingsStyles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!isEditing || profileLoading}
            >
              {profileLoading ? (
                <ActivityIndicator size="small" color={colors.navy} />
              ) : (
                <>
                  <Icon name="checkmark" size={14} color={colors.navy} />
                  <Text style={settingsStyles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>


          </View>
        </View>

        {/* Subscription */}
        {!isAdmin && (
          <>
            <Text style={settingsStyles.sectionLabel}>Subscription</Text>

            <View style={settingsStyles.subCard}>
              <View style={settingsStyles.subTop}>
                <View style={settingsStyles.subIcon}>
                  <Icon name="star" size={18} color={colors.amberDark} />
                </View>

                <View>
                  <Text style={settingsStyles.subTitle}>
                    {profile?.accountType || "Free"} Plan
                  </Text>

                  {/* Only show remaining scans for non-premium */}
                  {!isPremium && (
                    <Text style={settingsStyles.subSubtitle}>
                      {profile?.remainingScans || 0} scans remaining
                    </Text>
                  )}
                </View>
              </View>

              {/* Progress Labels */}
              <View style={settingsStyles.progressLabels}>

                {/* FREE USER */}
                {!isPremium && (
                  <Text style={{ color: colors.muted, fontWeight: "600" }}>
                    {summary?.totalScansUsed || 0} of {profile?.remainingScans || 0} scans used
                  </Text>
                )}

                {/* PREMIUM USER */}
                {isPremium && (
                  <Text style={{ color: colors.muted, fontWeight: "600" }}>
                    Usage
                  </Text>
                )}

                <Text style={settingsStyles.progressLabelStrong}>
                  {profile?.remainingScans && summary?.totalScansUsed
                    ? Math.round(
                      (summary.totalScansUsed /
                        (summary.totalScansUsed + profile.remainingScans)) *
                      100
                    )
                    : 0}
                  %
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={settingsStyles.progressBar}>
                <View
                  style={[
                    settingsStyles.progressFill,
                    {
                      width:
                        profile?.remainingScans && summary?.totalScansUsed
                          ? `${Math.min(
                            (summary.totalScansUsed /
                              (summary.totalScansUsed + profile.remainingScans)) *
                            100,
                            100
                          )}%`
                          : "0%",
                    },
                  ]}
                />
              </View>

              {/* Upgrade button only for FREE users */}
              {!isPremium && (
                <TouchableOpacity style={settingsStyles.upgradeButton}>
                  <Icon name="flash" size={13} color={colors.amber} />
                  <Text style={settingsStyles.upgradeButtonText}>
                    Upgrade to Pro — Unlimited Scans
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}



        {/* Account */}
        <Text style={settingsStyles.sectionLabel}>Account</Text>
        <View style={settingsStyles.menuCard}>
          <TouchableOpacity style={settingsStyles.menuItem} onPress={handleLogout}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconRed]}>
              <Icon name="log-out-outline" size={15} color={colors.red} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={[settingsStyles.menuLabel, settingsStyles.menuLabelRed]}>Sign Out</Text>
              <Text style={settingsStyles.menuSub}>Log out of your account</Text>
            </View>
            <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Version Footer */}
        <Text style={settingsStyles.versionFooter}>CardScan Pro v2.4.1 · Made with ❤️</Text>
      </ScrollView>
    </View>
  );
}