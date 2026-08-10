import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { useTransferStore } from '../store/transferStore';
import { useTheme } from '../theme';
import {
  UploadCloud,
  DownloadCloud,
  Zap,
  Clock,
  FileText,
  Radio,
  CheckCircle,
  XCircle,
  X,
  Smartphone,
  ShieldCheck,
} from 'lucide-react-native';

export function TransferProgressDialog() {
  const { activeSession, setActiveSession } = useTransferStore();
  const { colors, isDarkMode } = useTheme();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waitTimeoutAnim = useRef(new Animated.Value(1)).current;
  const [waitSeconds, setWaitSeconds] = useState(60);

  const status = activeSession?.status;

  useEffect(() => {
    if (!activeSession) return;

    if (status === 'waiting_for_peer' || status === 'transferring') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [activeSession?.transferId, status]);

  // Handle waiting timer countdown
  useEffect(() => {
    if (status === 'waiting_for_peer') {
      waitTimeoutAnim.setValue(1);
      setWaitSeconds(60);

      Animated.timing(waitTimeoutAnim, {
        toValue: 0,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      const interval = setInterval(() => {
        setWaitSeconds((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  if (!activeSession) {
    return null;
  }

  const { fileName, fileSize, percentage, speed, eta, direction, peerName, error } = activeSession;
  const isUpload = direction === 'upload';
  const clampedPercent = Math.min(100, Math.max(0, percentage || 0));

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatEta = (seconds: number): string => {
    if (seconds === undefined || seconds < 0 || !isFinite(seconds)) return 'Calculating...';
    if (seconds === 0) return 'Almost done';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const handleDismiss = () => {
    setActiveSession(null);
  };

  const innerCardBg = isDarkMode ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.045)';
  const innerCardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)';

  const waitBarWidth = waitTimeoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal animationType="fade" transparent={true} visible={true} statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: `${colors.primary}45`,
              shadowColor: colors.primary,
            },
          ]}
        >
          {/* STATE 1: WAITING FOR RECIPIENT TO ACCEPT */}
          {status === 'waiting_for_peer' && (
            <>
              <View style={styles.iconContainer}>
                <Animated.View
                  style={[
                    styles.iconGlow,
                    {
                      backgroundColor: `${colors.secondary}25`,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: `${colors.secondary}18`,
                      borderColor: `${colors.secondary}50`,
                    },
                  ]}
                >
                  <Radio size={28} color={colors.secondary} strokeWidth={2.3} />
                </View>
              </View>

              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Waiting for Response...
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sent request to <Text style={{ fontWeight: 'bold', color: colors.primary }}>{peerName || 'Nearby Device'}</Text>
              </Text>

              {/* Target Device Pill */}
              <View
                style={[
                  styles.deviceInfoPill,
                  {
                    backgroundColor: innerCardBg,
                    borderColor: innerCardBorder,
                  },
                ]}
              >
                <Smartphone size={16} color={colors.secondary} style={{ marginRight: 8 }} />
                <Text style={[styles.deviceInfoText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {peerName || 'Nearby Device'}
                </Text>
                <View style={[styles.statusMiniBadge, { backgroundColor: `${colors.secondary}18` }]}>
                  <Text style={[styles.statusMiniText, { color: colors.secondary }]}>Prompted</Text>
                </View>
              </View>

              {/* File Info Box */}
              <View
                style={[
                  styles.fileNameBox,
                  {
                    backgroundColor: innerCardBg,
                    borderColor: innerCardBorder,
                  },
                ]}
              >
                <FileText size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {fileName || 'Sharing file'}
                  </Text>
                  <Text style={[styles.fileSizeSub, { color: colors.textSecondary }]}>
                    {formatSize(fileSize)}
                  </Text>
                </View>
              </View>

              {/* Timeout Indicator */}
              <View style={styles.waitingTimeoutRow}>
                <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.waitingTimeoutText, { color: colors.textSecondary }]}>
                  Waiting time: {waitSeconds}s remaining
                </Text>
              </View>

              <View style={[styles.timeoutTrack, { backgroundColor: innerCardBg }]}>
                <Animated.View
                  style={[
                    styles.timeoutFill,
                    {
                      width: waitBarWidth,
                      backgroundColor: colors.secondary,
                    },
                  ]}
                />
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: `${colors.error}15`,
                    borderColor: `${colors.error}35`,
                  },
                ]}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <X size={17} color={colors.error} strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={[styles.cancelBtnText, { color: colors.error }]}>
                  Cancel Request
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STATE 2: ACTIVE TRANSFERRING (SENDER & RECEIVER) */}
          {status === 'transferring' && (
            <>
              <View style={styles.iconContainer}>
                <Animated.View
                  style={[
                    styles.iconGlow,
                    {
                      backgroundColor: `${colors.primary}20`,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: colors.primaryContainer,
                      borderColor: `${colors.primary}55`,
                    },
                  ]}
                >
                  {isUpload ? (
                    <UploadCloud size={28} color={colors.primary} strokeWidth={2.3} />
                  ) : (
                    <DownloadCloud size={28} color={colors.primary} strokeWidth={2.3} />
                  )}
                </View>
              </View>

              <Text style={[styles.title, { color: colors.primary }]}>
                {isUpload ? 'Sending Files...' : 'Receiving Files...'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {isUpload
                  ? `Transferring to ${peerName || 'peer'}`
                  : `Receiving from ${peerName || 'peer'}`}
              </Text>

              {/* File Name Pill */}
              <View
                style={[
                  styles.fileNameBox,
                  {
                    backgroundColor: innerCardBg,
                    borderColor: innerCardBorder,
                  },
                ]}
              >
                <FileText size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {fileName || 'Transferring file'}
                  </Text>
                  <Text style={[styles.fileSizeSub, { color: colors.textSecondary }]}>
                    {formatSize(fileSize)}
                  </Text>
                </View>
              </View>

              {/* Percentage Number */}
              <View style={styles.percentageRow}>
                <Text style={[styles.percentageNumber, { color: colors.textPrimary }]}>
                  {Math.round(clampedPercent)}
                </Text>
                <Text style={[styles.percentageSign, { color: colors.primary }]}>%</Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: innerCardBg }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${clampedPercent}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: innerCardBg,
                      borderColor: innerCardBorder,
                    },
                  ]}
                >
                  <View style={styles.metricHeader}>
                    <Zap size={12} color={colors.secondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>SPEED</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                    {formatSpeed(speed)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: innerCardBg,
                      borderColor: innerCardBorder,
                    },
                  ]}
                >
                  <View style={styles.metricHeader}>
                    <Clock size={12} color={colors.secondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>REMAINING</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                    {formatEta(eta)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* STATE 3: COMPLETED */}
          {status === 'completed' && (
            <>
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: `${colors.success}18`,
                      borderColor: `${colors.success}45`,
                    },
                  ]}
                >
                  <CheckCircle size={32} color={colors.success} strokeWidth={2.3} />
                </View>
              </View>

              <Text style={[styles.title, { color: colors.success }]}>
                Transfer Complete!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {fileName || 'File'} was transferred successfully
              </Text>

              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={handleDismiss}
                activeOpacity={0.85}
              >
                <Text style={[styles.doneBtnText, { color: colors.onPrimary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STATE 4: FAILED OR DECLINED */}
          {status === 'failed' && (
            <>
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: `${colors.error}18`,
                      borderColor: `${colors.error}45`,
                    },
                  ]}
                >
                  <XCircle size={32} color={colors.error} strokeWidth={2.3} />
                </View>
              </View>

              <Text style={[styles.title, { color: colors.error }]}>
                Transfer Declined
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {error || 'The transfer request could not be completed.'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: innerCardBg,
                    borderColor: innerCardBorder,
                    marginTop: 12,
                  },
                ]}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  deviceInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 10,
  },
  deviceInfoText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusMiniText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  fileNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 14,
  },
  fileName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  fileSizeSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  waitingTimeoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  waitingTimeoutText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  timeoutTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 18,
  },
  timeoutFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  percentageNumber: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  percentageSign: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  progressBarTrack: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 10,
  },
  doneBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
