import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { ServerScreen } from './src/screens/Server/ServerScreen';
import { SettingsScreen } from './src/screens/Settings/SettingsScreen';
import { TransferHistoryScreen } from './src/screens/Transfers/TransferHistoryScreen';
import { IncomingTransferDialog } from './src/components/IncomingTransferDialog';
import { TransferProgressDialog } from './src/components/TransferProgressDialog';
import { useUiStore } from './src/store/uiStore';
import { useSettingsStore } from './src/store';
import { getDeviceId, getDeviceName, getBrand } from 'react-native-device-info';
import { startServer } from './src/features/server/serverManager';
import { initializeTransferManager } from './src/features/transfer/TransferManager';
import Navbar from "./src/navtab/navbar"

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
        // {
        //   paddingTop: safeAreaInsets.top,
        // },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#051521" />

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeScreen === 'Home' && <HomeScreen />}
        {activeScreen === 'Transfers' && <TransferHistoryScreen />}
        {activeScreen === 'Server' && <ServerScreen />}
        {activeScreen === 'Settings' && <SettingsScreen />}
      </View>

      {/* Mount the Global Incoming Dialog Overlay */}
      <IncomingTransferDialog />

      {/* Mount the Global Transfer Progress Dialog */}
      <TransferProgressDialog />

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
    backgroundColor: '#051521',
    position:'relative'
  },
  content: {
    flex: 1,
  },
});
