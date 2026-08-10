import React from 'react';
import {
  View,
  Image as RNImage,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { getAvatarImage, getAvatarId } from '../utils/avatars';

interface AvatarImageProps {
  id?: string | null;
  size: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

/**
 * Returns the recommended container borderRadius for a given avatar at a given size.
 * - main avatar: fully circular (size / 2)
 * - other avatars: squircle (size * 0.32)
 */
export function getAvatarContainerRadius(
  id?: string | null,
  size: number = 38,
): number {
  const avatarId = getAvatarId(id);
  return avatarId === 'main' ? Math.round(size / 2) : Math.round(size * 0.32);
}

export function AvatarImage({
  id,
  size,
  containerStyle,
  imageStyle,
}: AvatarImageProps) {
  const avatarId = getAvatarId(id);
  const isMain = avatarId === 'main';
  const source = getAvatarImage(id);

  // For non-main avatars (joyed, celebrate, tired, frustated), round the bottom chin
  // and keep top open so ears naturally come out without flat bottom edges
  const bottomRadius = Math.round(size * 0.8);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
        !isMain && {
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
          overflow: 'hidden',
        },
        containerStyle,
      ]}
    >
      <RNImage
        source={source}
        style={[
          {
            width: size,
            height: size,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
