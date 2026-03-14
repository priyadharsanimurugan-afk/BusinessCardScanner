// app/(tabs)/scan.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  Text, View, StyleSheet, Alert, FlatList,
  TouchableOpacity, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import MlkitOcr from 'react-native-mlkit-ocr';
import { Ionicons } from '@expo/vector-icons';

import { useCards, ScannedCard, OCRData } from '@/components/store/useCardStore';
import { useContact } from '@/hooks/useContact';
import { colors } from '@/constants/colors';
import { CameraStyles, scanStyles } from '@/components/styles/scanStyles';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { useMenuVisibility } from '@/context/MenuVisibilityContext';

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────
interface FieldItem {
  id: string;
  type: string;
  value: string;
  order: number;
}

interface ExtendedScannedCard extends ScannedCard {
  fields?: FieldItem[];
  backUri?: string;
  hasBothSides?: boolean;
}

// ─────────────────────────────────────────────────────
// API ERROR EXTRACTOR
// ─────────────────────────────────────────────────────
function extractApiError(e: any): string {
  if (!e) return 'An unknown error occurred.';
  const data = e?.response?.data ?? e?.data ?? null;
  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (data.errors && typeof data.errors === 'object') {
      const messages: string[] = [];
      Object.entries(data.errors as Record<string, string[]>).forEach(([key, vals]) => {
        if (Array.isArray(vals)) vals.forEach(v => messages.push(key === '$' ? v : `${key}: ${v}`));
      });
      if (messages.length) return messages.join('\n');
    }
    if (typeof data.title === 'string' && data.title.trim()) return data.title.trim();
  }
  if (typeof e.message === 'string' && e.message.trim()) return e.message.trim();
  return 'Something went wrong. Please try again.';
}

// ─────────────────────────────────────────────────────
// INTELLIGENT FIELD CLASSIFIER
// ─────────────────────────────────────────────────────
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /^(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}$/;
const URL_RE = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}/;
const PINCODE_RE = /^\d{6}$/;
const NAME_RE = /^[A-Za-z\s.'\-]+$/;

const DESIG_KEYWORDS = ['manager', 'director', 'engineer', 'developer', 'designer',
  'officer', 'president', 'head', 'lead', 'specialist', 'analyst', 'consultant',
  'associate', 'founder', 'ceo', 'cto', 'cfo', 'coo', 'vp', 'executive',
  'proprietor', 'partner', 'chairman', 'md', 'gm', 'sr.', 'jr.', 'senior', 'junior'];

const COMPANY_INDICATORS = ['pvt', 'ltd', 'limited', 'llc', 'inc', 'corp', '& co',
  'company', 'industries', 'enterprises', 'solutions', 'technologies',
  'systems', 'group', 'associates', 'partners'];

const SERVICE_KEYWORDS = ['services', 'solutions', 'consulting', 'training', 'development',
  'design', 'manufacturing', 'trading', 'retail', 'wholesale', 'distribution',
  'import', 'export', 'agency', 'consultancy', 'software', 'hardware'];

const ADDR_KEYWORDS = ['road', 'rd', 'street', 'st', 'nagar', 'colony', 'sector', 'building',
  'near', 'opp', 'phase', 'block', 'avenue', 'lane', 'bypass', 'highway', 'floor',
  'plot', 'flat', 'door', 'house', 'office', 'shop', 'suite'];

export function smartClassify(value: string): string {
  const v = value.trim();
  const lower = v.toLowerCase();
  const scores: Record<string, number> = {
    email: 0, phone: 0, website: 0, pincode: 0,
    name: 0, designation: 0, company: 0, service: 0, address: 0, subcompany: 0, other: 0,
  };
  if (EMAIL_RE.test(v)) scores.email += 100;
  if (PINCODE_RE.test(v)) scores.pincode += 90;
  const digits = v.replace(/\D/g, '');
  if (PHONE_RE.test(v) && digits.length >= 7 && digits.length <= 15) scores.phone += 90;
  if (URL_RE.test(v) && !EMAIL_RE.test(v)) scores.website += 85;
  const desigMatches = DESIG_KEYWORDS.filter(k => lower.includes(k)).length;
  scores.designation += desigMatches * 30;
  const companyMatches = COMPANY_INDICATORS.filter(k => lower.includes(k)).length;
  scores.company += companyMatches * 28;
  const serviceMatches = SERVICE_KEYWORDS.filter(k => lower.includes(k)).length;
  scores.service += serviceMatches * 20;
  const addrMatches = ADDR_KEYWORDS.filter(k => lower.split(/\s+/).includes(k)).length;
  scores.address += addrMatches * 25;
  if (digits.length === 6 && /[1-9]/.test(v[0])) scores.address += 15;
  if (v.length > 40) scores.address += 10;
  if (NAME_RE.test(v) && v.split(' ').length >= 2 && v.split(' ').length <= 4
    && v.length < 30 && desigMatches === 0 && companyMatches === 0) {
    scores.name += 40;
    if (/^(mr|ms|mrs|dr|prof|er)[\s.]/i.test(v)) scores.name += 30;
    if (v === v.toUpperCase() && v.split(' ').length === 1) scores.name -= 20;
  }
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore < 10) scores.other += 5;
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function reClassifyFields(fields: FieldItem[]): FieldItem[] {
  return fields.map(field => {
    const smartType = smartClassify(field.value);
    const hardTypes = ['email', 'phone', 'website', 'pincode'];
    if (hardTypes.includes(smartType) && field.type !== smartType) return { ...field, type: smartType };
    if (field.type === 'other' && smartType !== 'other') return { ...field, type: smartType };
    return field;
  });
}

const sendWhatsAppMessage = async (card: ExtendedScannedCard, fields: FieldItem[]) => {
  const get = (type: string, idx = 0) => fields.filter(f => f.type === type)[idx]?.value || '';
  const phone = get('phone').replace(/\D/g, '');
  if (!phone) { Alert.alert("No Phone Number", "Cannot send WhatsApp message without a phone number."); return; }
  const message =
`Hi 👋

This is Scanify App.

Here is the scanned contact information:

👤 Name: ${get('name')}
🏢 Company: ${get('company')}
💼 Designation: ${get('designation')}
📧 Email: ${get('email')}
🌐 Website: ${get('website')}
📍 Address: ${get('address')}

Saved via Scanify Card Scanner.`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  try { await Linking.openURL(url); } catch { Alert.alert("WhatsApp not installed"); }
};

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
const cleanLine = (l: string) => l.replace(/[|\\]/g, '').replace(/\s{2,}/g, ' ').trim();
const normalizeAddress = (a: string) =>
  a.replace(/,\s*,+/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '').trim();

const extractAllFields = (rawText: string): FieldItem[] => {
  const lines = rawText.split('\n').map(cleanLine).filter(l => l.length > 2);
  const fullText = lines.join(' ');
  const fields: FieldItem[] = [];
  let idCounter = 0;

  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = [...new Set([...fullText.matchAll(emailRegex)].map(m => m[0].toLowerCase()))];
  emails.forEach(email => fields.push({ id: `email-${idCounter++}`, type: 'email', value: email, order: fields.length }));

  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;
  const phones = [...new Set([...fullText.matchAll(phoneRegex)].map(m => m[0].trim()))];
  phones.forEach(phone => {
    const d = phone.replace(/\D/g, '');
    if (d.length >= 7 && d.length <= 15) fields.push({ id: `phone-${idCounter++}`, type: 'phone', value: phone, order: fields.length });
  });

  const urlRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s,;)\]"']*)?/g;
  const urls = [...new Set([...fullText.matchAll(urlRegex)].map(m => m[0]))];
  urls.forEach(url => {
    if (!emails.some(e => url.includes(e))) fields.push({ id: `web-${idCounter++}`, type: 'website', value: url, order: fields.length });
  });

  const pincodeRegex = /\b[1-9][0-9]{5}\b/g;
  const pincodes = [...new Set([...fullText.matchAll(pincodeRegex)].map(m => m[0]))];
  pincodes.forEach(pin => fields.push({ id: `pin-${idCounter++}`, type: 'pincode', value: pin, order: fields.length }));

  const nameIndicators = ['mr', 'ms', 'mrs', 'dr', 'prof', 'er'];
  lines.forEach(line => {
    if (line.length > 3 && line.length < 30 && /^[A-Za-z\s.'-]+$/.test(line) && !line.includes('@') && line.split(' ').length <= 3) {
      const words = line.split(' ');
      if (words.length >= 2 || nameIndicators.some(ind => line.toLowerCase().includes(ind)))
        fields.push({ id: `name-${idCounter++}`, type: 'name', value: line.trim(), order: fields.length });
    }
  });

  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (DESIG_KEYWORDS.some(k => lower.includes(k)) && line.length < 50)
      fields.push({ id: `desig-${idCounter++}`, type: 'designation', value: line.trim(), order: fields.length });
  });

  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (COMPANY_INDICATORS.some(ind => lower.includes(ind)) && line.length < 60)
      fields.push({ id: `company-${idCounter++}`, type: 'company', value: line.trim(), order: fields.length });
  });

  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (SERVICE_KEYWORDS.some(k => lower.includes(k)) && line.length < 50)
      fields.push({ id: `service-${idCounter++}`, type: 'service', value: line.trim(), order: fields.length });
  });

  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (ADDR_KEYWORDS.some(k => lower.includes(k)) || pincodes.some(p => line.includes(p)))
      fields.push({ id: `addr-${idCounter++}`, type: 'address', value: normalizeAddress(line.trim()), order: fields.length });
  });

  lines.forEach(line => {
    if (line.length > 3 && line.length < 40 && !fields.some(f => f.value === line) && !/[^\w\s\-.,&@]/.test(line))
      fields.push({ id: `other-${idCounter++}`, type: 'other', value: line.trim(), order: fields.length });
  });

  const seen = new Set();
  const deduped = fields.filter(f => {
    const lower = f.value.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  return reClassifyFields(deduped);
};

async function uriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}

// ─────────────────────────────────────────────────────
// FIELD TYPE META
// ─────────────────────────────────────────────────────
const FieldTypeColors: Record<string, string> = {
  name: colors.amberDark,
  designation: colors.lead,
  company: colors.partner,
  subcompany: '#7c3aed',
  phone: colors.success,
  email: colors.startup,
  website: colors.enterprise,
  address: '#64748b',
  service: colors.vendor,
  pincode: colors.muted,
  other: '#888',
};

const FieldTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  name: 'person-outline',
  designation: 'briefcase-outline',
  company: 'business-outline',
  subcompany: 'git-branch-outline',
  phone: 'call-outline',
  email: 'mail-outline',
  website: 'globe-outline',
  address: 'map-outline',
  service: 'construct-outline',
  pincode: 'location-outline',
  other: 'document-text-outline',
};

const ALL_FIELD_TYPES = ['name', 'designation', 'company', 'subcompany', 'phone', 'email', 'website', 'address', 'service', 'pincode', 'other'];
const fieldLabel = (type: string) => type === 'subcompany' ? 'Sub Company' : type.charAt(0).toUpperCase() + type.slice(1);

// ─────────────────────────────────────────────────────
// TYPE PICKER MODAL
// ─────────────────────────────────────────────────────
function TypePickerModal({ visible, currentType, onSelect, onClose }: {
  visible: boolean; currentType: string; onSelect: (t: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={S.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={S.typePickerBox}>
          <View style={S.handle} />
          <Text style={S.typePickerTitle}>Change Field Type</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALL_FIELD_TYPES.map(t => {
              const color = FieldTypeColors[t] || '#888';
              const icon = FieldTypeIcons[t] || 'ellipse-outline';
              const isSelected = t === currentType;
              return (
                <TouchableOpacity key={t} style={[S.typeRow, isSelected && { backgroundColor: color + '18' }]}
                  onPress={() => { onSelect(t); onClose(); }}>
                  <View style={[S.typeIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={16} color={color} />
                  </View>
                  <Text style={[S.typeLabel, { color: isSelected ? color : colors.text }]}>{fieldLabel(t)}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={color} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// INLINE FIELD ROW
// ─────────────────────────────────────────────────────
function InlineFieldRow({ field, isEditMode, onUpdate, onDelete, onChangeType, onCopy }: {
  field: FieldItem; isEditMode: boolean;
  onUpdate: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  onChangeType: (id: string, newType: string) => void;
  onCopy: (value: string, type: string) => void;
}) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const color = FieldTypeColors[field.type] || '#888';
  const icon = FieldTypeIcons[field.type] || 'ellipse-outline';

  if (isEditMode) {
    return (
      <>
        <View style={S.editRow}>
          <TouchableOpacity style={[S.typeBadge, { backgroundColor: color + '18', borderColor: color + '55' }]}
            onPress={() => setShowTypePicker(true)}>
            <Ionicons name={icon} size={10} color={color} />
            <Text style={[S.typeBadgeText, { color }]} numberOfLines={1}>{fieldLabel(field.type)}</Text>
            <Ionicons name="chevron-down" size={9} color={color} />
          </TouchableOpacity>
          <TextInput
            style={S.editInput}
            value={field.value}
            onChangeText={val => onUpdate(field.id, val)}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity style={S.delBtn} onPress={() => onDelete(field.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close-circle" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <TypePickerModal visible={showTypePicker} currentType={field.type}
          onSelect={newType => onChangeType(field.id, newType)} onClose={() => setShowTypePicker(false)} />
      </>
    );
  }

  return (
    <TouchableOpacity style={scanStyles.draggableItem} onPress={() => onCopy(field.value, field.type)} activeOpacity={0.65}>
      <View style={[scanStyles.fieldIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={scanStyles.fieldContent}>
        <Text style={[scanStyles.fieldType, { color }]}>{field.type === 'subcompany' ? 'SUB COMPANY' : field.type.toUpperCase()}</Text>
        <Text style={[scanStyles.fieldValue, { color: colors.text }]} numberOfLines={2}>{field.value}</Text>
      </View>
      <Ionicons name="copy-outline" size={14} color={colors.muted} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────
// ADD FIELD ROW
// ─────────────────────────────────────────────────────
function AddFieldRow({ onAdd }: { onAdd: (type: string, value: string) => void }) {
  const [newType, setNewType] = useState('name');
  const [newValue, setNewValue] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const color = FieldTypeColors[newType] || '#888';
  const icon = FieldTypeIcons[newType] || 'ellipse-outline';

  const handleAdd = () => {
    if (!newValue.trim()) return;
    onAdd(newType, newValue.trim());
    setNewValue('');
  };

  return (
    <>
      <View style={S.addRow}>
        <TouchableOpacity style={[S.typeBadge, { backgroundColor: color + '18', borderColor: color + '55' }]}
          onPress={() => setShowTypePicker(true)}>
          <Ionicons name={icon} size={10} color={color} />
          <Text style={[S.typeBadgeText, { color }]} numberOfLines={1}>{fieldLabel(newType)}</Text>
          <Ionicons name="chevron-down" size={9} color={color} />
        </TouchableOpacity>
        <TextInput
          style={S.addInput}
          value={newValue}
          onChangeText={setNewValue}
          placeholder={`Add ${fieldLabel(newType)}...`}
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          autoCorrect={false}
        />
        <TouchableOpacity style={[S.addBtn, { backgroundColor: newValue.trim() ? colors.amber : '#e2e8f0' }]}
          onPress={handleAdd} disabled={!newValue.trim()}>
          <Ionicons name="add" size={20} color={newValue.trim() ? colors.navy : '#94a3b8'} />
        </TouchableOpacity>
      </View>
      <TypePickerModal visible={showTypePicker} currentType={newType} onSelect={setNewType} onClose={() => setShowTypePicker(false)} />
    </>
  );
}

// ─────────────────────────────────────────────────────
// CAMERA SCANNER
// ─────────────────────────────────────────────────────
function CameraScanner({ onCapture, onClose }: {
  onCapture: (uri: string) => void;
  onClose: () => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  if (!permission) return <ActivityIndicator style={{ flex: 1 }} color={colors.amber} />;

  if (!permission.granted) {
    return (
      <View style={[CameraStyles.center, { backgroundColor: colors.phoneBg }]}>
        <Ionicons name="camera-outline" size={52} color={colors.amber} />
        <Text style={[CameraStyles.permText, { color: colors.text }]}>Camera permission required</Text>
        <TouchableOpacity style={[CameraStyles.permBtn, { backgroundColor: colors.amber }]} onPress={requestPermission}>
          <Text style={{ color: colors.navy, fontWeight: '700', fontSize: 15 }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.95, skipProcessing: false });
      if (photo?.uri) {
        const processed = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        onCapture(processed.uri);
      }
    } catch (e: any) {
      Alert.alert('Capture Failed', e.message ?? 'Unknown error');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={CameraStyles.overlayTop} />
      <View style={CameraStyles.overlayBottom} />
      <View style={CameraStyles.overlayLeft} />
      <View style={CameraStyles.overlayRight} />
      <View style={[CameraStyles.cardFrame, { borderColor: colors.amber }]} />
      <View style={CameraStyles.hint}>
        <Ionicons name="card-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
        <Text style={CameraStyles.hintText}>Align business card inside the frame</Text>
      </View>
      <View style={CameraStyles.controls}>
        <TouchableOpacity style={CameraStyles.cancelBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={CameraStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[CameraStyles.captureBtn, { backgroundColor: colors.amber }]}
          onPress={handleCapture}
          disabled={capturing}
        >
          {capturing
            ? <ActivityIndicator size="small" color={colors.navy} />
            : <><Ionicons name="camera" size={20} color={colors.navy} /><Text style={CameraStyles.captureText}>Capture</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const S = StyleSheet.create({
  editRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    marginBottom: 6, borderWidth: 1.5, borderColor: colors.amber + '55',
    gap: 6, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 5,
    borderRadius: 7, borderWidth: 1, width: 82, flexShrink: 0,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2, flex: 1 },
  editInput: {
    flex: 1, fontSize: 13, color: colors.text,
    paddingVertical: 5, paddingHorizontal: 8,
    backgroundColor: '#f8fafc', borderRadius: 7, minHeight: 34,
  },
  delBtn: { width: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    marginTop: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.amber, gap: 6,
  },
  addInput: {
    flex: 1, fontSize: 13, color: colors.text,
    paddingVertical: 5, paddingHorizontal: 8,
    backgroundColor: '#f8fafc', borderRadius: 7, minHeight: 34,
  },
  addBtn: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  typePickerBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, paddingBottom: 40, maxHeight: '72%',
  },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', alignSelf: 'center', marginBottom: 14 },
  typePickerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, textAlign: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, gap: 12, marginBottom: 2 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  actionBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: colors.navy, gap: 6,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)', minHeight: 38,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  reclassifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.amber + '15', borderRadius: 9,
    paddingHorizontal: 10, paddingVertical: 9,
    marginBottom: 10, borderWidth: 1, borderColor: colors.amber + '35',
  },
  reclassifyText: { fontSize: 11, color: colors.amberDark, flex: 1, lineHeight: 15 },
  stickyBar: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 2 },
  stickyCancel: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 11,
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5',
  },
  stickyCancelText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  stickySave: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 11, backgroundColor: colors.amber,
  },
  stickySaveText: { fontSize: 13, fontWeight: '700', color: colors.navy },
  scanBtnWrap: { margin: 16, borderRadius: 16, overflow: 'hidden' },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 16, backgroundColor: colors.amber,
  },
  scanBtnText: { fontSize: 16, fontWeight: '800', color: colors.navy, letterSpacing: 0.4 },
  // ── Dual image styles ──
  dualImageWrap: { flexDirection: 'row', height: 160, backgroundColor: '#000', position: 'relative' },
  dualImageHalf: { flex: 1, position: 'relative', overflow: 'hidden' },
  dualImage: { width: '100%', height: '100%' },
  dualDivider: { width: 2, backgroundColor: colors.amber },
  imageSideLabel: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.amber + 'cc', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  imageSideLabelText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  dualBadge: {
    position: 'absolute', top: 8, left: '50%', transform: [{ translateX: -44 }],
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.amber, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  dualBadgeText: { fontSize: 10, fontWeight: '700', color: colors.navy },
  dualInfoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.amber + '15', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10,
    borderWidth: 1, borderColor: colors.amber + '40',
  },
  dualInfoText: { fontSize: 11, color: colors.amberDark, flex: 1, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────
export default function ScanScreen() {
  const { cards, addCard, deleteCard, updateCard } = useCards();
  const { addContact, loading: savingContact } = useContact();
  const { setMenuVisible } = useMenuVisibility(); // ← controls floating button visibility

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [localFields, setLocalFields] = useState<FieldItem[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingFrontUri, setPendingFrontUri] = useState<string | null>(null);

  // ── Open camera: hide floating button ──
  const openCamera = useCallback(() => {
    setMenuVisible(false);
    setShowCamera(true);
  }, [setMenuVisible]);

  // ── Close camera: restore floating button ──
  const closeCamera = useCallback(() => {
    setShowCamera(false);
    setMenuVisible(true);
  }, [setMenuVisible]);

  // ── OCR ──
  const runOCR = async (uri: string): Promise<string> => {
    try {
      const result = await MlkitOcr.detectFromUri(uri);
      if (!result?.length) return '';
      return result.map((block: any) => {
        if (block.lines) return block.lines.map((line: any) =>
          line.elements ? line.elements.map((el: any) => el.text || '').join(' ') : (line.text || '')
        ).join('\n');
        return block.text || '';
      }).join('\n');
    } catch { return ''; }
  };

  // ── Build & store a card from one or two URIs ──
  const buildAndStoreCard = useCallback(async (frontUri: string, backUri?: string) => {
    setIsProcessing(true);
    try {
      const frontText = await runOCR(frontUri);
      const backText  = backUri ? await runOCR(backUri) : '';

      if (!frontText.trim() && !backText.trim()) {
        Alert.alert('No Text Detected', 'Could not read text from the image. Try again with better lighting.');
        return;
      }

      let fields: FieldItem[];
      let fullText: string;

      if (backUri && backText.trim()) {
        // Merge front + back, deduplicate
        const frontFields = extractAllFields(frontText);
        const backFields  = extractAllFields(backText);
        const seen = new Set(frontFields.map(f => f.value.toLowerCase()));
        const merged = [...frontFields];
        backFields.forEach(f => {
          if (!seen.has(f.value.toLowerCase())) { merged.push(f); seen.add(f.value.toLowerCase()); }
        });
        merged.forEach((f, i) => { f.order = i; });
        fields   = merged;
        fullText = `${frontText}\n\n--- BACK ---\n\n${backText}`;
      } else {
        fields   = extractAllFields(frontText);
        fullText = frontText;
      }

      const card: ExtendedScannedCard = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        uri: frontUri,
        ...(backUri ? { backUri, hasBothSides: true } : {}),
        data: { fullText } as OCRData,
        fields,
        tags: [],
        createdAt: new Date().toISOString(),
        exported: false,
      };

      addCard(card);
      setExpandedId(card.id);
      setLocalFields((card.fields || []).map(f => ({ ...f })));
      setEditingCardId(card.id);
    } catch (e: any) {
      Alert.alert('Processing Failed', e.message ?? 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  }, [addCard]);

  // ── Camera captured ──
  // Closes camera (restores menu), then asks about back side on first capture.
  const handleCaptured = useCallback(async (uri: string) => {
    // Always close camera + restore floating button first
    setShowCamera(false);
    setMenuVisible(true);

    if (pendingFrontUri) {
      // BACK side — merge with stored front
      const front = pendingFrontUri;
      setPendingFrontUri(null);
      await buildAndStoreCard(front, uri);
    } else {
      // FRONT side — ask if there is a back
      Alert.alert(
        'Front Side Captured',
        'Does this card have a back side to scan?',
        [
          {
            text: 'No, Done',
            style: 'default',
            onPress: () => buildAndStoreCard(uri),
          },
          {
            text: 'Yes, Scan Back',
            onPress: () => {
              setPendingFrontUri(uri);
              openCamera(); // hides menu again for back-side scan
            },
          },
        ]
      );
    }
  }, [pendingFrontUri, buildAndStoreCard, openCamera, setMenuVisible]);

  // ── INLINE EDIT ──
  const startEditing = useCallback((card: ExtendedScannedCard) => {
    setLocalFields((card.fields || []).map(f => ({ ...f })));
    setEditingCardId(card.id);
    setExpandedId(card.id);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCardId(null);
    setLocalFields([]);
  }, []);

  const saveEditing = useCallback(async (cardId: string) => {
    const card = (cards as ExtendedScannedCard[]).find(c => c.id === cardId);
    if (!card) return;

    const reordered = localFields.map((f, i) => ({ ...f, order: i }));
    const updatedCard = { ...card, fields: reordered } as unknown as ScannedCard;
    updateCard(cardId, updatedCard);

    setIsSavingEdit(true);
    try {
      const get = (type: string, idx = 0) => reordered.filter(f => f.type === type)[idx]?.value || '';
      const frontImageAsString = await uriToBase64(card.uri);
      const backImageAsString  = card.hasBothSides && card.backUri ? await uriToBase64(card.backUri) : '';

      await addContact({
        companyName:        get('company'),
        subCompanyName:     get('subcompany'),
        branchName:         '',
        personName:         get('name'),
        designation:        get('designation'),
        phoneNumber1:       get('phone', 0),
        phoneNumber2:       get('phone', 1),
        phoneNumber3:       get('phone', 2),
        email1:             get('email', 0),
        email2:             get('email', 1),
        address:            get('address'),
        servicesCsv:        reordered.filter(f => f.type === 'service').map(f => f.value).join(', '),
        website1:           get('website', 0),
        website2:           get('website', 1),
        rawExtractedText:   (card.data as any)?.fullText || '',
        frontImageAsString,
        frontImageMimeType: 'image/jpeg',
        backImageAsString,
        backImageMimeType:  'image/jpeg',
      });

     Alert.alert(
  'Contact Saved ✅',
  'Do you want to send this contact info via WhatsApp?',
  [
    {
      text: 'No',
      style: 'cancel',
      onPress: () => {
        deleteCard(card.id);   // clear card
        router.replace('/(tabs)/contacts');
      },
    },
    {
      text: 'Send WhatsApp',
      onPress: () => {
        sendWhatsAppMessage(card, reordered);
        deleteCard(card.id);   // clear card
        router.replace('/(tabs)/contacts');
      },
    },
  ]
);

    } catch (e: any) {
      Alert.alert('Save Failed', extractApiError(e));
    } finally {
      setIsSavingEdit(false);
      setEditingCardId(null);
      setLocalFields([]);
    }
  }, [cards, localFields, updateCard, addContact]);

  const updateLocalField     = useCallback((id: string, value: string)   => setLocalFields(prev => prev.map(f => f.id === id ? { ...f, value } : f)), []);
  const deleteLocalField     = useCallback((id: string)                   => setLocalFields(prev => prev.filter(f => f.id !== id)), []);
  const changeLocalFieldType = useCallback((id: string, newType: string) => setLocalFields(prev => prev.map(f => f.id === id ? { ...f, type: newType } : f)), []);
  const addLocalField        = useCallback((type: string, value: string) => setLocalFields(prev => [...prev, { id: `${type}-${Date.now()}`, type, value, order: prev.length }]), []);

  const handleSmartReclassify = useCallback(() => {
    const reclassified = reClassifyFields(localFields);
    const changedCount = reclassified.filter((f, i) => f.type !== localFields[i]?.type).length;
    setLocalFields(reclassified);
    const card = (cards as ExtendedScannedCard[]).find(c => c.id === editingCardId);
    Alert.alert(
      changedCount > 0 ? `Re-classified ✨ (${changedCount} fixed)` : 'All Good!',
      changedCount > 0
        ? `${changedCount} field${changedCount > 1 ? 's were' : ' was'} auto-fixed.`
        : 'All field types look correct.',
      [
        { text: 'OK', style: 'cancel' },
        ...(card ? [{ text: 'Send WhatsApp', onPress: () => sendWhatsAppMessage(card, reclassified) }] : []),
      ]
    );
  }, [localFields, cards, editingCardId]);

  const handleSaveContact = async (card: ExtendedScannedCard) => {
    const fields = card.fields || [];
    const get = (type: string, idx = 0) => fields.filter(f => f.type === type)[idx]?.value || '';
    try {
      const frontImageAsString = await uriToBase64(card.uri);
      const backImageAsString  = card.hasBothSides && card.backUri ? await uriToBase64(card.backUri) : '';
      await addContact({
        companyName:        get('company'),
        subCompanyName:     get('subcompany'),
        branchName:         '',
        personName:         get('name'),
        designation:        get('designation'),
        phoneNumber1:       get('phone', 0),
        phoneNumber2:       get('phone', 1),
        phoneNumber3:       get('phone', 2),
        email1:             get('email', 0),
        email2:             get('email', 1),
        address:            get('address'),
        servicesCsv:        fields.filter(f => f.type === 'service').map(f => f.value).join(', '),
        website1:           get('website', 0),
        website2:           get('website', 1),
        rawExtractedText:   (card.data as any)?.fullText || '',
        frontImageAsString,
        frontImageMimeType: 'image/jpeg',
        backImageAsString,
        backImageMimeType:  'image/jpeg',
      });
     Alert.alert(
  'Contact Saved ✅',
  'Contact saved successfully. Do you want to send this contact via WhatsApp?',
  [
    {
      text: 'No',
      style: 'cancel',
      onPress: () => {
        deleteCard(card.id);   // remove scanned card
        router.replace('/(tabs)/contacts');
      }
    },
    {
      text: 'Send WhatsApp',
      onPress: () => {
        sendWhatsAppMessage(card, fields);  // send message
        deleteCard(card.id);                // remove scanned card
        router.replace('/(tabs)/contacts');
      }
    }
  ]
);

    } catch (e: any) {
      Alert.alert('Save Failed', extractApiError(e));
    }
  };

  const copyAll = async (card: ExtendedScannedCard) => {
    const text = (card.fields || []).map(f => `${f.type.toUpperCase()}: ${f.value}`).join('\n');
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'All fields copied to clipboard');
  };

  const handleCopyField = async (value: string, type: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${type} copied`);
  };

  // ── Render card ──
  const renderCard = ({ item }: { item: ExtendedScannedCard }) => {
    const isExpanded = expandedId === item.id;
    const isEditing  = editingCardId === item.id;
    const displayFields = isEditing
      ? [...localFields].sort((a, b) => a.order - b.order)
      : (item.fields || []).sort((a, b) => a.order - b.order);
    const cardName = item.fields?.find(f => f.type === 'name')?.value || 'Business Card';

    return (
      <View style={[scanStyles.card, { backgroundColor: colors.white }]}>
        {/* Image — single or dual side */}
        {item.hasBothSides && item.backUri ? (
          <View style={S.dualImageWrap}>
            <View style={S.dualImageHalf}>
              <Image source={{ uri: item.uri }} style={S.dualImage} contentFit="cover" />
              <View style={S.imageSideLabel}>
                <Ionicons name="arrow-forward-circle" size={12} color="#fff" />
                <Text style={S.imageSideLabelText}>FRONT</Text>
              </View>
            </View>
            <View style={S.dualDivider} />
            <View style={S.dualImageHalf}>
              <Image source={{ uri: item.backUri }} style={S.dualImage} contentFit="cover" />
              <View style={[S.imageSideLabel, { backgroundColor: colors.navy + 'cc' }]}>
                <Ionicons name="arrow-back-circle" size={12} color="#fff" />
                <Text style={S.imageSideLabelText}>BACK</Text>
              </View>
            </View>
            <View style={S.dualBadge}>
              <Ionicons name="swap-horizontal" size={11} color={colors.navy} />
              <Text style={S.dualBadgeText}>Front & Back</Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: item.uri }} style={scanStyles.cardImage} contentFit="cover" />
        )}

        {/* Delete */}
        <TouchableOpacity style={scanStyles.deleteBtn}
          onPress={() => Alert.alert('Delete Card', 'Remove this card?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { if (editingCardId === item.id) cancelEditing(); deleteCard(item.id); } },
          ])}>
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        {/* Action bar */}
        <View style={S.actionBar}>
          <TouchableOpacity style={S.actionBtn} onPress={() => copyAll(item)}>
            <Ionicons name="copy-outline" size={13} color="#fff" />
            <Text style={S.actionBtnText}>Copy All</Text>
          </TouchableOpacity>

          {isEditing ? (
            <>
              <TouchableOpacity style={[S.actionBtn, { backgroundColor: '#ef4444cc' }]}
                onPress={cancelEditing} disabled={isSavingEdit}>
                <Ionicons name="close" size={13} color="#fff" />
                <Text style={S.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.actionBtn, { backgroundColor: colors.amber, flex: 1.5 }]}
                onPress={() => saveEditing(item.id)} disabled={isSavingEdit}>
                {isSavingEdit
                  ? <ActivityIndicator size="small" color={colors.navy} />
                  : <><Ionicons name="checkmark" size={13} color={colors.navy} /><Text style={[S.actionBtnText, { color: colors.navy }]}>Save</Text></>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Next Card — uses openCamera so menu hides again */}
              <TouchableOpacity style={[S.actionBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                onPress={openCamera}>
                <Ionicons name="scan-outline" size={13} color="#fff" />
                <Text style={S.actionBtnText}>Next Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.actionBtn, { backgroundColor: colors.amber }]}
                onPress={() => startEditing(item)}>
                <Ionicons name="create-outline" size={13} color={colors.navy} />
                <Text style={[S.actionBtnText, { color: colors.navy }]}>Edit</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Header row */}
        <TouchableOpacity
          style={[scanStyles.cardHeader, { borderTopColor: colors.border }]}
          onPress={() => { if (!isEditing) setExpandedId(isExpanded ? null : item.id); }}
          activeOpacity={0.7}
        >
          <View style={[scanStyles.avatar, { backgroundColor: colors.amberLight }]}>
            <Text style={[scanStyles.avatarText, { color: colors.amberDark }]}>{cardName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={scanStyles.cardInfo}>
            <Text style={[scanStyles.cardName, { color: colors.text }]} numberOfLines={1}>{cardName}</Text>
            <Text style={[scanStyles.cardDetail, { color: colors.muted }]}>
              {displayFields.length} fields{isEditing ? ' · ✏️ editing' : ''}
            </Text>
          </View>
          {!isEditing && <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />}
        </TouchableOpacity>

        {/* Expanded / editing */}
        {isExpanded && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120}>
            <View style={[scanStyles.details, { paddingBottom: isEditing ? 8 : 16 }]}>

              {/* Dual side info banner */}
              {item.hasBothSides && (
                <View style={S.dualInfoBanner}>
                  <Ionicons name="swap-horizontal" size={14} color={colors.amber} />
                  <Text style={S.dualInfoText}>Fields merged from front & back sides</Text>
                </View>
              )}

              {/* Smart re-classify banner */}
              {isEditing && (
                <TouchableOpacity style={S.reclassifyBanner} onPress={handleSmartReclassify}>
                  <Ionicons name="sparkles" size={15} color={colors.amberDark} />
                  <Text style={S.reclassifyText}>Auto-fix field types — detects swapped name/designation etc.</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.amber} />
                </TouchableOpacity>
              )}

              {/* Fields */}
              {displayFields.map(field => (
                <InlineFieldRow key={field.id} field={field} isEditMode={isEditing}
                  onUpdate={updateLocalField} onDelete={deleteLocalField}
                  onChangeType={changeLocalFieldType} onCopy={handleCopyField} />
              ))}

              {/* Add field */}
              {isEditing && <AddFieldRow onAdd={addLocalField} />}

              {/* Bottom sticky bar — edit mode */}
              {isEditing && (
                <View style={S.stickyBar}>
                  <TouchableOpacity style={S.stickyCancel} onPress={cancelEditing} disabled={isSavingEdit}>
                    <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
                    <Text style={S.stickyCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.stickySave} onPress={() => saveEditing(item.id)} disabled={isSavingEdit}>
                    {isSavingEdit
                      ? <ActivityIndicator size="small" color={colors.navy} />
                      : <><Ionicons name="checkmark-circle-outline" size={16} color={colors.navy} /><Text style={S.stickySaveText}>Save & Sync Contact</Text></>
                    }
                  </TouchableOpacity>
                </View>
              )}

              {/* Read mode */}
              {!isEditing && (
                <>
                  <TouchableOpacity
                    style={[scanStyles.rawButton, { backgroundColor: colors.amber + '15', borderColor: colors.amber, marginTop: 4 }]}
                    onPress={() => handleSaveContact(item)} disabled={savingContact}>
                    {savingContact
                      ? <ActivityIndicator size="small" color={colors.amber} />
                      : <><Ionicons name="person-add-outline" size={14} color={colors.amberDark} /><Text style={[scanStyles.rawButtonText, { color: colors.amberDark }]}>Save as Contact</Text></>
                    }
                  </TouchableOpacity>
                  {item.data && (
                    <TouchableOpacity
                      style={[scanStyles.rawButton, { backgroundColor: colors.bg, borderColor: colors.border }]}
                      onPress={() => Alert.alert('Raw OCR Text', (item.data as any).fullText || 'No text')}>
                      <Ionicons name="document-text-outline" size={14} color={colors.amberDark} />
                      <Text style={[scanStyles.rawButtonText, { color: colors.amberDark }]}>View Raw OCR Text</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    );
  };

  // ── Camera full-screen — menu is already hidden ──
  if (showCamera) {
    return <CameraScanner onCapture={handleCaptured} onClose={closeCamera} />;
  }

  return (
    <View style={[scanStyles.container, { backgroundColor: colors.phoneBg }]}>
      {/* Header */}
      <View style={[scanStyles.header, { backgroundColor: colors.navy }]}>
        <View style={scanStyles.headerGlow} />
        <View>
          <Text style={scanStyles.greetText}>SCAN BUSINESS CARDS</Text>
          <Text style={scanStyles.titleText}>Card <Text style={scanStyles.titleSpan}>Scanner</Text></Text>
        </View>
        <View style={[scanStyles.badge, { backgroundColor: colors.amber + '20' }]}>
          <Ionicons name="scan-outline" size={16} color={colors.amber} />
          <Text style={[scanStyles.badgeText, { color: colors.amber }]}>ML Kit</Text>
        </View>
      </View>

      {/* Big Scan Button */}
      <View style={S.scanBtnWrap}>
        <TouchableOpacity
          style={S.scanBtn}
          onPress={openCamera}
          disabled={isProcessing}
          activeOpacity={0.82}
        >
          {isProcessing
            ? <><ActivityIndicator size="small" color={colors.navy} /><Text style={S.scanBtnText}>Processing...</Text></>
            : <><Ionicons name="camera" size={26} color={colors.navy} /><Text style={S.scanBtnText}>Scan Card</Text></>
          }
        </TouchableOpacity>
      </View>

      {/* Cards list */}
      <FlatList
        data={cards as ExtendedScannedCard[]}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={scanStyles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={!isProcessing ? (
          <View style={scanStyles.emptyContainer}>
            <View style={[scanStyles.emptyIcon, { backgroundColor: colors.amberLight }]}>
              <Ionicons name="scan-outline" size={48} color={colors.amberDark} />
            </View>
            <Text style={[scanStyles.emptyTitle, { color: colors.text }]}>No cards scanned yet</Text>
            <Text style={[scanStyles.emptyText, { color: colors.muted }]}>Tap "Scan Card" to get started</Text>
          </View>
        ) : null}
      />
    </View>
  );
}