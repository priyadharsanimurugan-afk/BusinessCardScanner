// app/(tabs)/contacts.tsx
import { contactsStyles } from '@/components/styles/contactStyles';
import { colors } from '@/constants/colors';
import { ContactDetail } from '@/types/contact';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Share,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useContact } from '@/hooks/useContact';
import { router, useFocusEffect } from 'expo-router';
import { exportContacts } from '@/services/contact';
import ImageViewerPackage  from 'react-native-image-zoom-viewer';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const AVATAR_COLORS = [
  '#1e3a5f', '#1a4731', '#3b1f6e', '#3d1a1a', '#1a3a3a',
  '#5f2e1e', '#2e1e5f', '#1e5f2e', '#5f1e4a', '#4a1e5f',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil(
    Math.abs(now.getTime() - date.getTime()) / 86400000,
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTagStyle = (tag: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    Lead:    { bg: colors.leadBg,    color: colors.lead },
    Partner: { bg: colors.partnerBg, color: colors.partner },
    Client:  { bg: colors.clientBg,  color: colors.client },
    Vendor:  { bg: colors.vendorBg,  color: colors.vendor },
  };
  return map[tag] ?? map.Lead;
};

const getTagFromDesignation = (designation = '') => {
  const d = designation.toLowerCase();
  if (d.includes('partner') || d.includes('head')) return 'Partner';
  if (d.includes('cto') || d.includes('director') || d.includes('vp')) return 'Lead';
  if (d.includes('manager') || d.includes('product')) return 'Vendor';
  return 'Client';
};

const buildImageUri = (base64?: string, mime?: string, url?: string) => {
  if (url) return url;
  if (base64) return `data:${mime ?? 'image/jpeg'};base64,${base64}`;
  return null;
};

const handlePhonePress = (p: string) => {
  if (p) Linking.openURL(`tel:${p}`);
};

const handleEmailPress = (email: string) => {
  const url = `mailto:${email}`;
  Linking.canOpenURL(url)
    .then((ok) => {
      if (ok) Linking.openURL(url);
      else Alert.alert('Error', 'Email not supported on this device');
    })
    .catch(() => Alert.alert('Error', 'Could not open email client'));
};

const handleWebsitePress = (website: string) => {
  let url = website;
  if (!url.startsWith('http://') && !url.startsWith('https://'))
    url = 'https://' + url;
  Linking.canOpenURL(url)
    .then((ok) => {
      if (ok) Linking.openURL(url);
      else Alert.alert('Error', 'Cannot open this website');
    })
    .catch(() => Alert.alert('Error', 'Could not open website'));
};

// ─── Share ──────────────────────────────────────────────────────────────────

const buildContactShareText = (contact: ContactDetail): string => {
  const lines: string[] = [];
  lines.push(`👤 ${contact.personName ?? 'Unknown'}`);
  if (contact.designation) lines.push(`💼 ${contact.designation}`);
  if (contact.companyName) lines.push(`🏢 ${contact.companyName}`);
  if (contact.subCompanyName) lines.push(`   └ ${contact.subCompanyName}`);
  if (contact.branchName) lines.push(`   └ Branch: ${contact.branchName}`);
  const phones = [contact.phoneNumber1, contact.phoneNumber2, contact.phoneNumber3].filter(Boolean);
  if (phones.length) { lines.push(''); lines.push('📞 Phone'); phones.forEach((p) => lines.push(`   ${p}`)); }
  const emails = [contact.email1, contact.email2].filter(Boolean);
  if (emails.length) { lines.push(''); lines.push('✉️ Email'); emails.forEach((e) => lines.push(`   ${e}`)); }
  if (contact.address) { lines.push(''); lines.push(`📍 ${contact.address}`); }
  const websites = [contact.website1, contact.website2].filter(Boolean);
  if (websites.length) { lines.push(''); lines.push('🌐 Web'); websites.forEach((w) => lines.push(`   ${w}`)); }
  if (contact.servicesCsv) { lines.push(''); lines.push(`🛠 Services: ${contact.servicesCsv}`); }
  if (contact.gstNumber) { lines.push(''); lines.push(`🧾 GST: ${contact.gstNumber}`); }
  if (contact.partnership) { lines.push(''); lines.push(`🤝 Partnership: ${contact.partnership}`); }
  return lines.join('\n');
};

const handleShareContact = async (contact: ContactDetail) => {
  try {
    await Share.share({
      message: buildContactShareText(contact),
      title: `Contact: ${contact.personName ?? 'Unknown'}`,
    });
  } catch {
    Alert.alert('Error', 'Failed to share contact');
  }
};




// ─── Replace your entire ImageViewer component with this ──

// ─── Image Viewer Component ──
const ContactImageViewer = ({
  visible,
  uri,
  label,
  onClose,
}: {
  visible: boolean;
  uri: string | null;
  label: string;
  onClose: () => void;
}) => {
  // ✅ rotation state
  const [rotation, setRotation] = React.useState(0);

  // Prepare images array
  const imageUrls = React.useMemo(() => {
    if (!uri) return [];
    return [{ url: uri }];
  }, [uri]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {uri && imageUrls.length > 0 ? (
        <ImageViewerPackage
          imageUrls={imageUrls}
          enableSwipeDown
          onSwipeDown={onClose}
          onCancel={onClose}
          enablePreload
          backgroundColor="#000000"

          
          renderImage={(props) => (
            <Image
              {...props}
              style={[
                props.style,
                { transform: [{ rotate: `${rotation}deg` }] },
              ]}
              resizeMode="contain"
            />
          )}

          
          loadingRender={() => (
            <View style={ivs.loadingContainer}>
              <ActivityIndicator size="large" color="#F2A65C" />
              <Text style={ivs.loadingText}>Loading image...</Text>
            </View>
          )}

         
          renderHeader={() => (
            <SafeAreaView edges={["top"]} style={ivs.safeHeader}>
              <View style={ivs.header}>
                {/* CLOSE */}
                <TouchableOpacity onPress={onClose} style={ivs.closeButton}>
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* TITLE */}
                <Text style={ivs.headerTitle} numberOfLines={1}>
                  {label}
                </Text>

                {/* ROTATE */}
                <TouchableOpacity
                  onPress={() => setRotation((prev) => prev + 90)}
                  style={ivs.closeButton}
                >
                  <Icon name="refresh" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          )}

         
          renderIndicator={(currentIndex, allSize) => (
            <View style={ivs.indicatorContainer}>
              <Text style={ivs.indicatorText}>
                {currentIndex} / {allSize}
              </Text>
            </View>
          )}

       
          renderFooter={() => (
            <View style={ivs.footer}>
              <Text style={ivs.footerText}>
                Pinch to zoom • Double tap to zoom
              </Text>
            </View>
          )}

          doubleClickInterval={300}
          enableImageZoom
          useNativeDriver
          saveToLocalByLongPress={false}
        />
      ) : (
        <View style={ivs.noImageContainer}>
          <TouchableOpacity onPress={onClose} style={ivs.noImageClose}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Icon
            name="image-outline"
            size={64}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={ivs.noImageText}>No image available</Text>
        </View>
      )}
    </Modal>
  );
};

const ivs = StyleSheet.create({
  /* ✅ SAFE HEADER WRAPPER */
  safeHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  /* ✅ HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },

  /* ✅ INDICATOR FIXED POSITION */
  indicatorContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 70,
    right: 16,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  indicatorText: {
    color: "#fff",
    fontSize: 12,
  },

  /* FOOTER */
  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },

  footerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  /* LOADING */
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
  },

  /* NO IMAGE */
  noImageContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },

  noImageClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  noImageText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 16,
    fontSize: 16,
  },
});
// ─── Edit Field ──────────────────────────────────────────────────────────────

type EditForm = {
  personName: string;
  designation: string;
  companyName: string;
  subCompanyName: string;
  branchName: string;
  phoneNumber1: string;
  phoneNumber2: string;
  phoneNumber3: string;
  email1: string;
  email2: string;
  address: string;
  website1: string;
  website2: string;
  servicesCsv: string;
  rawExtractedText: string;
  partnership: string;
  qrCodeDetail: string;
  gstNumber: string;
};

// Standalone memoised field — defined outside sheet so it never remounts
const EditField = React.memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
    multiline,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: any;
    multiline?: boolean;
  }) => (
    <View style={esS.fieldWrap}>
      <Text style={esS.fieldLabel}>{label}</Text>
      <TextInput
        style={[esS.fieldInput, multiline && esS.fieldInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
        placeholderTextColor={colors.inputPlaceholder}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType={multiline ? 'default' : 'next'}
        blurOnSubmit={!multiline}
        autoCorrect={false}
        autoCapitalize="none"
        multiline={multiline}
        scrollEnabled={multiline}
      />
    </View>
  ),
);

const esS = StyleSheet.create({
  fieldWrap:        { marginBottom: 12, paddingHorizontal: 16 },
  fieldLabel:       { fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 5, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldInput:       { ...contactsStyles.editFieldInput },
  fieldInputMulti:  { height: 90, textAlignVertical: 'top', paddingTop: 10 },
  sectionHead:      { fontSize: 11, fontWeight: '700', color: colors.amber, marginTop: 20, marginBottom: 4, paddingHorizontal: 16, letterSpacing: 1, textTransform: 'uppercase' },
});

// ─── Edit Sheet ──────────────────────────────────────────────────────────────
// KEY FIX for keyboard: we use a plain ScrollView with
// keyboardShouldPersistTaps + automaticallyAdjustKeyboardInsets (iOS 15+)
// and android:windowSoftInputMode=adjustResize in AndroidManifest.
// The sheet itself expands; inputs scroll into view naturally.

const EditSheet = ({
  visible,
  contact,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  contact: ContactDetail | null;
  onClose: () => void;
  onSave: (f: EditForm) => void;
  saving: boolean;
}) => {
  const blankForm: EditForm = {
    personName: '', designation: '', companyName: '', subCompanyName: '',
    branchName: '', phoneNumber1: '', phoneNumber2: '', phoneNumber3: '',
    email1: '', email2: '', address: '', website1: '', website2: '',
    servicesCsv: '', rawExtractedText: '', partnership: '',
    qrCodeDetail: '', gstNumber: '',
  };

  const [form, setForm] = useState<EditForm>(blankForm);
  

  useEffect(() => {
    if (contact) {
      setForm({
        personName:       contact.personName       ?? '',
        designation:      contact.designation      ?? '',
        companyName:      contact.companyName      ?? '',
        subCompanyName:   contact.subCompanyName   ?? '',
        branchName:       contact.branchName       ?? '',
        phoneNumber1:     contact.phoneNumber1     ?? '',
        phoneNumber2:     contact.phoneNumber2     ?? '',
        phoneNumber3:     contact.phoneNumber3     ?? '',
        email1:           contact.email1           ?? '',
        email2:           contact.email2           ?? '',
        address:          contact.address          ?? '',
        website1:         contact.website1         ?? '',
        website2:         contact.website2         ?? '',
        servicesCsv:      contact.servicesCsv      ?? '',
        rawExtractedText: contact.rawExtractedText ?? '',
        partnership:      contact.partnership      ?? '',
        qrCodeDetail:     contact.qrCodeDetail     ?? '',
        gstNumber:        contact.gstNumber        ?? '',
      });
    }
  }, [contact?.id]);

  const sf = useCallback(
    (key: keyof EditForm) => (val: string) =>
      setForm((f) => ({ ...f, [key]: val })),
    [],
  );

  const SH = (t: string) => <Text style={esS.sectionHead}>{t}</Text>;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={shS.overlay}>
        {/* Dim backdrop — tap to close */}
        <TouchableOpacity
          style={shS.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* The sheet itself sits at the bottom and grows with keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={shS.kavWrap}
        >
          <View style={shS.sheet}>
            {/* Drag handle */}
            <View style={shS.handle} />

            {/* Header */}
            <View style={shS.header}>
              <Text style={shS.title}>Edit Contact</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Scrollable fields
                automaticallyAdjustKeyboardInsets handles the iOS inset shift.
                On Android, ensure windowSoftInputMode=adjustResize in
                AndroidManifest so the sheet shrinks when the keyboard appears. */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
              // iOS 15+: the ScrollView shrinks automatically when keyboard appears
              automaticallyAdjustKeyboardInsets
            >
              {SH('Personal')}
              <EditField label="Full Name"   value={form.personName}  onChange={sf('personName')} />
              <EditField label="Designation" value={form.designation} onChange={sf('designation')} />

              {SH('Company')}
              <EditField label="Company Name" value={form.companyName}    onChange={sf('companyName')} />
              <EditField label="Sub Company"  value={form.subCompanyName} onChange={sf('subCompanyName')} />
              <EditField label="Branch"       value={form.branchName}     onChange={sf('branchName')} />

              {SH('Phone Numbers')}
              <EditField label="Phone 1" value={form.phoneNumber1} onChange={sf('phoneNumber1')} keyboardType="phone-pad" />
              <EditField label="Phone 2" value={form.phoneNumber2} onChange={sf('phoneNumber2')} keyboardType="phone-pad" />
              <EditField label="Phone 3" value={form.phoneNumber3} onChange={sf('phoneNumber3')} keyboardType="phone-pad" />

              {SH('Email')}
              <EditField label="Email 1" value={form.email1} onChange={sf('email1')} keyboardType="email-address" />
              <EditField label="Email 2" value={form.email2} onChange={sf('email2')} keyboardType="email-address" />

              {SH('Online Presence')}
              <EditField label="Website 1"      value={form.website1}     onChange={sf('website1')}     keyboardType="url" />
              <EditField label="Website 2"      value={form.website2}     onChange={sf('website2')}     keyboardType="url" />
              <EditField label="QR Code / Link" value={form.qrCodeDetail} onChange={sf('qrCodeDetail')} keyboardType="url" />

              {SH('Business Info')}
              <EditField label="GST Number"  value={form.gstNumber}   onChange={sf('gstNumber')} />
              <EditField label="Partnership" value={form.partnership} onChange={sf('partnership')} />

              {SH('Address & Services')}
              <EditField label="Address"                    value={form.address}     onChange={sf('address')}     multiline />
              <EditField label="Services (comma separated)" value={form.servicesCsv} onChange={sf('servicesCsv')} multiline />

              {SH('Raw Extracted Text')}
              <EditField
                label="Raw Text"
                value={form.rawExtractedText}
                onChange={sf('rawExtractedText')}
                multiline
                placeholder="Full text extracted from the business card..."
              />

              <TouchableOpacity
                style={[shS.saveBtn, saving && { opacity: 0.65 }]}
                onPress={() => onSave(form)}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <>
                    <Icon name="checkmark-circle-outline" size={18} color={colors.navy} />
                    <Text style={shS.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const shS = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  kavWrap:  { width: '100%' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.92,
    paddingTop: 8,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 4,
  },
  title:     { fontSize: 17, fontWeight: '700', color: '#414040' },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.amber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.navy },
});

// ─── Contact Detail Modal ────────────────────────────────────────────────────

const ContactDetailModal = ({
  visible, contact, loadingDetail, onClose, onEdit, onDelete,
}: {
  visible: boolean;
  contact: ContactDetail | null;
  loadingDetail: boolean;
  onClose: () => void;
  onEdit: (c: ContactDetail) => void;
  onDelete: (id: string | number) => void;
}) => {
  const [viewingImage, setViewingImage] = useState<{
    uri: string | null;
    label: string;
  } | null>(null);

  if (!visible) return null;

  const InfoRow = ({
    icon, label, value, onPress, isClickable = false,
  }: {
    icon: string; label: string; value: string;
    onPress?: () => void; isClickable?: boolean;
  }) => (
    <TouchableOpacity
      style={contactsStyles.detailRow}
      onPress={onPress}
      disabled={!isClickable}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <View style={contactsStyles.detailIconWrap}>
        <Icon name={icon} size={15} color={colors.amber} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={contactsStyles.detailRowLabel}>{label}</Text>
        <Text
          style={[
            contactsStyles.detailRowValue,
            isClickable && { color: colors.navy, textDecorationLine: 'underline' },
          ]}
        >
          {value}
        </Text>
      </View>
      {isClickable && (
        <Icon name="open-outline" size={14} color={colors.navy} style={{ marginLeft: 8 }} />
      )}
    </TouchableOpacity>
  );

  const SectionCard = ({
    title, children,
  }: {
    title: string; children: React.ReactNode;
  }) => (
    <View style={contactsStyles.detailSection}>
      <Text style={contactsStyles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (loadingDetail || !contact) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={contactsStyles.detailOverlay}>
          <View style={contactsStyles.detailSheet}>
            <View style={contactsStyles.detailHandle} />
            <View style={contactsStyles.detailTopBar}>
              <TouchableOpacity onPress={onClose} style={contactsStyles.detailCloseBtn}>
                <Icon name="chevron-down" size={22} color={colors.muted} />
              </TouchableOpacity>
              <Text style={contactsStyles.detailTopTitle}>Contact Details</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <ActivityIndicator size="large" color={colors.amber} />
              <Text style={{ color: colors.muted, marginTop: 16, fontSize: 15 }}>
                Loading contact details...
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const personName = contact.personName ?? 'Unknown';
  const initials   = getInitials(personName);
  const avatarBg   = getAvatarColor(personName);
  const tag        = getTagFromDesignation(contact.designation);
  const tagStyle   = getTagStyle(tag);
  const frontUri   = buildImageUri(contact.frontImage, contact.frontImageMimeType);
  const backUri    = buildImageUri(contact.backImage, contact.backImageMimeType);
  const phones     = [contact.phoneNumber1, contact.phoneNumber2, contact.phoneNumber3].filter(Boolean) as string[];
  const emails     = [contact.email1, contact.email2].filter(Boolean) as string[];
  const websites   = [contact.website1, contact.website2].filter(Boolean) as string[];
  const services   = contact.servicesCsv
    ? contact.servicesCsv.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${personName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { onDelete(contact.id); onClose(); },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={contactsStyles.detailOverlay}>
        <View style={contactsStyles.detailSheet}>
          <View style={contactsStyles.detailHandle} />

          {/* Top bar */}
          <View style={contactsStyles.detailTopBar}>
            <TouchableOpacity onPress={onClose} style={contactsStyles.detailCloseBtn}>
              <Icon name="chevron-down" size={22} color={colors.muted} />
            </TouchableOpacity>
            <Text style={contactsStyles.detailTopTitle}>Contact Details</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={contactsStyles.detailActionBtn}
                onPress={() => handleShareContact(contact)}
              >
                <Icon name="share-outline" size={18} color={colors.amber} />
              </TouchableOpacity>
              <TouchableOpacity
                style={contactsStyles.detailActionBtn}
                onPress={() => onEdit(contact)}
              >
                <Icon name="create-outline" size={18} color={colors.amber} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  contactsStyles.detailActionBtn,
                  { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' },
                ]}
                onPress={handleDelete}
              >
                <Icon name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Hero */}
            <View style={contactsStyles.detailHero}>
              <View style={contactsStyles.detailHeroGlow} />
              <View style={[contactsStyles.detailAvatar, { backgroundColor: avatarBg }]}>
                <Text style={contactsStyles.detailAvatarText}>{initials}</Text>
              </View>
              <Text style={contactsStyles.detailName}>{personName}</Text>
              <Text style={contactsStyles.detailDesignation}>
                {contact.designation ?? 'No designation'}
              </Text>
              {contact.companyName ? (
                <Text style={contactsStyles.detailCompany}>{contact.companyName}</Text>
              ) : null}
              <View style={[contactsStyles.detailTag, { backgroundColor: tagStyle.bg }]}>
                <Text style={[contactsStyles.detailTagText, { color: tagStyle.color }]}>{tag}</Text>
              </View>
            </View>

            {/* Business card images */}
            <View style={contactsStyles.detailCardsRow}>
              {[
                { uri: frontUri, label: 'Front Side', badge: 'Front' },
                { uri: backUri,  label: 'Back Side',  badge: 'Back' },
              ].map((card) => (
                <TouchableOpacity
                  key={card.badge}
                  style={contactsStyles.detailCardBox}
                  onPress={() => setViewingImage({ uri: card.uri, label: card.label })}
                  activeOpacity={0.85}
                >
                  {card.uri ? (
                    <Image
                      source={{ uri: card.uri }}
                      style={contactsStyles.detailCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={contactsStyles.detailCardPlaceholder}>
                      <Icon name="card-outline" size={28} color="rgba(255,255,255,0.35)" />
                      <Text style={contactsStyles.detailCardPlaceholderText}>{card.badge}</Text>
                    </View>
                  )}
                  <View style={contactsStyles.detailCardBadge}>
                    <Icon name="eye-outline" size={10} color={colors.amberDark} />
                    <Text style={contactsStyles.detailCardBadgeText}>{card.badge}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={contactsStyles.detailBody}>
              {phones.length > 0 && (
                <SectionCard title="Phone Numbers">
                  {phones.map((p, i) => (
                    <InfoRow
                      key={i}
                      icon="call-outline"
                      label={i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Mobile 3'}
                      value={p}
                      onPress={() => handlePhonePress(p)}
                      isClickable
                    />
                  ))}
                </SectionCard>
              )}

              {emails.length > 0 && (
                <SectionCard title="Email Addresses">
                  {emails.map((e, i) => (
                    <InfoRow
                      key={i}
                      icon="mail-outline"
                      label={`Email ${i + 1}`}
                      value={e}
                      onPress={() => handleEmailPress(e)}
                      isClickable
                    />
                  ))}
                </SectionCard>
              )}

              {(contact.companyName || contact.subCompanyName || contact.branchName) && (
                <SectionCard title="Company">
                  {contact.companyName    && <InfoRow icon="business-outline"    label="Company"     value={contact.companyName} />}
                  {contact.subCompanyName && <InfoRow icon="git-branch-outline"  label="Sub Company" value={contact.subCompanyName} />}
                  {contact.branchName     && <InfoRow icon="location-outline"    label="Branch"      value={contact.branchName} />}
                </SectionCard>
              )}

              {contact.address ? (
                <SectionCard title="Address">
                  <InfoRow icon="map-outline" label="Office Address" value={contact.address} />
                </SectionCard>
              ) : null}

              {websites.length > 0 && (
                <SectionCard title="Websites">
                  {websites.map((w, i) => (
                    <InfoRow
                      key={i}
                      icon="globe-outline"
                      label={`Website ${i + 1}`}
                      value={w}
                      onPress={() => handleWebsitePress(w)}
                      isClickable
                    />
                  ))}
                </SectionCard>
              )}

              {contact.qrCodeDetail ? (
                <SectionCard title="QR Code">
                  <InfoRow
                    icon="qr-code-outline"
                    label="QR / Link"
                    value={contact.qrCodeDetail}
                    onPress={() => handleWebsitePress(contact.qrCodeDetail!)}
                    isClickable
                  />
                </SectionCard>
              ) : null}

              {services.length > 0 && (
                <SectionCard title="Services">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
                    {services.map((s, i) => (
                      <View key={i} style={contactsStyles.detailServiceTag}>
                        <Text style={contactsStyles.detailServiceText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              )}

              {(contact.gstNumber || contact.partnership) ? (
                <SectionCard title="Business Info">
                  {contact.gstNumber   && <InfoRow icon="receipt-outline"       label="GST Number"  value={contact.gstNumber} />}
                  {contact.partnership && <InfoRow icon="people-circle-outline" label="Partnership" value={contact.partnership} />}
                </SectionCard>
              ) : null}

              {contact.rawExtractedText ? (
                <SectionCard title="Raw Extracted Text">
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
                      {contact.rawExtractedText}
                    </Text>
                  </View>
                </SectionCard>
              ) : null}

              <SectionCard title="Meta">
                <InfoRow
                  icon="calendar-outline"
                  label="Added On"
                  value={new Date(contact.createdAtUtc).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                />
                <InfoRow
                  icon="finger-print-outline"
                  label="Contact ID"
                  value={String(contact.id)}
                />
              </SectionCard>

              {/* Bottom action row */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  style={[contactsStyles.detailEditBtn, { flex: 1 }]}
                  onPress={() => handleShareContact(contact)}
                >
                  <Icon name="share-outline" size={18} color={colors.navy} />
                  <Text style={contactsStyles.detailEditBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[contactsStyles.detailEditBtn, { flex: 1 }]}
                  onPress={() => onEdit(contact)}
                >
                  <Icon name="create-outline" size={18} color={colors.navy} />
                  <Text style={contactsStyles.detailEditBtnText}>Edit Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      <ContactImageViewer
        visible={!!viewingImage}
        uri={viewingImage?.uri ?? null}
        label={viewingImage?.label ?? ''}
        onClose={() => setViewingImage(null)}
      />
    </Modal>
  );
};

// ─── Contact Card ────────────────────────────────────────────────────────────

const ContactCard = ({
  contact, onPress, onDelete,
}: {
  contact: ContactDetail;
  onPress: (c: ContactDetail) => void;
  onDelete: (id: string | number) => void;
}) => {
  const personName    = contact.personName ?? 'Unknown';
  const initials      = getInitials(personName);
  const avatarBg      = getAvatarColor(personName);
  const tag           = getTagFromDesignation(contact.designation);
  const tagStyle      = getTagStyle(tag);
  const phone         = contact.phoneNumber1 ?? contact.phoneNumber2 ?? contact.phoneNumber3 ?? 'No phone';
  const email         = contact.email1 ?? contact.email2 ?? 'No email';
  const formattedDate = formatDate(contact.createdAtUtc);

  return (
    <TouchableOpacity
      style={contactsStyles.contactCard}
      activeOpacity={0.75}
      onPress={() => onPress(contact)}
    >
      <View style={[contactsStyles.contactAvatar, { backgroundColor: avatarBg }]}>
        <Text style={contactsStyles.contactAvatarText}>{initials}</Text>
      </View>

      <View style={contactsStyles.contactBody}>
        <Text style={contactsStyles.contactName}    numberOfLines={1}>{personName}</Text>
        <Text style={contactsStyles.contactRole}    numberOfLines={1}>{contact.designation ?? 'No designation'}</Text>
        <Text style={contactsStyles.contactCompany} numberOfLines={1}>{contact.companyName ?? 'No company'}</Text>

        <View style={contactsStyles.contactDetails}>
          <View style={contactsStyles.contactRow}>
            <Icon name="mail-outline" size={10} color={colors.amberDark} />
            <Text style={contactsStyles.contactRowText} numberOfLines={1}>{email}</Text>
          </View>
          <View style={contactsStyles.contactRow}>
            <Icon name="call-outline" size={10} color={colors.amberDark} />
            <Text style={contactsStyles.contactRowText} numberOfLines={1}>{phone}</Text>
          </View>
        </View>

        <View style={contactsStyles.contactTags}>
          <Text style={[contactsStyles.tag, { backgroundColor: tagStyle.bg, color: tagStyle.color }]}>
            {tag}
          </Text>
        </View>
      </View>

      <View style={contactsStyles.contactRight}>
        <Text style={contactsStyles.contactDate}>{formattedDate}</Text>
        <TouchableOpacity
          style={contactsStyles.contactMore}
          onPress={() => {
            Alert.alert('Delete Contact', `Delete ${personName}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(contact.id) },
            ]);
          }}
        >
          <Icon name="trash-outline" size={12} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ContactsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Search: state → UI, ref → stable value that survives focus cycles
  const [searchQuery, setSearchQuery] = useState('');
  const searchQueryRef = useRef('');
  const handleSearchChange = useCallback((text: string) => {
    searchQueryRef.current = text;
    setSearchQuery(text);
  }, []);

  const [selectedContact, setSelectedContact] = useState<ContactDetail | null>(null);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [detailVisible, setDetailVisible]     = useState(false);
  const [editVisible, setEditVisible]         = useState(false);
  const [editContact, setEditContact]         = useState<ContactDetail | null>(null);
  const [saving, setSaving]                   = useState(false);

  const {
    contacts, loading, error,
    fetchContacts, fetchContact, removeContact,
    editContact: updateContactHook,
    loadMore, total,
  } = useContact(1, 50);

  // Re-fetch on focus WITHOUT clearing search
  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContacts(1);
    setRefreshing(false);
  };

  const handleAdd = () => router.push('/scan');

  const handleDelete = async (id: string | number) => {
    try {
      await removeContact(id);
      setDetailVisible(false);
      setSelectedContact(null);
      Alert.alert('Success', 'Contact deleted');
    } catch {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  const handleContactPress = async (contact: ContactDetail) => {
    setDetailVisible(true);
    setSelectedContact(null);
    setLoadingDetail(true);
    try {
      const full = await fetchContact(contact.id);
      setSelectedContact(full);
    } catch {
      Alert.alert('Error', 'Failed to load contact details');
      setDetailVisible(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleEdit = (contact: ContactDetail) => {
    setDetailVisible(false);
    setTimeout(() => {
      setEditContact(contact);
      setEditVisible(true);
    }, 300);
  };

  const handleSave = async (form: EditForm) => {
    if (!editContact) return;
    setSaving(true);
    try {
      await updateContactHook(editContact.id, form);
      await fetchContacts();
      setEditVisible(false);
      Alert.alert('Success', 'Contact updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  // Simple search filter (no chip filter)
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      q === '' ||
      c.personName?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.email1?.toLowerCase().includes(q) ||
      c.email2?.toLowerCase().includes(q)
    );
  });

  if (loading && !refreshing && contacts.length === 0) {
    return (
      <View style={[contactsStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.amber} />
        <Text style={{ marginTop: 12, color: colors.muted }}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={contactsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      <ScrollView
        style={contactsStyles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.amber]}
            tintColor={colors.amber}
          />
        }
        onScrollEndDrag={({ nativeEvent }) => {
          const atBottom =
            nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - 20;
          if (atBottom && contacts.length < total) loadMore();
        }}
        scrollEventThrottle={400}
        contentContainerStyle={{ paddingBottom: 40, backgroundColor: colors.phoneBg, flexGrow: 1 }}
      >
        {/* Header */}
        <View style={contactsStyles.header}>
          <View style={contactsStyles.headerGlow} />
          <View style={contactsStyles.headerTop}>
            <View>
              <Text style={contactsStyles.greetText}>Your network</Text>
              <Text style={contactsStyles.titleText}>Contacts</Text>
            </View>
            <View style={contactsStyles.headerActions}>
              <TouchableOpacity
                style={contactsStyles.headerBtn}
                onPress={async () => {
                  try { await exportContacts(); }
                  catch { Alert.alert('Error', 'Failed to export contacts'); }
                }}
              >
                <Icon name="download" size={14} color={colors.amber} />
              </TouchableOpacity>
              <TouchableOpacity style={contactsStyles.headerBtn} onPress={handleAdd}>
                <Icon name="add-outline" size={14} color={colors.amber} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search bar (only filter — no chips) */}
        <View style={contactsStyles.searchWrap}>
          <Icon name="search-outline" size={14} color={colors.muted} style={contactsStyles.searchIcon} />
          <TextInput
            style={contactsStyles.searchInput}
            placeholder="Search by name, company, email..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')} style={{ padding: 6 }}>
              <Icon name="close-circle" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Count bar */}
        <View style={contactsStyles.countBar}>
          <Text style={contactsStyles.countText}>
            Showing{' '}
            <Text style={contactsStyles.countStrong}>{filteredContacts.length}</Text>{' '}
            of {total} contacts
          </Text>
          <TouchableOpacity style={contactsStyles.sortBtn}>
            <Icon name="swap-vertical-outline" size={11} color={colors.amberDark} />
            <Text style={contactsStyles.sortText}>Newest</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 10 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchContacts(1)}
              style={{ padding: 8, backgroundColor: colors.amber, borderRadius: 8 }}
            >
              <Text style={{ color: colors.white }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {!error && filteredContacts.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center', flex: 1 }}>
            <Icon name="people-outline" size={48} color={colors.muted} />
            <Text style={{ marginTop: 12, color: colors.muted, textAlign: 'center' }}>
              {searchQuery
                ? 'No contacts match your search'
                : 'No contacts yet. Add your first one!'}
            </Text>
          </View>
        )}

        {/* List */}
        {!error && filteredContacts.length > 0 && (
          <View style={contactsStyles.contactList}>
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onPress={handleContactPress}
                onDelete={handleDelete}
              />
            ))}
            {loading && contacts.length < total && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.amber} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Detail modal */}
      <ContactDetailModal
        visible={detailVisible}
        contact={selectedContact}
        loadingDetail={loadingDetail}
        onClose={() => { setDetailVisible(false); setSelectedContact(null); }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit sheet */}
      <EditSheet
        visible={editVisible}
        contact={editContact}
        onClose={() => setEditVisible(false)}
        onSave={handleSave}
        saving={saving}
      />
    </View>
  );
}