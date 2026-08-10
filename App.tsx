import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { NearbyScreen } from './src/screens/Nearby/NearbyScreen';
import { DevicesScreen } from './src/screens/Devices/DevicesScreen';
import { SettingsScreen } from './src/screens/Settings/SettingsScreen';
import { TransferHistoryScreen } from './src/screens/Transfers/TransferHistoryScreen';
import { IncomingTransferDialog } from './src/components/IncomingTransferDialog';
import { TransferProgressDialog } from './src/components/TransferProgressDialog';
import { ReceivedTextModal } from './src/components/ReceivedTextModal';
import { useUiStore } from './src/store/uiStore';
import { useSettingsStore } from './src/store';
import { getDeviceId, getDeviceName, getBrand } from 'react-native-device-info';
import { startServer } from './src/features/server/serverManager';
import { initializeTransferManager } from './src/features/transfer/TransferManager';
import Navbar from "./src/navtab/navbar"
import { useTheme } from './src/theme';

function AppContent() {
  const { setDeviceName, setDeviceId } = useSettingsStore();
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const name = await getDeviceName();
        setDeviceName(`${getBrand()} ${name}`);
        const id = getDeviceId();
        setDeviceId(id);

        // Request network/location permission on Android for Wi-Fi SSID access
        if (Platform.OS === 'android') {
          try {
            await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ]);
          } catch (pErr) {
            console.warn('Permission error:', pErr);
          }
        }

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
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Main Content Area - Instant Zero-Lag Tab Switching */}
      <View style={styles.content}>
        <View style={[styles.screenWrapper, activeScreen !== 'Home' && styles.hiddenScreen]}>
          <HomeScreen />
        </View>
        <View style={[styles.screenWrapper, activeScreen !== 'Transfers' && styles.hiddenScreen]}>
          <TransferHistoryScreen />
        </View>
        <View style={[styles.screenWrapper, (activeScreen !== 'Nearby' && activeScreen !== 'Server') && styles.hiddenScreen]}>
          <NearbyScreen />
        </View>
        <View style={[styles.screenWrapper, (activeScreen !== 'Devices' && activeScreen !== 'Settings') && styles.hiddenScreen]}>
          <DevicesScreen />
        </View>
      </View>

      {/* Mount the Global Incoming Dialog Overlay */}
      <IncomingTransferDialog />

      {/* Mount the Global Transfer Progress Dialog */}
      <TransferProgressDialog />

      {/* Mount the Global Received Text / Clipboard Modal */}
      <ReceivedTextModal />

      <Navbar safeAreaInsets={safeAreaInsets}/>
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
    position:'relative'
  },
  content: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  hiddenScreen: {
    display: 'none',
  },
});
