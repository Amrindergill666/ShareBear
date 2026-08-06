import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';

export function SettingsScreen() {
  const {
    deviceName,
    deviceId,
    theme,
    port,
    setDeviceName,
    setTheme,
    setPort,
    resetSettings,
  } = useSettingsStore();

  const [nameInput, setNameInput] = useState(deviceName);
  const [portInput, setPortInput] = useState(port.toString());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setDeviceName(nameInput.trim() || 'ShareBear Device');
    
    const parsedPort = parseInt(portInput, 10);
    if (!isNaN(parsedPort) && parsedPort >= 1024 && parsedPort <= 65535) {
      setPort(parsedPort);
    } else {
      setPortInput(port.toString());
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setNameInput('ShareBear Device');
    setPortInput('53317');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>System Settings</Text>
        <Text style={styles.subtitle}>Configure your device profile for local sharing</Text>

        {/* Device Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Device Profile</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>Device Name</Text>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. My Phone"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.helperText}>This name will be visible to nearby devices.</Text>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>Device ID (Read-only)</Text>
            <Text style={styles.readOnlyText}>{deviceId || 'Generated on first discovery start'}</Text>
          </View>
        </View>

        {/* Connection Configuration Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Connection Settings</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>HTTP Port</Text>
            <TextInput
              style={styles.input}
              value={portInput}
              onChangeText={setPortInput}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="53318"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.helperText}>Port range: 1024 to 65535. Default is 53317.</Text>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.label}>Theme Preference</Text>
            <View style={styles.themeRow}>
              {(['light', 'dark', 'system'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeButton,
                    theme === t && styles.themeButtonActive,
                  ]}
                  onPress={() => setTheme(t)}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      theme === t && styles.themeButtonTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isSaved ? '✓ Settings Saved' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  settingGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: '#F8FAFC',
    fontSize: 15,
  },
  readOnlyText: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#64748B',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  themeButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  themeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  themeButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  themeButtonTextActive: {
    color: '#FFFFFF',
  },
  actionsContainer: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    borderColor: '#F43F5E',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#F43F5E',
    fontSize: 16,
    fontWeight: '600',
  },
});
