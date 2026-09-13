import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { gifSource, imgSource } from '../data/exercises';
import { colors } from '../theme';

export function ExerciseThumb({
  id,
  size = 64,
  style,
}: {
  id: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const src = imgSource(id);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.22 }, style]}>
      {src ? (
        <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
      ) : null}
    </View>
  );
}

export function ExerciseGif({
  id,
  size,
  style,
}: {
  id: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const src = gifSource(id);
  const thumb = imgSource(id);
  return (
    <View style={[styles.gifWrap, size ? { width: size, height: size } : styles.gifFill, style]}>
      {src ? (
        <Image
          source={src}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          placeholder={thumb}
          transition={150}
          autoplay
          cachePolicy="memory-disk"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  gifWrap: {
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  gifFill: { width: '100%', aspectRatio: 1 },
});
