import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform as RNPlatform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useDeviceStore, Device } from '../store/deviceStore';
import { useTheme } from '../theme';
import {
  X,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Check,
  PlusCircle,
  Wifi,
  Radio,
  Server,
  AlertCircle,
} from 'lucide-react-native';

interface ManualDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onDeviceAdded?: (device: Device) => void;
}

const PLATFORMS = [
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'ios', label: 'iOS', icon: Smartphone },
  { id: 'macos', label: 'macOS', icon: Laptop },
  { id: 'windows', label: 'Windows', icon: Monitor },
  { id: 'linux', label: 'Linux', icon: Monitor },
];

export function ManualDeviceModal({
  visible,
  onClose,
  onDeviceAdded,
}: ManualDeviceModalProps) {
  const { colors, isDarkMode } = useTheme();
  const { addOrUpdateDevice } = useDeviceStore();

  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('53317');
  const [selectedPlatform, setSelectedPlatform] = useState('android');
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setDeviceName('');
    setIpAddress('');
    setPort('53317');
    setSelectedPlatform('android');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAdd = () => {
    const trimmedIp = ipAddress.trim();
    const trimmedPort = port.trim() || '53317';
    const portNum = parseInt(trimmedPort, 10);

    if (!trimmedIp) {
      setErrorMessage('Please enter a valid IP address');
      return;
    }

    // Basic IPv4 / IPv6 validation
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(trimmedIp) && trimmedIp !== 'localhost' && !trimmedIp.includes(':')) {
      setErrorMessage('Please enter a valid IPv4 address (e.g. 192.168.1.100)');
      return;
    }

    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      setErrorMessage('Port must be a number between 1 and 65535');
      return;
    }

    const platformObj = PLATFORMS.find((p) => p.id === selectedPlatform);
    const platformLabel = platformObj ? platformObj.label : 'Device';
    const finalName = deviceName.trim() || `${platformLabel} (${trimmedIp})`;

    const deviceId = `manual-${trimmedIp.replace(/\./g, '-')}-${portNum}`;
    const newDevice: Device = {
      id: deviceId,
      name: finalName,
      ip: trimmedIp,
      port: portNum,
      platform: selectedPlatform,
      lastSeen: Date.now(),
      isOnline: true,
    };

    addOrUpdateDevice(newDevice);
    if (onDeviceAdded) {
      onDeviceAdded(newDevice);
    }

    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.titleRow}>
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: colors.primaryContainer,
                        borderColor: `${colors.primary}44`,
                      },
                    ]}
                  >
                    <PlusCircle size={22} color={colors.primary} strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                      Add Manual Device
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Connect directly via local IP & port
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                {/* Error Banner */}
                {!!errorMessage && (
                  <View
                    style={[
                      styles.errorBanner,
                      {
                        backgroundColor: isDarkMode ? '#3b1212' : '#fef2f2',
                        borderColor: '#ef4444',
                      },
                    ]}
                  >
                    <AlertCircle size={16} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text style={[styles.errorText, { color: '#ef4444' }]}>{errorMessage}</Text>
                  </View>
                )}

                {/* Device Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    DEVICE NAME (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="e.g. Work MacBook, Kitchen Tablet"
                    placeholderTextColor={colors.textSecondary}
                    value={deviceName}
                    onChangeText={(text) => {
                      setDeviceName(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    maxLength={32}
                  />
                </View>

                {/* IP Address & Port Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      IP ADDRESS <Text style={{ color: colors.primary }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.cardBorder,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="192.168.1.100"
                      placeholderTextColor={colors.textSecondary}
                      value={ipAddress}
                      onChangeText={(text) => {
                        setIpAddress(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      PORT
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.cardBorder,
                          color: colors.textPrimary,
                        },
                      ]}
                      placeholder="53317"
                      placeholderTextColor={colors.textSecondary}
                      value={port}
                      onChangeText={(text) => {
                        setPort(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>

                {/* Platform Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    DEVICE TYPE
                  </Text>
                  <View style={styles.platformRow}>
                    {PLATFORMS.map((p) => {
                      const IconComponent = p.icon;
                      const isSelected = selectedPlatform === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.platformPill,
                            {
                              backgroundColor: isSelected
                                ? colors.primaryContainer
                                : colors.surfaceElevated,
                              borderColor: isSelected ? colors.primary : colors.cardBorder,
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setSelectedPlatform(p.id)}
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.primary : colors.textSecondary}
                            strokeWidth={2}
                          />
                          <Text
                            style={[
                              styles.platformPillText,
                              {
                                color: isSelected ? colors.primary : colors.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Quick Hint */}
                <View
                  style={[
                    styles.hintBox,
                    {
                      backgroundColor: `${colors.primary}0D`,
                      borderColor: `${colors.primary}22`,
                    },
                  ]}
                >
                  <Wifi size={14} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                    Ensure the target device is on the same local Wi-Fi network and has ShareBear open.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleAdd}
                  >
                    <PlusCircle size={18} color={colors.onPrimary} strokeWidth={2.2} />
                    <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>
                      Add Device
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContent: {
    paddingTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14.5,
    fontWeight: '500',
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  platformPillText: {
    fontSize: 13,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 6,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 14,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
});
