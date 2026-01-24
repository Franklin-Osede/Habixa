/**
 * Shared Styles for React Native Components
 * 
 * Best Practice: Keep component-specific styles in the component file,
 * but extract reusable styles here for consistency across the app.
 */

import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

// Helper to force styles on web
const forceWebStyle = (style: any) => {
  if (Platform.OS === 'web') {
    return { ...style, borderColor: style.borderColor + ' !important' as any };
  }
  return style;
};

/**
 * Common Button Styles
 */
export const buttonStyles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 10px 25px ${Colors.primary}4D`,
    } : {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    }),
  } as ViewStyle,
  primaryText: {
    color: Colors.backgroundDark,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  } as TextStyle,
  secondary: {
    height: 56,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  secondaryText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  } as TextStyle,
});

/**
 * Common Container Styles
 */
export const containerStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  content: {
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
});

/**
 * Common Card Styles
 */
export const cardStyles = StyleSheet.create({
  base: {
    borderRadius: 12,
    padding: 20,
    // Match HTML: bg-card-dark/40 = rgba(22, 43, 29, 0.4)
    backgroundColor: Colors.cardDark + '66', // 66 hex = 40% opacity
    borderWidth: 1,
    // Match HTML: dark:border-[#316843]
    borderColor: Colors.surfaceBorder,
  } as ViewStyle,
  selected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 0 15px ${Colors.primary}80, 0 0 30px ${Colors.primary}33`,
    } : {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 8,
    }),
  } as ViewStyle,
});

/**
 * Common Typography Styles
 */
export const typographyStyles = StyleSheet.create({
  headline: {
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    color: Colors.text,
  } as TextStyle,
  headlineAccent: {
    color: Colors.primary,
    fontStyle: 'italic',
  } as TextStyle,
  subheadline: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textDim,
    lineHeight: 24,
  } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: Colors.textDim,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textDim,
  } as TextStyle,
});

/**
 * Common Input Styles
 */
export const inputStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary + '4D',
  } as ViewStyle,
  text: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
    height: '100%',
  } as TextStyle,
});

/**
 * Common Chip/Tag Styles
 */
export const chipStyles = StyleSheet.create({
  base: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingHorizontal: 20,
  } as ViewStyle,
  selected: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  } as ViewStyle,
  unselected: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.primary + '4D',
  } as ViewStyle,
  text: {
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  textSelected: {
    color: Colors.backgroundDark,
    fontWeight: '700',
  } as TextStyle,
  textUnselected: {
    color: Colors.text,
  } as TextStyle,
});

/**
 * Common TopBar Styles
 */
export const topBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.backgroundDark + 'CC',
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
  } as ViewStyle,
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
  } as TextStyle,
  spacer: {
    width: 40,
    height: 40,
  } as ViewStyle,
});

/**
 * Common Progress Bar Styles
 */
export const progressStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  } as ViewStyle,
  text: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 4,
  } as TextStyle,
  bar: {
    width: 96,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary + '33',
    overflow: 'hidden',
  } as ViewStyle,
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  } as ViewStyle,
});

/**
 * Common Bottom Container Styles
 */
export const bottomContainerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    backgroundColor: Colors.backgroundDark,
  } as ViewStyle,
});

/**
 * Common Glow Effects
 */
export const glowStyles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: '50%',
    backgroundColor: Colors.primary + '0D',
    borderRadius: 200,
    opacity: 0.5,
    zIndex: -1,
  } as ViewStyle,
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: '25%',
    backgroundColor: Colors.primary + '0D',
    borderRadius: 200,
    opacity: 0.3,
    zIndex: -1,
  } as ViewStyle,
});
