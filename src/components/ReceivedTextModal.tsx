import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ToastAndroid,
  Platform,
} from 'react-native';
import { useTransferStore } from '../store/transferStore';
import { useTheme } from '../theme';
import { setSystemClipboardText } from '../utils/clipboard';
import {
  Clipboard,
  MessageSquare,
  Copy,
  Check,
  X,
  Smartphone,
  CheckCircle2,
} from 'lucide-react-native';

export function ReceivedTextModal() {
  const { receivedTextModal, setReceivedTextModal } = useTransferStore();
  const { colors, isDarkMode } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!receivedTextModal) {
    return null;
  }

  const { text, senderName, transferType } = receivedTextModal;
  const isClipboard = transferType === 'clipboard';

  const charCount = text ? text.length : 0;
  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleCopy = async () => {
    if (!text) return;
    const success = await setSystemClipboardText(text);
    if (success) {
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Copied to clipboard!', ToastAndroid.SHORT);
      }
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
  };

  const handleClose = () => {
    setReceivedTextModal(null);
  };

  const innerCardBg = isDarkMode ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.04)';
  const innerCardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: `${colors.primary}45`,
              shadowColor: colors.primary,
            },
          ]}
        >
          {/* Header Icon */}
          <View style={styles.headerIconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${colors.primary}20`,
                  borderColor: `${colors.primary}55`,
                },
              ]}
            >
              {isClipboard ? (
                <Clipboard size={26} color={colors.primary} strokeWidth={2.4} />
              ) : (
                <MessageSquare size={26} color={colors.primary} strokeWidth={2.4} />
              )}
            </View>
            <TouchableOpacity
              style={[styles.closeIconButton, { backgroundColor: innerCardBg }]}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isClipboard ? 'Received Clipboard' : 'Received Text Message'}
          </Text>

          {/* Sender Pill */}
          <View
            style={[
              styles.senderPill,
              {
                backgroundColor: innerCardBg,
                borderColor: innerCardBorder,
              },
            ]}
          >
            <Smartphone size={14} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.senderPillText, { color: colors.textSecondary }]}>
              From <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{senderName || 'Nearby Device'}</Text>
            </Text>
          </View>

          {/* Text Content Box */}
          <View
            style={[
              styles.textBoxContainer,
              {
                backgroundColor: innerCardBg,
                borderColor: innerCardBorder,
              },
            ]}
          >
            <ScrollView
              style={styles.textScrollView}
              contentContainerStyle={styles.textScrollContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              <TextInput
                style={[styles.textContent, { color: colors.textPrimary }]}
                value={text}
                multiline={true}
                editable={false}
                scrollEnabled={false}
              />
            </ScrollView>

            {/* Word & Char counter footer */}
            <View style={[styles.textCounterRow, { borderTopColor: innerCardBorder }]}>
              <Text style={[styles.counterText, { color: colors.textMuted }]}>
                {charCount} characters • {wordCount} words
              </Text>
              {copied && (
                <View style={styles.copiedBadge}>
                  <CheckCircle2 size={13} color={colors.success} style={{ marginRight: 4 }} />
                  <Text style={[styles.copiedBadgeText, { color: colors.success }]}>
                    Copied
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.copyButton,
                {
                  backgroundColor: copied ? colors.success : colors.primary,
                },
              ]}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              {copied ? (
                <>
                  <Check size={18} color={colors.onPrimary} strokeWidth={2.6} style={{ marginRight: 8 }} />
                  <Text style={[styles.copyButtonText, { color: colors.onPrimary }]}>
                    Copied to Clipboard!
                  </Text>
                </>
              ) : (
                <>
                  <Copy size={18} color={colors.onPrimary} strokeWidth={2.4} style={{ marginRight: 8 }} />
                  <Text style={[styles.copyButtonText, { color: colors.onPrimary }]}>
                    Copy to Clipboard
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dismissButton,
                {
                  backgroundColor: innerCardBg,
                  borderColor: innerCardBorder,
                },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  senderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    marginBottom: 14,
  },
  senderPillText: {
    fontSize: 12.5,
  },
  textBoxContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  textScrollView: {
    maxHeight: 220,
    minHeight: 80,
  },
  textScrollContent: {
    padding: 14,
  },
  textContent: {
    fontSize: 14.5,
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
  textCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copiedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    elevation: 3,
  },
  copyButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
