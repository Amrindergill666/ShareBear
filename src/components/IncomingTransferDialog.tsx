import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useTransferStore } from '../store/transferStore';
import { acceptIncomingTransfer, rejectIncomingTransfer } from '../features/transfer/TransferManager';
import { useTheme } from '../theme';

export function IncomingTransferDialog() {
  const { activeIncomingRequest } = useTransferStore();
  const { colors } = useTheme();

  if (!activeIncomingRequest) {
    return null;
  }

  const { transferId, request } = activeIncomingRequest;
  const senderName = request.sender.deviceName;
  const fileCount = request.totalFiles;
  const totalSize = request.totalSize;
  const firstFileName = request.files[0]?.name || 'Unknown file';

  const formatSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleAccept = async () => {
    await acceptIncomingTransfer(transferId);
  };

  const handleReject = async () => {
    await rejectIncomingTransfer(transferId);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
    >
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
          <Text style={[styles.dialogHeader, { color: colors.textPrimary }]}>Incoming Transfer</Text>

          {/* Sender Row */}
          <View
            style={[
              styles.senderContainer,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Text style={styles.avatar}>🐻</Text>
            <View>
              <Text style={[styles.senderLabel, { color: colors.textMuted }]}>From</Text>
              <Text style={[styles.senderName, { color: colors.textPrimary }]}>{senderName}</Text>
            </View>
          </View>

          {/* Files Row */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Text style={[styles.detailsHeader, { color: colors.primary }]}>
              {fileCount === 1 ? '1 File' : `${fileCount} Files`}
            </Text>
            <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {firstFileName}
              {fileCount > 1 && ` and ${fileCount - 1} other${fileCount > 2 ? 's' : ''}`}
            </Text>
            <Text style={[styles.fileSize, { color: colors.textSecondary }]}>{formatSize(totalSize)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: `${colors.error}18`,
                  borderColor: `${colors.error}40`,
                },
              ]}
              onPress={handleReject}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: colors.error }]}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Accept</Text>
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
  },
  dialogHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 20,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    fontSize: 28,
    marginRight: 14,
  },
  senderLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  detailsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  acceptButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  rejectText: {
    color: '#F43F5E',
  },
  acceptText: {
    color: '#FFFFFF',
  },
});
