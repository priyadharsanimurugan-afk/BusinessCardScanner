import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { settingsStyles } from '@/components/styles/settingsStyles';
import { colors } from '@/constants/colors';

export default function SettingsScreen() {
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Johnson');
  const [email, setEmail] = useState('alex@company.com');
  const [company, setCompany] = useState('Acme Corp');
  const [jobTitle, setJobTitle] = useState('Product Designer');
  const [notifications, setNotifications] = useState(true);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const handleSave = () => {
    showToast('Profile saved successfully!');
  };

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
            <TouchableOpacity style={settingsStyles.heroEdit}>
              <Icon name="pencil-outline" size={14} color={colors.amber} />
            </TouchableOpacity>
          </View>

          <View style={settingsStyles.heroBody}>
            <View style={settingsStyles.avatarWrap}>
              <View style={settingsStyles.avatar}>
                <Text style={settingsStyles.avatarText}>AJ</Text>
              </View>
              <View style={settingsStyles.avatarEdit}>
                <Icon name="camera" size={9} color={colors.navy} />
              </View>
            </View>
            
            <View style={settingsStyles.heroInfo}>
              <Text style={settingsStyles.heroName}>Alex Johnson</Text>
              <Text style={settingsStyles.heroEmail}>alex@company.com</Text>
              
              <View style={settingsStyles.heroBadges}>
                <View style={[settingsStyles.badge, settingsStyles.badgeAmber]}>
                  <Icon name="star" size={9} color={colors.navy} />
                  <Text style={settingsStyles.badgeTextAmber}>Free Plan</Text>
                </View>
                <View style={[settingsStyles.badge, settingsStyles.badgeGreen]}>
                  <Icon name="ellipse" size={7} color={colors.partner} />
                  <Text style={settingsStyles.badgeTextGreen}>Active</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Mini Stats */}
        <View style={settingsStyles.miniStats}>
          <View style={settingsStyles.miniStat}>
            <Text style={settingsStyles.statValue}>128</Text>
            <Text style={settingsStyles.statLabel}>Contacts</Text>
          </View>
          <View style={[settingsStyles.miniStat, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={settingsStyles.statValue}>156</Text>
            <Text style={settingsStyles.statLabel}>Scanned</Text>
          </View>
          <View style={[settingsStyles.miniStat, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={settingsStyles.statValue}>34</Text>
            <Text style={settingsStyles.statLabel}>Exports</Text>
          </View>
        </View>

        {/* Profile Form */}
        <Text style={settingsStyles.sectionLabel}>Profile Information</Text>
        <View style={settingsStyles.formCard}>
          <View style={settingsStyles.formInner}>
            <View style={settingsStyles.formRow}>
              <View style={settingsStyles.formGroup}>
                <Text style={settingsStyles.formLabel}>First Name</Text>
                <TextInput
                  style={settingsStyles.formInput}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={settingsStyles.formGroup}>
                <Text style={settingsStyles.formLabel}>Last Name</Text>
                <TextInput
                  style={settingsStyles.formInput}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={settingsStyles.formGroup}>
              <Text style={settingsStyles.formLabel}>Email Address</Text>
              <TextInput
                style={settingsStyles.formInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={settingsStyles.formGroup}>
              <Text style={settingsStyles.formLabel}>Company</Text>
              <TextInput
                style={settingsStyles.formInput}
                value={company}
                onChangeText={setCompany}
              />
            </View>

            <View style={settingsStyles.formGroup}>
              <Text style={settingsStyles.formLabel}>Job Title</Text>
              <TextInput
                style={settingsStyles.formInput}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>

            <TouchableOpacity style={settingsStyles.saveButton} onPress={handleSave}>
              <Icon name="checkmark" size={14} color={colors.navy} />
              <Text style={settingsStyles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription */}
        <Text style={settingsStyles.sectionLabel}>Subscription</Text>
        <View style={settingsStyles.subCard}>
          <View style={settingsStyles.subTop}>
            <View style={settingsStyles.subIcon}>
              <Icon name="star" size={18} color={colors.amberDark} />
            </View>
            <View>
              <Text style={settingsStyles.subTitle}>Free Plan</Text>
              <Text style={settingsStyles.subSubtitle}>50 scans per month · Renews Mar 1</Text>
            </View>
          </View>

          <View style={settingsStyles.progressLabels}>
            <Text style={{ color: colors.muted, fontWeight: '600' }}>28 of 50 scans used</Text>
            <Text style={settingsStyles.progressLabelStrong}>56%</Text>
          </View>
          
          <View style={settingsStyles.progressBar}>
            <View style={settingsStyles.progressFill} />
          </View>

          <TouchableOpacity style={settingsStyles.upgradeButton}>
            <Icon name="flash" size={13} color={colors.amber} />
            <Text style={settingsStyles.upgradeButtonText}>Upgrade to Pro — Unlimited Scans</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={settingsStyles.sectionLabel}>Preferences</Text>
        <View style={settingsStyles.menuCard}>
          <TouchableOpacity style={settingsStyles.menuItem}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconAmber]}>
              <Icon name="notifications-outline" size={15} color={colors.amberDark} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={settingsStyles.menuLabel}>Notifications</Text>
              <Text style={settingsStyles.menuSub}>Scan alerts & reminders</Text>
            </View>
            <TouchableOpacity 
              style={settingsStyles.toggle}
              onPress={() => setNotifications(!notifications)}
            >
              <View style={[settingsStyles.toggleDot, notifications ? { right: 3 } : { left: 3 }]} />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={settingsStyles.menuItem}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconAmber]}>
              <Icon name="moon-outline" size={15} color={colors.amberDark} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={settingsStyles.menuLabel}>Dark Mode</Text>
              <Text style={settingsStyles.menuSub}>Switch appearance</Text>
            </View>
            <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={settingsStyles.menuItem}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconAmber]}>
              <Icon name="language-outline" size={15} color={colors.amberDark} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={settingsStyles.menuLabel}>Language</Text>
              <Text style={settingsStyles.menuSub}>English (US)</Text>
            </View>
            <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={settingsStyles.sectionLabel}>Account</Text>
        <View style={settingsStyles.menuCard}>
          <TouchableOpacity style={settingsStyles.menuItem}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconAmber]}>
              <Icon name="shield-outline" size={15} color={colors.amberDark} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={settingsStyles.menuLabel}>Privacy & Security</Text>
              <Text style={settingsStyles.menuSub}>Password, 2FA, data</Text>
            </View>
            <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={settingsStyles.menuItem}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconAmber]}>
              <Icon name="document-text-outline" size={15} color={colors.amberDark} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={settingsStyles.menuLabel}>Export All Data</Text>
              <Text style={settingsStyles.menuSub}>Download contacts as CSV</Text>
            </View>
            <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={settingsStyles.menuItem}>
            <View style={[settingsStyles.menuIconWrap, settingsStyles.menuIconAmber]}>
              <Icon name="help-circle-outline" size={15} color={colors.amberDark} />
            </View>
            <View style={settingsStyles.menuText}>
              <Text style={settingsStyles.menuLabel}>Help & Support</Text>
              <Text style={settingsStyles.menuSub}>FAQs, contact us</Text>
            </View>
            <Icon name="chevron-forward" size={12} style={settingsStyles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={settingsStyles.menuItem}>
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