import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { useSettingsStore } from '../store/settingsStore';
import {
  X,
  Check,
  Smartphone,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Pencil,
} from 'lucide-react-native';

const MASCOT_SYMBOLS = [
  '🐻', '🐼', '🐨', '🦊', '🐯', '🦁',
  '🐶', '🐱', '🐰', '🦄', '🚀', '⚡',
  '🎮', '💎', '🌟', '🔥', '🌸', '🪐',
  '🦉', '🐢', '🦖', '🐬', '🐙',
];

interface DeviceProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeviceProfileModal({ visible, onClose }: DeviceProfileModalProps) {
  const { colors, isDarkMode } = useTheme();
  const {
    deviceName,
    mascotSymbol,
    theme,
    setDeviceName,
    setMascotSymbol,
    setTheme,
  } = useSettingsStore();

  const [tempName, setTempName] = useState(deviceName || 'ShareBear Device');
  const [tempSymbol, setTempSymbol] = useState(mascotSymbol || '🐻');
  const [tempTheme, setTempTheme] = useState<'system' | 'dark' | 'light'>(theme || 'system');
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Center Pop-in spring animations
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const avatarScaleAnim = useRef(new Animated.Value(0.9)).current;
  const avatarOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setTempName(deviceName || 'ShareBear Device');
      setTempSymbol(mascotSymbol || '🐻');
      setTempTheme(theme || 'system');
      setIsSaving(false);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setIsSaving(false);
    }
  }, [visible, deviceName, mascotSymbol, theme]);

  useEffect(() => {
    if (avatarModalVisible) {
      Animated.parallel([
        Animated.spring(avatarScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(avatarOpacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      avatarScaleAnim.setValue(0.9);
      avatarOpacityAnim.setValue(0);
    }
  }, [avatarModalVisible]);

  const handleThemeChange = (newTheme: 'system' | 'dark' | 'light') => {
    setTempTheme(newTheme);
    setTheme(newTheme);
  };

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);

    if (tempName.trim()) {
      setDeviceName(tempName.trim());
    }
    setMascotSymbol(tempSymbol);
    setTheme(tempTheme);

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 280);
  };

  const handleSelectSymbol = (symbol: string) => {
    setTempSymbol(symbol);
    setAvatarModalVisible(false);
  };

  return (
    <>
      {/* Main Device Profile Modal (Center Pop-in) */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleGroup}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Device Profile</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Customize your device name and appearance
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Center Mascot Circle with Pencil Edit Button */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={[
                    styles.avatarLargeCircle,
                    {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                      shadowColor: colors.primary,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setAvatarModalVisible(true)}
                >
                  <Text style={styles.avatarLargeEmoji}>{tempSymbol}</Text>

                  {/* Pencil Edit Icon Badge */}
                  <View
                    style={[
                      styles.pencilBadge,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.cardBg,
                      },
                    ]}
                  >
                    <Pencil size={14} color={colors.onPrimary} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAvatarModalVisible(true)}
                >
                  <Text style={[styles.avatarSubtext, { color: colors.primary }]}>
                    Change Avatar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Device Name Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DEVICE NAME</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Smartphone size={18} color={colors.primary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="e.g. Pixel 8 Pro"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={32}
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Theme & Appearance Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>THEME & APPEARANCE</Text>
                <View style={styles.themeOptionsRow}>
                  {/* System */}
                  <TouchableOpacity
                    style={[
                      styles.themeOptionCard,
                      {
                        backgroundColor: tempTheme === 'system' ? colors.primaryContainer : colors.surfaceElevated,
                        borderColor: tempTheme === 'system' ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleThemeChange('system')}
                  >
                    <Monitor
                      size={20}
                      color={tempTheme === 'system' ? colors.primary : colors.textSecondary}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: tempTheme === 'system' ? colors.primary : colors.textPrimary },
                      ]}
                    >
                      System
                    </Text>
                  </TouchableOpacity>

                  {/* Dark */}
                  <TouchableOpacity
                    style={[
                      styles.themeOptionCard,
                      {
                        backgroundColor: tempTheme === 'dark' ? colors.primaryContainer : colors.surfaceElevated,
                        borderColor: tempTheme === 'dark' ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleThemeChange('dark')}
                  >
                    <Moon
                      size={20}
                      color={tempTheme === 'dark' ? colors.primary : colors.textSecondary}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: tempTheme === 'dark' ? colors.primary : colors.textPrimary },
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>

                  {/* Light */}
                  <TouchableOpacity
                    style={[
                      styles.themeOptionCard,
                      {
                        backgroundColor: tempTheme === 'light' ? colors.primaryContainer : colors.surfaceElevated,
                        borderColor: tempTheme === 'light' ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleThemeChange('light')}
                  >
                    <Sun
                      size={20}
                      color={tempTheme === 'light' ? colors.primary : colors.textSecondary}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: tempTheme === 'light' ? colors.primary : colors.textPrimary },
                      ]}
                    >
                      Light
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Save Action */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  isSaving && { opacity: 0.85 },
                ]}
                activeOpacity={0.85}
                disabled={isSaving}
                onPress={handleSave}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color={colors.onPrimary} style={{ marginRight: 8 }} />
                    <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Saving Changes...</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
                    <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Dedicated Choose Avatar Modal (Center Pop-in) */}
      <Modal
        visible={avatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.avatarModalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <Animated.View
            style={[
              styles.avatarPickerContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                opacity: avatarOpacityAnim,
                transform: [{ scale: avatarScaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Avatar Modal Header */}
            <View style={styles.avatarModalHeader}>
              <View>
                <Text style={[styles.avatarPickerTitle, { color: colors.textPrimary }]}>Choose Avatar</Text>
                <Text style={[styles.avatarPickerSubtitle, { color: colors.textSecondary }]}>
                  Pick a symbol for your device
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Symbols Grid */}
            <ScrollView
              style={styles.avatarGridScroll}
              contentContainerStyle={styles.symbolsGridContent}
              showsVerticalScrollIndicator={false}
            >
              {MASCOT_SYMBOLS.map((symbol) => {
                const isSelected = tempSymbol === symbol;
                return (
                  <TouchableOpacity
                    key={symbol}
                    style={[
                      styles.symbolPill,
                      {
                        backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectSymbol(symbol)}
                  >
                    <Text style={styles.symbolEmoji}>{symbol}</Text>
                    {isSelected && (
                      <View style={[styles.miniCheckBadge, { backgroundColor: colors.primary }]}>
                        <Check size={10} color={colors.onPrimary} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 28,
    borderWidth: 1,
    paddingTop: 20,
    paddingBottom: 16,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLargeCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    position: 'relative',
  },
  avatarLargeEmoji: {
    fontSize: 42,
  },
  pencilBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  avatarSubtext: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 14,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarPickerContainer: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    elevation: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarPickerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  avatarGridScroll: {
    maxHeight: 280,
  },
  symbolsGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  symbolPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  symbolEmoji: {
    fontSize: 26,
  },
  miniCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
