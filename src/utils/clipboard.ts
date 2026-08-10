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

export async function setSystemClipboardText(text: string): Promise<boolean> {
  if (!MyModule || !MyModule.setClipboardText) {
    console.warn('[Clipboard] Native MyModule.setClipboardText not found');
    return false;
  }

  try {
    const result = await MyModule.setClipboardText(text);
    return !!result;
  } catch (err) {
    console.error('[Clipboard] Error writing to clipboard:', err);
    return false;
  }
}
