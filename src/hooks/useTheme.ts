import { useMemo } from 'react';
import designTokens, { DesignTokens } from '../styles/design-tokens';

export const useDesignTokens = (): DesignTokens => {
  return useMemo(() => designTokens, []);
};

export const useTheme = () => {
  const tokens = useDesignTokens();
  
  return {
    tokens,
    // Utility functions for common styling patterns
    getTypography: (variant: 'title' | 'body' | 'caption' | 'button') => {
      switch (variant) {
        case 'title':
          return {
            fontFamily: tokens.typography.fontFamily.primary,
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.semibold,
            lineHeight: tokens.typography.lineHeight['2xl'],
            color: tokens.colors.textPrimary,
          };
        case 'body':
          return {
            fontFamily: tokens.typography.fontFamily.primary,
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.normal,
            lineHeight: tokens.typography.lineHeight.loose,
            color: tokens.colors.textSecondary,
          };
        case 'caption':
          return {
            fontFamily: tokens.typography.fontFamily.secondary,
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.normal,
            lineHeight: tokens.typography.lineHeight.tight,
            color: tokens.colors.textPrimary,
          };
        case 'button':
          return {
            fontFamily: tokens.typography.fontFamily.primary,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            lineHeight: tokens.typography.lineHeight.relaxed,
            color: tokens.colors.textLight,
          };
        default:
          return {};
      }
    },
    
    getSpacing: (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
      switch (size) {
        case 'sm':
          return tokens.spacing[2];
        case 'md':
          return tokens.spacing[3];
        case 'lg':
          return tokens.spacing[4];
        case 'xl':
          return tokens.spacing[5];
        case '2xl':
          return tokens.spacing[6];
        default:
          return tokens.spacing[2];
      }
    },
    
    getBorderRadius: (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
      switch (size) {
        case 'sm':
          return tokens.borderRadius.sm;
        case 'md':
          return tokens.borderRadius.md;
        case 'lg':
          return tokens.borderRadius.lg;
        case 'xl':
          return tokens.borderRadius.xl;
        case 'full':
          return tokens.borderRadius.full;
        default:
          return tokens.borderRadius.md;
      }
    },
  };
};

export default useTheme;