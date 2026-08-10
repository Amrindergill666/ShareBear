import { ImageSourcePropType } from 'react-native';

export interface AvatarItem {
  id: string;
  name: string;
  image: ImageSourcePropType;
  symbol: string;
}

export const AVATARS: AvatarItem[] = [
  {
    id: 'main',
    name: 'Classic Bear',
    image: require('../assets/avatars/main.png'),
    symbol: '🐻',
  },
  {
    id: 'joyed',
    name: 'Joyful Bear',
    image: require('../assets/avatars/joyed.png'),
    symbol: '😄',
  },
  {
    id: 'celebrate',
    name: 'Celebrate Bear',
    image: require('../assets/avatars/celebrate.png'),
    symbol: '🎉',
  },
  {
    id: 'tired',
    name: 'Tired Bear',
    image: require('../assets/avatars/tired.png'),
    symbol: '😴',
  },
  {
    id: 'frustated',
    name: 'Frustrated Bear',
    image: require('../assets/avatars/frustated.png'),
    symbol: '😤',
  },
];

export const DEFAULT_AVATAR_ID = 'main';
export const DEFAULT_AVATAR_IMAGE = AVATARS[0].image;
export const DEFAULT_AVATAR_SYMBOL = '🐻';

export const AVATAR_MAP: Record<string, AvatarItem> = AVATARS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, AvatarItem>
);

/**
 * Returns the AvatarItem object for a given avatar ID.
 * Falls back to default 'main' avatar if ID is not found.
 */
export function getAvatarById(id?: string | null): AvatarItem {
  if (!id) return AVATAR_MAP[DEFAULT_AVATAR_ID];
  return AVATAR_MAP[id] || AVATARS.find((a) => a.symbol === id) || AVATAR_MAP[DEFAULT_AVATAR_ID];
}

/**
 * Returns the require/ImageSource for an avatar ID or returns default image.
 */
export function getAvatarImage(id?: string | null): ImageSourcePropType {
  const avatar = getAvatarById(id);
  return avatar.image;
}

/**
 * Checks if the given ID or string matches one of our PNG avatar IDs.
 */
export function isPngAvatar(id?: string | null): boolean {
  if (!id) return false;
  return !!AVATAR_MAP[id];
}

/**
 * Resolves the avatar ID from an emoji symbol or avatar ID.
 */
export function getAvatarId(idOrSymbol?: string | null): string {
  if (!idOrSymbol) return DEFAULT_AVATAR_ID;
  if (AVATAR_MAP[idOrSymbol]) return idOrSymbol;
  const found = AVATARS.find((a) => a.symbol === idOrSymbol);
  return found ? found.id : DEFAULT_AVATAR_ID;
}

/**
 * Helper to get symbol fallback
 */
export function getAvatarSymbol(idOrSymbol?: string | null): string {
  const avatar = getAvatarById(idOrSymbol);
  return avatar.symbol || DEFAULT_AVATAR_SYMBOL;
}
