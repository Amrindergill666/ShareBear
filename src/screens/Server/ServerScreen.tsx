import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useServerStore } from '../../store/serverStore';
import { startServer, stopServer, updateServerStats } from '../../features/server/serverManager';
import { useTheme } from '../../theme';

export function ServerScreen() {
  const { isRunning, port, requestsReceived, lastRequestIp, uptime } = useServerStore();
  const { colors } = useTheme();

  // Poll server stats every 2 seconds to keep uptime and metrics updated dynamically
  useEffect(() => {
    let intervalId: any = null;
    if (isRunning) {
      intervalId = setInterval(() => {
        updateServerStats();
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  const handleToggleServer = async () => {
    if (isRunning) {
      await stopServer();
    } else {
      await startServer();
    }
  };

  const formatUptime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
  };

  const endpoints = [
    { path: '/info', desc: 'Returns device profile details and protocols' },
    { path: '/ping', desc: 'Peers ping this to verify reachability' },
    { path: '/health', desc: 'Returns server uptime and connection status' },
    { path: '/capabilities', desc: 'Lists supported features and operations' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Control Server</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enables direct peer-to-peer HTTP communications</Text>

      {/* Server Status Panel */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textPrimary }]}>Server Status</Text>
          <View
            style={[
              styles.statusBadge,
              isRunning
                ? { backgroundColor: `${colors.success}20` }
                : { backgroundColor: `${colors.error}20` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isRunning ? { backgroundColor: colors.success } : { backgroundColor: colors.error },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isRunning ? colors.success : colors.error },
              ]}
            >
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Port</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{isRunning ? port : '—'}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Uptime</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{isRunning ? formatUptime(uptime) : '—'}</Text>
          </View>
        </View>
      </View>

      {/* Metrics Panel */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardHeader, { color: colors.primary, borderBottomColor: colors.outlineVariant }]}>
          Server Metrics
        </Text>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Requests Received</Text>
          <Text style={[styles.metricValueText, { color: colors.textPrimary }]}>{requestsReceived}</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Last Request IP</Text>
          <Text style={[styles.metricValueTextIp, { color: colors.secondary }]}>{lastRequestIp}</Text>
        </View>
      </View>

      {/* API Endpoints Catalog */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardHeader, { color: colors.primary, borderBottomColor: colors.outlineVariant }]}>
          Active API Endpoints
        </Text>
        {endpoints.map((endpoint, index) => (
          <View
            key={endpoint.path}
            style={[
              styles.endpointRow,
              { borderBottomColor: colors.outlineVariant },
              index === endpoints.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.endpointPathBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Text style={[styles.endpointPath, { color: colors.primary }]}>GET {endpoint.path}</Text>
            </View>
            <Text style={[styles.endpointDesc, { color: colors.textSecondary }]}>{endpoint.desc}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: isRunning ? colors.error : colors.primary,
            shadowColor: isRunning ? colors.error : colors.primary,
          },
        ]}
        onPress={handleToggleServer}
      >
        <Text style={[styles.actionButtonText, { color: isRunning ? '#FFFFFF' : colors.onPrimary }]}>
          {isRunning ? 'Stop Server' : 'Start Server'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusBadgeRunning: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeStopped: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotRunning: {
    backgroundColor: '#10B981',
  },
  statusDotStopped: {
    backgroundColor: '#F43F5E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextRunning: {
    color: '#10B981',
  },
  statusTextStopped: {
    color: '#F43F5E',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  metricValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  metricValueTextIp: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#E2E8F0',
    fontWeight: '600',
  },
  endpointRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 12,
  },
  endpointPathBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  endpointPath: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#10B981',
    fontWeight: 'bold',
  },
  endpointDesc: {
    fontSize: 13,
    color: '#94A3B8',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: '#F43F5E',
    shadowColor: '#F43F5E',
  },
  actionButtonInactive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
