import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { MediaModule } = NativeModules;

export interface RealMediaFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  uri: string;
  type: 'photo' | 'video' | 'doc' | 'music';
}

export async function requestMediaPermissions(category?: 'photo' | 'video' | 'doc' | 'music'): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const androidVersion = Platform.Version;

    if (typeof androidVersion === 'number' && androidVersion >= 33) {
      const permissions: any[] = [
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ];
      if ((PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_VISUAL_USER_SELECTED) {
        permissions.push((PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_VISUAL_USER_SELECTED);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const imagesGranted =
        granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED ||
        (granted as any)['android.permission.READ_MEDIA_VISUAL_USER_SELECTED'] === PermissionsAndroid.RESULTS.GRANTED;
      const videosGranted = granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.GRANTED;
      const audioGranted = granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

      return imagesGranted || videosGranted || audioGranted;
    } else {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

      return readGranted || writeGranted;
    }
  } catch (err) {
    console.error('[MediaModule] Permission request error:', err);
    return false;
  }
}

export async function fetchDeviceMediaFiles(
  category: 'photo' | 'video' | 'doc' | 'music',
  limit: number = 60
): Promise<RealMediaFile[]> {
  if (!MediaModule || !MediaModule.getMediaFiles) {
    console.warn('[MediaModule] Native MediaModule not found');
    return [];
  }

  try {
    const files: RealMediaFile[] = await MediaModule.getMediaFiles(category, limit);
    return files || [];
  } catch (err) {
    console.error('[MediaModule] fetchDeviceMediaFiles error:', err);
    return [];
  }
}
