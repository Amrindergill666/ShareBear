import React from 'react';
import { View, Text, Button } from 'react-native';
import { useCounterStore } from '../store/counterStore';
import { useSettingsStore } from '../store';

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();
  const { setTheme, theme } = useSettingsStore();

  return (
    <View>
      <Text>{count}</Text>
      <Text>{theme}</Text>

      <Button title="+" onPress={increment} />

      <Button title="-" onPress={decrement} />
      <Button title="set theme light" onPress={() => setTheme('light')} />
      <Button title="set theme dark" onPress={() => setTheme('dark')} />
      <Button title="set theme system" onPress={() => setTheme('system')} />

    </View>
  );
}