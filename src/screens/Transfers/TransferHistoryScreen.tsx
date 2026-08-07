import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTransferStore } from '../../store/transferStore';
import { TransferRepository } from '../../features/transfer/TransferRepository';

export function TransferHistoryScreen() {
  const { transfers, setTransfers } = useTransferStore();

  const sortedTransfers = Object.values(transfers).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const formatSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString();
  };

  const handleClearHistory = () => {
    TransferRepository.clearHistory();
    setTransfers({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'COMPLETED':
        return '#10B981'; // Emerald
      case 'REJECTED':
      case 'FAILED':
        return '#F43F5E'; // Rose
      case 'REQUESTED':
      case 'WAITING_FOR_USER':
      default:
        return '#F59E0B'; // Amber
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Transfers</Text>
          <Text style={styles.subtitle}>History of file handshakes</Text>
        </View>
        {sortedTransfers.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {sortedTransfers.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No transfers recorded yet</Text>
          <Text style={styles.emptySubtext}>
            Incoming and outgoing file request logs will appear here.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedTransfers.map((transfer) => {
            const isOutgoing = transfer.transferId.startsWith('TR-OUT-');
            const statusColor = getStatusColor(transfer.status);
            const firstFileName = transfer.files[0]?.name || 'Unknown File';

            return (
              <View key={transfer.transferId} style={styles.transferCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.directionRow}>
                    <Text style={styles.directionIcon}>
                      {isOutgoing ? '📤' : '📥'}
                    </Text>
                    <View>
                      <Text style={styles.directionText}>
                        {isOutgoing ? `To Peer` : `From ${transfer.senderName}`}
                      </Text>
                      <Text style={styles.timestampText}>
                        {formatDate(transfer.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor}1A`, borderColor: `${statusColor}33` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {transfer.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {firstFileName}
                    {transfer.totalFiles > 1 &&
                      ` and ${transfer.totalFiles - 1} other${transfer.totalFiles > 2 ? 's' : ''}`}
                  </Text>
                  <Text style={styles.fileDetails}>
                    {transfer.totalFiles === 1 ? '1 File' : `${transfer.totalFiles} Files`} •{' '}
                    {formatSize(transfer.totalBytes)}
                  </Text>
                </View>

                <Text style={styles.transferIdText}>ID: {transfer.transferId}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  clearButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  clearButtonText: {
    color: '#F43F5E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  transferCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
    marginBottom: 12,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  directionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 10,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transferIdText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#475569',
    textAlign: 'right',
  },
});
