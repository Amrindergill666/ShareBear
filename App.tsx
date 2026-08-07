import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { ServerScreen } from './src/screens/Server/ServerScreen';
import { SettingsScreen } from './src/screens/Settings/SettingsScreen';
import { TransferHistoryScreen } from './src/screens/Transfers/TransferHistoryScreen';
import { IncomingTransferDialog } from './src/components/IncomingTransferDialog';
import { useUiStore } from './src/store/uiStore';
import { useSettingsStore } from './src/store';
import { getDeviceId, getDeviceName, getBrand } from 'react-native-device-info';
import { startServer } from './src/features/server/serverManager';
import { initializeTransferManager } from './src/features/transfer/TransferManager';

function AppContent() {
  const { setDeviceName, setDeviceId } = useSettingsStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const name = await getDeviceName();
        setDeviceName(`${getBrand()} ${name}`);
        const id = getDeviceId();
        setDeviceId(id);

        // Auto-start HTTP Control Server on app launch
        await startServer();

        // Initialize Transfer Manager (load persisted logs & start handshake listeners)
        initializeTransferManager();
      } catch (err) {
        console.error('Failed to initialize app:', err);
      }
    };
    initializeApp();
  }, []);

  const safeAreaInsets = useSafeAreaInsets();
  const { activeScreen, setActiveScreen } = useUiStore();

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingBottom: safeAreaInsets.bottom,
          paddingTop: safeAreaInsets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐻 ShareBear</Text>
        <Text style={styles.headerSubtitle}>LAN Peer-to-Peer sharing</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeScreen === 'Home' && <HomeScreen />}
        {activeScreen === 'Transfers' && <TransferHistoryScreen />}
        {activeScreen === 'Server' && <ServerScreen />}
        {activeScreen === 'Settings' && <SettingsScreen />}
      </View>

      {/* Mount the Global Incoming Dialog Overlay */}
      <IncomingTransferDialog />

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeScreen === 'Home' && styles.tabItemActive,
          ]}
          onPress={() => setActiveScreen('Home')}
        >
          <Text style={styles.tabIcon}>📡</Text>
          <Text
            style={[
              styles.tabLabel,
              activeScreen === 'Home' && styles.tabLabelActive,
            ]}
          >
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeScreen === 'Transfers' && styles.tabItemActive,
          ]}
          onPress={() => setActiveScreen('Transfers')}
        >
          <Text style={styles.tabIcon}>📦</Text>
          <Text
            style={[
              styles.tabLabel,
              activeScreen === 'Transfers' && styles.tabLabelActive,
            ]}
          >
            Transfers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeScreen === 'Server' && styles.tabItemActive,
          ]}
          onPress={() => setActiveScreen('Server')}
        >
          <Text style={styles.tabIcon}>🖥️</Text>
          <Text
            style={[
              styles.tabLabel,
              activeScreen === 'Server' && styles.tabLabelActive,
            ]}
          >
            Server
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeScreen === 'Settings' && styles.tabItemActive,
          ]}
          onPress={() => setActiveScreen('Settings')}
        >
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text
            style={[
              styles.tabLabel,
              activeScreen === 'Settings' && styles.tabLabelActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 76 : 60,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 6,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#3B82F6',
  },
});
