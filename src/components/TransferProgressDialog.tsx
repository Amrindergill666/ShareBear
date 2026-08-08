import React from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native';
import { useTransferStore } from '../store/transferStore';
import { useTheme } from '../theme';

export function TransferProgressDialog() {
  const { activeSession } = useTransferStore();
  const { colors } = useTheme();

  if (!activeSession || activeSession.status !== 'transferring') {
    return null;
  }

  const { fileName, percentage, speed, eta, direction } = activeSession;

  // Format speed (e.g. 2.3 MB/s)
  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec <= 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format remaining time
  const formatEta = (seconds: number): string => {
    if (seconds < 0 || !isFinite(seconds)) return 'Calculating...';
    if (seconds === 0) return '0 seconds';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s} second${s !== 1 ? 's' : ''}`;
  };

  // Progress Bar rendering (15 blocks total)
  const totalBlocks = 15;
  const activeBlocks = Math.round((percentage / 100) * totalBlocks);
  const progressBar = '█'.repeat(activeBlocks) + '░'.repeat(totalBlocks - activeBlocks);

  return (
    <Modal animationType="fade" transparent={true} visible={true}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            {direction === 'upload' ? 'Uploading' : 'Downloading'}
          </Text>
          <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
            {fileName}
          </Text>
          
          <Text style={[styles.progressBar, { color: colors.primary }]}>{progressBar}</Text>
          
          <Text style={[styles.percentage, { color: colors.textPrimary }]}>{Math.round(percentage)}%</Text>
          
          <View style={[styles.statsRow, { borderTopColor: colors.outlineVariant }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Speed</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatSpeed(speed)}</Text>
            </View>
            <View style={[styles.statCol, styles.alignRight]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatEta(eta)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    fontSize: 22,
    fontFamily: 'monospace',
    color: '#3B82F6',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  percentage: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  statCol: {
    flex: 1,
  },
  alignRight: {
    
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
});
