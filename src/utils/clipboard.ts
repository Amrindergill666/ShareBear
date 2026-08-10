import { NativeModules } from 'react-native';

const { MyModule } = NativeModules;

export async function getSystemClipboardText(): Promise<string> {
  if (!MyModule || !MyModule.getClipboardText) {
    console.warn('[Clipboard] Native MyModule.getClipboardText not found');
    return '';
  }

  try {
    const text = await MyModule.getClipboardText();
    return text || '';
  } catch (err) {
    console.error('[Clipboard] Error reading clipboard:', err);
    return '';
  }
}
