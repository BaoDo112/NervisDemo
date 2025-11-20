export interface DesignTokens {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryTransparent: string;
    bgPrimary: string;
    bgSecondary: string;
    bgGradient: string;
    bgDark: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textLight: string;
    textPlaceholder: string;
    borderPrimary: string;
    borderSecondary: string;
    borderTertiary: string;
    borderLight: string;
    borderDivider: string;
    error: string;
    warning: string;
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
      loose: string;
      xl: string;
      '2xl': string;
    };
  };
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
    circle: string;
  };
  shadows: {
    outline: string;
  };
  layout: {
    maxWidth: string;
    contentWidth: string;
    sidebarWidth: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export const designTokens: DesignTokens = {
  colors: {
    primary: 'var(--color-primary)',
    primaryLight: 'var(--color-primary-light)',
    primaryDark: 'var(--color-primary-dark)',
    primaryTransparent: 'var(--color-primary-transparent)',
    bgPrimary: 'var(--color-bg-primary)',
    bgSecondary: 'var(--color-bg-secondary)',
    bgGradient: 'var(--color-bg-gradient)',
    bgDark: 'var(--color-bg-dark)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textTertiary: 'var(--color-text-tertiary)',
    textLight: 'var(--color-text-light)',
    textPlaceholder: 'var(--color-text-placeholder)',
    borderPrimary: 'var(--color-border-primary)',
    borderSecondary: 'var(--color-border-secondary)',
    borderTertiary: 'var(--color-border-tertiary)',
    borderLight: 'var(--color-border-light)',
    borderDivider: 'var(--color-border-divider)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
  },
  typography: {
    fontFamily: {
      primary: 'var(--font-primary)',
      secondary: 'var(--font-secondary)',
    },
    fontSize: {
      xs: 'var(--font-size-xs)',
      sm: 'var(--font-size-sm)',
      base: 'var(--font-size-base)',
      lg: 'var(--font-size-lg)',
      xl: 'var(--font-size-xl)',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 'var(--line-height-tight)',
      normal: 'var(--line-height-normal)',
      relaxed: 'var(--line-height-relaxed)',
      loose: 'var(--line-height-loose)',
      xl: 'var(--line-height-xl)',
      '2xl': 'var(--line-height-2xl)',
    },
  },
  spacing: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    lg: 'var(--space-lg)',
    xl: 'var(--space-xl)',
    '2xl': 'var(--space-2xl)',
    '3xl': 'var(--space-3xl)',
  },
  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
    circle: 'var(--radius-circle)',
  },
  shadows: {
    outline: 'var(--shadow-outline)',
  },
  layout: {
    maxWidth: 'var(--layout-max-width)',
    contentWidth: 'var(--layout-content-width)',
    sidebarWidth: 'var(--layout-sidebar-width)',
  },
  transitions: {
    fast: 'var(--transition-fast)',
    normal: 'var(--transition-normal)',
    slow: 'var(--transition-slow)',
  },
};

export default designTokens;