// app/(tabs)/scan.tsx
import React, { useState, useRef } from 'react';
import {
  Text, View, StyleSheet, Alert, FlatList,
  TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import MlkitOcr from 'react-native-mlkit-ocr';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

import { useCards, ScannedCard, OCRData } from '@/components/store/useCardStore';
import { colors } from '@/constants/colors';
import { CameraStyles, scanStyles } from '@/components/styles/scanStyles';

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────
interface FieldItem {
  id: string;
  type: string; // 'name', 'phone', 'email', etc.
  value: string;
  order: number;
}

// Extend the ScannedCard type to include fields
interface ExtendedScannedCard extends ScannedCard {
  fields?: FieldItem[];
  backUri?: string;
  hasBothSides?: boolean;
}

// Proper OCRData structure
interface ExtendedOCRData {
  fullText: string;
  names?: string[];
  phones?: string[];
  emails?: string[];
  addresses?: string[];
}

// ─────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────
const cleanLine = (l: string) =>
  l.replace(/[|\\]/g, '').replace(/\s{2,}/g, ' ').trim();

const normalizeAddress = (a: string) =>
  a.replace(/,\s*,+/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '').trim();

// Extract ALL possible fields from text
const extractAllFields = (rawText: string): FieldItem[] => {
  const lines = rawText.split('\n').map(cleanLine).filter(l => l.length > 2);
  const fullText = lines.join(' ');
  const fields: FieldItem[] = [];
  let idCounter = 0;

  // 1. EMAILS
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = [...new Set([...fullText.matchAll(emailRegex)].map(m => m[0].toLowerCase()))];
  emails.forEach(email => {
    fields.push({ id: `email-${idCounter++}`, type: 'email', value: email, order: fields.length });
  });

  // 2. PHONES (Indian & International)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;
  const phones = [...new Set([...fullText.matchAll(phoneRegex)].map(m => m[0].trim()))];
  phones.forEach(phone => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      fields.push({ id: `phone-${idCounter++}`, type: 'phone', value: phone, order: fields.length });
    }
  });

  // 3. WEBSITES
  const urlRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s,;)\]"']*)?/g;
  const urls = [...new Set([...fullText.matchAll(urlRegex)].map(m => m[0]))];
  urls.forEach(url => {
    fields.push({ id: `web-${idCounter++}`, type: 'website', value: url, order: fields.length });
  });

  // 4. PINCODES
  const pincodeRegex = /\b[1-9][0-9]{5}\b/g;
  const pincodes = [...new Set([...fullText.matchAll(pincodeRegex)].map(m => m[0]))];
  pincodes.forEach(pin => {
    fields.push({ id: `pin-${idCounter++}`, type: 'pincode', value: pin, order: fields.length });
  });

  // 5. NAMES (lines that look like names)
  const nameIndicators = ['mr', 'ms', 'mrs', 'dr', 'prof', 'er'];
  lines.forEach(line => {
    if (line.length > 3 && line.length < 30 && 
        /^[A-Za-z\s.'-]+$/.test(line) && 
        !/\d/.test(line) && 
        !line.includes('@') &&
        line.split(' ').length <= 3) {
      // Check if it might be a name (not common words)
      const words = line.split(' ');
      if (words.length >= 2 || nameIndicators.some(ind => line.toLowerCase().includes(ind))) {
        fields.push({ id: `name-${idCounter++}`, type: 'name', value: line.trim(), order: fields.length });
      }
    }
  });

  // 6. DESIGNATIONS
  const desigKeywords = ['manager', 'director', 'engineer', 'developer', 'designer', 
    'officer', 'president', 'head', 'lead', 'specialist', 'analyst', 'consultant', 
    'associate', 'founder', 'ceo', 'cto', 'cfo', 'coo', 'vp', 'executive', 
    'proprietor', 'partner', 'chairman', 'md', 'gm'];
  
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (desigKeywords.some(k => lower.includes(k)) && line.length < 50) {
      fields.push({ id: `desig-${idCounter++}`, type: 'designation', value: line.trim(), order: fields.length });
    }
  });

  // 7. COMPANIES
  const companyIndicators = ['pvt', 'ltd', 'limited', 'llc', 'inc', 'corp', '& co', 'company', 'industries', 'enterprises', 'solutions', 'technologies', 'systems', 'group', 'associates', 'partners'];
  
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (companyIndicators.some(ind => lower.includes(ind)) && line.length < 60) {
      fields.push({ id: `company-${idCounter++}`, type: 'company', value: line.trim(), order: fields.length });
    }
  });

  // 8. SERVICES
  const serviceKeywords = ['services', 'solutions', 'consulting', 'training', 'development', 
    'design', 'manufacturing', 'trading', 'retail', 'wholesale', 'distribution', 
    'import', 'export', 'agency', 'consultancy', 'software', 'hardware', 'it', 'hr', 'marketing'];
  
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (serviceKeywords.some(k => lower.includes(k)) && line.length < 50) {
      fields.push({ id: `service-${idCounter++}`, type: 'service', value: line.trim(), order: fields.length });
    }
  });

  // 9. ADDRESSES (lines that look like addresses)
  const addrKeywords = ['road', 'rd', 'street', 'st', 'nagar', 'colony', 'sector', 'building', 
    'near', 'opp', 'phase', 'block', 'avenue', 'lane', 'bypass', 'highway', 'floor', 
    'plot', 'flat', 'door', 'house', 'office', 'shop', 'suite'];
  
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if (addrKeywords.some(k => lower.includes(k)) || pincodes.some(p => line.includes(p))) {
      fields.push({ id: `addr-${idCounter++}`, type: 'address', value: normalizeAddress(line.trim()), order: fields.length });
    }
  });

  // 10. Any remaining lines that might be useful (catch-all for other potential fields)
  lines.forEach(line => {
    if (line.length > 3 && line.length < 40 && 
        !fields.some(f => f.value === line) && 
        !/[^\w\s\-.,&@]/.test(line)) {
      fields.push({ id: `other-${idCounter++}`, type: 'other', value: line.trim(), order: fields.length });
    }
  });

  // Remove duplicates (case insensitive)
  const seen = new Set();
  return fields.filter(f => {
    const lower = f.value.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
};

// ─────────────────────────────────────────────────────
// IMAGE CROP COMPONENT
// ─────────────────────────────────────────────────────
function ImageCropper({ 
  uri, 
  onCrop, 
  onCancel 
}: { 
  uri: string; 
  onCrop: (croppedUri: string) => void; 
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const cropImage = async () => {
    setLoading(true);
    try {
      // Simple crop - in production you might want a proper crop UI
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // You can add crop here if needed
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      onCrop(result.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to crop image');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Image source={{ uri }} style={StyleSheet.absoluteFillObject} contentFit="contain" />
      <View style={[CameraStyles.overlayTop, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      <View style={[CameraStyles.overlayBottom, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      <View style={[CameraStyles.overlayLeft, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      <View style={[CameraStyles.overlayRight, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      <View style={[CameraStyles.cardFrame, { borderColor: colors.amber, borderWidth: 2 }]} />
      
      <View style={CameraStyles.controls}>
        <TouchableOpacity style={CameraStyles.cancelBtn} onPress={onCancel}>
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={CameraStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[CameraStyles.captureBtn, { backgroundColor: colors.amber }]}
          onPress={cropImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <>
              <Ionicons name="crop" size={20} color={colors.navy} />
              <Text style={CameraStyles.captureText}>Crop & Continue</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// CAMERA COMPONENT
// ─────────────────────────────────────────────────────
type ScanMode = 'single' | 'front' | 'back';

function CameraScanner({ 
  onCapture, 
  onClose,
  mode = 'single',
  onFrontCaptured,
}: { 
  onCapture: (uri: string) => void; 
  onClose: () => void;
  mode?: ScanMode;
  onFrontCaptured?: (uri: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCrop, setShowCrop] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  if (!permission) return <ActivityIndicator style={{ flex: 1 }} color={colors.amber} />;
  if (!permission.granted) {
    return (
      <View style={[CameraStyles.center, { backgroundColor: colors.phoneBg }]}>
        <Ionicons name="camera-outline" size={52} color={colors.amber} />
        <Text style={[CameraStyles.permText, { color: colors.text }]}>Camera permission required</Text>
        <TouchableOpacity 
          style={[CameraStyles.permBtn, { backgroundColor: colors.amber }]} 
          onPress={requestPermission}
        >
          <Text style={{ color: colors.navy, fontWeight: '700', fontSize: 15 }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ 
        quality: 0.95, 
        skipProcessing: false 
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setShowCrop(true);
      }
    } catch (e: any) {
      Alert.alert('Capture Failed', e.message ?? 'Unknown error');
    }
  };

  const handleCropComplete = (croppedUri: string) => {
    if (mode === 'front' && onFrontCaptured) {
      onFrontCaptured(croppedUri);
    } else {
      onCapture(croppedUri);
    }
    setShowCrop(false);
  };

  if (showCrop && capturedUri) {
    return (
      <ImageCropper 
        uri={capturedUri} 
        onCrop={handleCropComplete}
        onCancel={() => setShowCrop(false)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={CameraStyles.overlayTop} /><View style={CameraStyles.overlayBottom} />
      <View style={CameraStyles.overlayLeft} /><View style={CameraStyles.overlayRight} />
      <View style={[CameraStyles.cardFrame, { borderColor: colors.amber }]} />
      
      <View style={[CameraStyles.modeIndicator, { backgroundColor: mode === 'front' ? colors.amber : colors.navy }]}>
        <Ionicons 
          name={mode === 'front' ? 'arrow-forward' : mode === 'back' ? 'arrow-back' : 'card-outline'} 
          size={14} 
          color="#fff" 
        />
        <Text style={CameraStyles.modeText}>
          {mode === 'front' ? 'FRONT SIDE' : mode === 'back' ? 'BACK SIDE' : 'SINGLE CARD'}
        </Text>
      </View>

      <View style={CameraStyles.hint}>
        <Ionicons name="card-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
        <Text style={CameraStyles.hintText}>
          {mode === 'front' ? '📸 Scan FRONT side' : 
           mode === 'back' ? '📸 Scan BACK side' : 
           'Align card inside frame'}
        </Text>
      </View>
      
      <View style={CameraStyles.controls}>
        <TouchableOpacity style={CameraStyles.cancelBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={CameraStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[CameraStyles.captureBtn, { backgroundColor: colors.amber }]}
          onPress={handleCapture}
        >
          <Ionicons name="camera" size={20} color={colors.navy} />
          <Text style={CameraStyles.captureText}>Capture</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// DRAGGABLE FIELD COMPONENT
// ─────────────────────────────────────────────────────
interface DraggableFieldItemProps {
  item: FieldItem;
  drag: () => void;
  isActive: boolean;
  onCopy: (value: string, type: string) => void;
}

const FieldTypeColors: Record<string, string> = {
  name: colors.amberDark,
  designation: colors.lead,
  company: colors.partner,
  phone: colors.success,
  email: colors.startup,
  website: colors.enterprise,
  address: colors.muted,
  service: colors.vendor,
  pincode: colors.muted,
  other: '#888',
};

const FieldTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  name: 'person-outline',
  designation: 'briefcase-outline',
  company: 'business-outline',
  phone: 'call-outline',
  email: 'mail-outline',
  website: 'globe-outline',
  address: 'map-outline',
  service: 'construct-outline',
  pincode: 'location-outline',
  other: 'document-text-outline',
};

function DraggableFieldItem({ item, drag, isActive, onCopy }: DraggableFieldItemProps) {
  const color = FieldTypeColors[item.type] || colors.muted;
  const icon = FieldTypeIcons[item.type] || 'ellipse-outline';

  return (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        activeOpacity={0.7}
        style={[
          scanStyles.draggableItem,
          isActive && { 
            backgroundColor: color + '20',
            transform: [{ scale: 1.02 }],
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }
        ]}
      >
        <View style={[scanStyles.fieldIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <View style={scanStyles.fieldContent}>
          <Text style={[scanStyles.fieldType, { color }]}>{item.type.toUpperCase()}</Text>
          <Text style={[scanStyles.fieldValue, { color: colors.text }]} numberOfLines={2}>
            {item.value}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => onCopy(item.value, item.type)}
          style={scanStyles.copyFieldBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="copy-outline" size={16} color={color} />
        </TouchableOpacity>
        <Ionicons name="reorder-three" size={20} color={colors.muted} style={scanStyles.dragHandle} />
      </TouchableOpacity>
    </ScaleDecorator>
  );
}

// ─────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────
export default function ScanScreen() {
  const { cards, addCard, deleteCard, updateCard } = useCards();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingCount, setProcessingCount] = useState({ done: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'single' | 'front' | 'back'>('single');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [scanType, setScanType] = useState<'single' | 'dual' | 'multi'>('single');

  // ── OCR Processing ──
  const runOCR = async (uri: string): Promise<string> => {
    try {
      const result = await MlkitOcr.detectFromUri(uri);
      if (!result?.length) return '';
      return result.map((block: any) => {
        if (block.lines) {
          return block.lines.map((line: any) => {
            if (line.elements) {
              return line.elements.map((el: any) => el.text || '').join(' ');
            }
            return line.text || '';
          }).join('\n');
        }
        return block.text || '';
      }).join('\n');
    } catch (err) {
      console.error('OCR error:', err);
      return '';
    }
  };

  // ── Process single image ──
  const processSingle = async (uri: string, idx: number, total: number): Promise<ExtendedScannedCard | null> => {
    setProcessingStatus(`Processing ${idx + 1} of ${total}...`);
    setProcessingCount({ done: idx, total });
    try {
      const processed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const text = await runOCR(processed.uri);
      if (!text.trim()) return null;
      
      const fields = extractAllFields(text);
      
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2) + idx,
        uri: processed.uri,
        data: { fullText: text } as OCRData,
        fields,
        tags: [],
        createdAt: new Date().toISOString(),
        exported: false,
      };
    } catch (e) {
      return null;
    }
  };

  // ── Process dual-side ──
  const processDualSide = async (frontUri: string, backUri: string): Promise<ExtendedScannedCard | null> => {
    setProcessingStatus('Processing front and back...');
    try {
      const processedFront = await ImageManipulator.manipulateAsync(
        frontUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const processedBack = await ImageManipulator.manipulateAsync(
        backUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const [frontText, backText] = await Promise.all([
        runOCR(processedFront.uri),
        runOCR(processedBack.uri)
      ]);
      
      if (!frontText.trim() && !backText.trim()) return null;
      
      const frontFields = extractAllFields(frontText);
      const backFields = extractAllFields(backText);
      
      // Merge fields, removing duplicates
      const mergedFields = [...frontFields];
      const seenValues = new Set(frontFields.map(f => f.value.toLowerCase()));
      
      backFields.forEach(field => {
        if (!seenValues.has(field.value.toLowerCase())) {
          mergedFields.push(field);
          seenValues.add(field.value.toLowerCase());
        }
      });
      
      // Reorder merged fields
      mergedFields.forEach((field, index) => {
        field.order = index;
      });
      
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        uri: processedFront.uri,
        backUri: processedBack.uri,
        data: { fullText: `${frontText}\n\n--- BACK ---\n\n${backText}` } as OCRData,
        fields: mergedFields,
        tags: [],
        createdAt: new Date().toISOString(),
        exported: false,
        hasBothSides: true,
      };
    } catch (e) {
      return null;
    }
  };

  // ── Camera handlers ──
  const handleSingleCamera = () => {
    setScanType('single');
    setCameraMode('single');
    setShowCamera(true);
  };

  const handleDualCamera = () => {
    setScanType('dual');
    setCameraMode('front');
    setFrontImage(null);
    setShowCamera(true);
  };

  const handleMultiCamera = () => {
    // For multi, we'll use gallery picker
    scanMultiple();
  };

  const handleFrontCaptured = (uri: string) => {
    setFrontImage(uri);
    setCameraMode('back');
  };

  const handleBackCaptured = async (uri: string) => {
    setShowCamera(false);
    setIsProcessing(true);
    
    try {
      if (frontImage) {
        const card = await processDualSide(frontImage, uri);
        if (!card) {
          Alert.alert('No Text Detected', 'Could not read text from images');
          return;
        }
        addCard(card);
        setExpandedId(card.id);
      }
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Unknown error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingCount({ done: 0, total: 0 });
      setFrontImage(null);
    }
  };

  const handleSingleCaptured = async (uri: string) => {
    setShowCamera(false);
    setIsProcessing(true);
    try {
      const card = await processSingle(uri, 0, 1);
      if (!card) {
        Alert.alert('No Text Detected', 'Could not read text from image');
        return;
      }
      addCard(card);
      setExpandedId(card.id);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Unknown error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingCount({ done: 0, total: 0 });
    }
  };

  // ── Gallery scans with crop ──
  const pickImageWithCrop = async (): Promise<string | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Media library access is needed.');
      return null;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true, // This enables cropping
      aspect: [16, 9],
    });
    
    if (!result.canceled && result.assets?.[0]?.uri) {
      return result.assets[0].uri;
    }
    return null;
  };

  const scanSingle = async () => {
    const uri = await pickImageWithCrop();
    if (!uri) return;
    
    setIsProcessing(true);
    try {
      const card = await processSingle(uri, 0, 1);
      if (!card) {
        Alert.alert('No Text Detected', 'Could not read any text from this image.');
        return;
      }
      addCard(card);
      setExpandedId(card.id);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Unknown error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingCount({ done: 0, total: 0 });
    }
  };

  const scanDual = async () => {
    Alert.alert('Select Front Image', 'Choose the FRONT side of the card', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Select',
        onPress: async () => {
          const frontUri = await pickImageWithCrop();
          if (!frontUri) return;
          
          Alert.alert('Select Back Image', 'Choose the BACK side of the card', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Select',
              onPress: async () => {
                const backUri = await pickImageWithCrop();
                if (!backUri) return;
                
                setIsProcessing(true);
                try {
                  const card = await processDualSide(frontUri, backUri);
                  if (!card) {
                    Alert.alert('No Text Detected', 'Could not read text from images');
                    return;
                  }
                  addCard(card);
                  setExpandedId(card.id);
                } catch (e: any) {
                  Alert.alert('Failed', e.message ?? 'Unknown error');
                } finally {
                  setIsProcessing(false);
                  setProcessingStatus('');
                  setProcessingCount({ done: 0, total: 0 });
                }
              }
            }
          ]);
        }
      }
    ]);
  };

  const scanMultiple = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Media library access is needed.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 15,
      allowsEditing: true, // This will apply to each selected image
    });
    
    if (result.canceled || !result.assets?.length) return;

    const total = result.assets.length;
    setIsProcessing(true);
    let successCount = 0;
    let firstNewId: string | null = null;

    for (let i = 0; i < total; i++) {
      const card = await processSingle(result.assets[i].uri, i, total);
      if (card) {
        addCard(card);
        if (!firstNewId) firstNewId = card.id;
        successCount++;
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');
    setProcessingCount({ done: 0, total: 0 });

    if (successCount === 0) {
      Alert.alert('No Cards Extracted', 'Could not read text from any of the selected images.');
    } else {
      if (firstNewId) setExpandedId(firstNewId);
      Alert.alert('Done', `Successfully scanned ${successCount} of ${total} card${total > 1 ? 's' : ''}.`);
    }
  };

  // ── Clipboard functions ──
  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const copyAll = async (card: ExtendedScannedCard) => {
    if (!card.fields) return;
    
    const text = card.fields.map(f => `${f.type.toUpperCase()}: ${f.value}`).join('\n');
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'All fields copied to clipboard');
  };

  // ── Save reordered fields ──
  const handleDragEnd = (card: ExtendedScannedCard, newFields: FieldItem[]) => {
    if (!card.fields) return;
    
    // Update orders
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));
    
    // Save to store
    updateCard(card.id, { ...card, fields: updatedFields } as ScannedCard);
  };

  // ── Render card with draggable fields ──
  const renderCard = ({ item }: { item: ExtendedScannedCard }) => {
    const isExpanded = expandedId === item.id;
    const hasBothSides = item.hasBothSides;
    const fields = item.fields || [];

    return (
      <View style={[scanStyles.card, { backgroundColor: colors.white }]}>
        {/* Card Image(s) */}
        {hasBothSides ? (
          <View style={scanStyles.dualImageContainer}>
            <Image source={{ uri: item.uri }} style={scanStyles.dualImage} contentFit="cover" />
            <View style={scanStyles.imageDivider} />
            <Image source={{ uri: item.backUri }} style={scanStyles.dualImage} contentFit="cover" />
            <View style={[scanStyles.dualBadge, { backgroundColor: colors.amber }]}>
              <Ionicons name="swap-horizontal" size={12} color={colors.navy} />
              <Text style={scanStyles.dualBadgeText}>Front & Back</Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: item.uri }} style={scanStyles.cardImage} contentFit="cover" />
        )}
        
        {/* Delete Button */}
        <TouchableOpacity
          style={scanStyles.deleteBtn}
          onPress={() =>
            Alert.alert('Delete Card', 'Remove this scanned card?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteCard(item.id) },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        {/* Copy Actions */}
        <View style={scanStyles.imageActions}>
          <TouchableOpacity
            style={[scanStyles.imageActionBtn, { backgroundColor: colors.navy + 'DD' }]}
            onPress={() => copyAll(item)}
          >
            <Ionicons name="copy-outline" size={12} color={colors.white} />
            <Text style={scanStyles.imageActionText}>Copy All</Text>
          </TouchableOpacity>
        </View>

        {/* Card Header */}
        <TouchableOpacity
          style={[scanStyles.cardHeader, { borderTopColor: colors.border }]}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={[scanStyles.avatar, { backgroundColor: colors.amberLight }]}>
            <Text style={[scanStyles.avatarText, { color: colors.amberDark }]}>
              {(item.fields?.find(f => f.type === 'name')?.value || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={scanStyles.cardInfo}>
            <Text style={[scanStyles.cardName, { color: colors.text }]} numberOfLines={1}>
              {item.fields?.find((f: FieldItem) => f.type === 'name')?.value || 'Business Card'}
            </Text>
            <Text style={[scanStyles.cardDetail, { color: colors.muted }]} numberOfLines={1}>
              {fields.length} fields extracted
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>

        {/* Expanded Details with Drag & Drop */}
        {isExpanded && fields.length > 0 && (
          <View style={scanStyles.details}>
            {hasBothSides && (
              <View style={[scanStyles.infoBadge, { backgroundColor: colors.amber + '15' }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.amber} />
                <Text style={[scanStyles.infoText, { color: colors.amber }]}>
                  Data merged from front & back sides
                </Text>
              </View>
            )}
            
            <View style={scanStyles.dragHint}>
              <Ionicons name="reorder-three" size={16} color={colors.muted} />
              <Text style={[scanStyles.dragHintText, { color: colors.muted }]}>
                Long press and drag to reorder fields
              </Text>
            </View>
            
            <GestureHandlerRootView>
              <DraggableFlatList
                data={fields.sort((a: FieldItem, b: FieldItem) => a.order - b.order)}
                keyExtractor={(item: FieldItem) => item.id}
                renderItem={({ item, drag, isActive }) => (
                  <DraggableFieldItem 
                    item={item} 
                    drag={drag} 
                    isActive={isActive}
                    onCopy={copyToClipboard}
                  />
                )}
                onDragEnd={({ data }) => handleDragEnd(item, data)}
                contentContainerStyle={scanStyles.fieldsList}
                scrollEnabled={false}
              />
            </GestureHandlerRootView>
            
            {/* Raw Text Button */}
            {item.data && (
              <TouchableOpacity
                style={[scanStyles.rawButton, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => Alert.alert('Raw OCR Text', (item.data as any).fullText || 'No text available')}
              >
                <Ionicons name="document-text-outline" size={14} color={colors.amberDark} />
                <Text style={[scanStyles.rawButtonText, { color: colors.amberDark }]}>View Raw OCR Text</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Camera view with mode handling
  if (showCamera) {
    if (scanType === 'dual') {
      return (
        <CameraScanner
          mode={cameraMode}
          onFrontCaptured={handleFrontCaptured}
          onCapture={handleBackCaptured}
          onClose={() => {
            setShowCamera(false);
            setFrontImage(null);
          }}
        />
      );
    } else {
      return (
        <CameraScanner
          mode="single"
          onCapture={handleSingleCaptured}
          onClose={() => setShowCamera(false)}
        />
      );
    }
  }

  return (
    <View style={[scanStyles.container, { backgroundColor: colors.phoneBg }]}>
      {/* Header */}
      <View style={[scanStyles.header, { backgroundColor: colors.navy }]}>
        <View style={scanStyles.headerGlow} />
        <View>
          <Text style={scanStyles.greetText}>SCAN BUSINESS CARDS</Text>
          <Text style={scanStyles.titleText}>
            Card <Text style={scanStyles.titleSpan}>Scanner</Text>
          </Text>
        </View>
        <View style={[scanStyles.badge, { backgroundColor: colors.amber + '20' }]}>
          <Ionicons name="scan-outline" size={16} color={colors.amber} />
          <Text style={[scanStyles.badgeText, { color: colors.amber }]}>ML Kit</Text>
        </View>
      </View>

      {/* Simplified Scan Options - Only 3 buttons */}
      <View style={scanStyles.scanOptions}>
        <TouchableOpacity
          style={[scanStyles.optionBtn, { backgroundColor: colors.white }]}
          onPress={handleSingleCamera}
          disabled={isProcessing}
        >
          <View style={[scanStyles.optionIcon, { backgroundColor: colors.amberLight }]}>
            <Ionicons name="camera" size={28} color={colors.amberDark} />
          </View>
          <Text style={[scanStyles.optionLabel, { color: colors.text }]}>Single</Text>
          <Text style={[scanStyles.optionSub, { color: colors.muted }]}>One side</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[scanStyles.optionBtn, { backgroundColor: colors.white }]}
          onPress={handleDualCamera}
          disabled={isProcessing}
        >
          <View style={[scanStyles.optionIcon, { backgroundColor: colors.leadBg }]}>
            <Ionicons name="camera-reverse" size={28} color={colors.lead} />
          </View>
          <Text style={[scanStyles.optionLabel, { color: colors.text }]}>Dual</Text>
          <Text style={[scanStyles.optionSub, { color: colors.muted }]}>Front & Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[scanStyles.optionBtn, { backgroundColor: colors.white }]}
          onPress={handleMultiCamera}
          disabled={isProcessing}
        >
          <View style={[scanStyles.optionIcon, { backgroundColor: colors.partnerBg }]}>
            <Ionicons name="albums" size={28} color={colors.partner} />
          </View>
          <Text style={[scanStyles.optionLabel, { color: colors.text }]}>Multi</Text>
          <Text style={[scanStyles.optionSub, { color: colors.muted }]}>Up to 15</Text>
        </TouchableOpacity>
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={[scanStyles.processingBox, { backgroundColor: colors.white }]}>
          <ActivityIndicator size="large" color={colors.amber} />
          <Text style={[scanStyles.processingText, { color: colors.amber }]}>
            {processingStatus || 'Processing...'}
          </Text>
          {processingCount.total > 1 && (
            <View style={scanStyles.progressContainer}>
              <View style={[scanStyles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    scanStyles.progressFill,
                    {
                      backgroundColor: colors.amber,
                      width: `${Math.round((processingCount.done / processingCount.total) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[scanStyles.progressText, { color: colors.muted }]}>
                {processingCount.done}/{processingCount.total}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Cards List */}
      <FlatList
        data={cards as ExtendedScannedCard[]}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={scanStyles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isProcessing ? (
            <View style={scanStyles.emptyContainer}>
              <View style={[scanStyles.emptyIcon, { backgroundColor: colors.amberLight }]}>
                <Ionicons name="scan-outline" size={48} color={colors.amberDark} />
              </View>
              <Text style={[scanStyles.emptyTitle, { color: colors.text }]}>No cards scanned yet</Text>
              <Text style={[scanStyles.emptyText, { color: colors.muted }]}>
                Use Single, Dual, or Multi to scan business cards
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}