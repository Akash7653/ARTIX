/**
 * Modern Typography System
 * Premium font styling and hierarchy for ARTIX website
 * Focuses on readability, accessibility, and visual hierarchy
 */

export const typographyConfig = {
  fonts: {
    // Primary font - modern, clean, professional
    primary: {
      name: 'Inter',
      fallback: 'system-ui, -apple-system, sans-serif',
      weights: [400, 500, 600, 700, 800, 900],
      import: '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");'
    },
    // Display font - bold, modern, distinctive
    display: {
      name: 'Poppins',
      fallback: 'system-ui, -apple-system, sans-serif',
      weights: [600, 700, 800, 900],
      import: '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&display=swap");'
    },
    // Monospace for code/technical content
    mono: {
      name: 'JetBrains Mono',
      fallback: '"Courier New", monospace',
      weights: [400, 500, 600],
      import: '@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap");'
    }
  },

  // Typography scale (rem units, adjusted for readability)
  scale: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },

  // Line heights for optimal readability
  lineHeight: {
    tight: 1.1,      // 10% more than font-size
    snug: 1.25,      // Headings
    normal: 1.5,     // Body text
    relaxed: 1.625,  // Lists, forms
    loose: 2,        // Widely spaced content
  },

  // Letter spacing for professional appearance
  letterSpacing: {
    tighter: '-0.05rem',
    tight: '-0.025rem',
    normal: '0rem',
    wide: '0.025rem',
    wider: '0.05rem',
    widest: '0.1rem',
  }
};

/**
 * CSS Variable Definitions
 * Should be added to your root :root or theme CSS
 */
export const typographyVariables = `
:root {
  /* Font Families */
  --font-primary: ${typographyConfig.fonts.primary.name}, ${typographyConfig.fonts.primary.fallback};
  --font-display: ${typographyConfig.fonts.display.name}, ${typographyConfig.fonts.display.fallback};
  --font-mono: ${typographyConfig.fonts.mono.name}, ${typographyConfig.fonts.mono.fallback};

  /* Font Sizes */
  --text-xs: ${typographyConfig.scale.xs};
  --text-sm: ${typographyConfig.scale.sm};
  --text-base: ${typographyConfig.scale.base};
  --text-lg: ${typographyConfig.scale.lg};
  --text-xl: ${typographyConfig.scale.xl};
  --text-2xl: ${typographyConfig.scale['2xl']};
  --text-3xl: ${typographyConfig.scale['3xl']};
  --text-4xl: ${typographyConfig.scale['4xl']};
  --text-5xl: ${typographyConfig.scale['5xl']};
  --text-6xl: ${typographyConfig.scale['6xl']};
  --text-7xl: ${typographyConfig.scale['7xl']};

  /* Line Heights */
  --lh-tight: ${typographyConfig.lineHeight.tight};
  --lh-snug: ${typographyConfig.lineHeight.snug};
  --lh-normal: ${typographyConfig.lineHeight.normal};
  --lh-relaxed: ${typographyConfig.lineHeight.relaxed};
  --lh-loose: ${typographyConfig.lineHeight.loose};

  /* Letter Spacing */
  --ls-tighter: ${typographyConfig.letterSpacing.tighter};
  --ls-tight: ${typographyConfig.letterSpacing.tight};
  --ls-normal: ${typographyConfig.letterSpacing.normal};
  --ls-wide: ${typographyConfig.letterSpacing.wide};
  --ls-wider: ${typographyConfig.letterSpacing.wider};
  --ls-widest: ${typographyConfig.letterSpacing.widest};
}
`;

/**
 * Tailwind CSS Configuration Additions
 * Add these to your tailwind.config.js
 */
export const tailwindTypographyConfig = {
  extend: {
    fontFamily: {
      primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: 1.1 }],
      sm: ['0.875rem', { lineHeight: 1.25 }],
      base: ['1rem', { lineHeight: 1.5 }],
      lg: ['1.125rem', { lineHeight: 1.5 }],
      xl: ['1.25rem', { lineHeight: 1.625 }],
      '2xl': ['1.5rem', { lineHeight: 1.625 }],
      '3xl': ['1.875rem', { lineHeight: 1.1 }],
      '4xl': ['2.25rem', { lineHeight: 1.1 }],
      '5xl': ['3rem', { lineHeight: 1 }],
      '6xl': ['3.75rem', { lineHeight: 1 }],
      '7xl': ['4.5rem', { lineHeight: 1 }],
    },
    letterSpacing: {
      tighter: '-0.05rem',
      tight: '-0.025rem',
      normal: '0rem',
      wide: '0.025rem',
      wider: '0.05rem',
      widest: '0.1rem',
    }
  }
};

/**
 * HTML / Tailwind Typography Classes
 * Usage: <h1 className={heading1}>Title</h1>
 */
export const typographyClasses = {
  // Headings
  h1: 'font-display text-6xl font-900 leading-snug tracking-tight drop-shadow-lg text-white',
  h2: 'font-display text-5xl font-800 leading-snug tracking-tight text-gray-900 dark:text-white',
  h3: 'font-display text-4xl font-700 leading-snug text-gray-900 dark:text-white',
  h4: 'font-display text-3xl font-700 text-gray-900 dark:text-white',
  h5: 'font-primary text-2xl font-700 text-gray-900 dark:text-white',
  h6: 'font-primary text-xl font-600 text-gray-700 dark:text-gray-300',

  // Body text
  body: 'font-primary text-base leading-normal text-gray-900 dark:text-gray-100',
  bodyLg: 'font-primary text-lg leading-relaxed text-gray-900 dark:text-gray-100',
  bodySm: 'font-primary text-sm leading-normal text-gray-700 dark:text-gray-300',
  bodyXs: 'font-primary text-xs leading-normal text-gray-600 dark:text-gray-400',

  // Labels & buttons
  label: 'font-primary text-sm font-600 uppercase tracking-wide text-gray-700 dark:text-gray-300',
  button: 'font-primary text-base font-600 tracking-wide text-white',

  // Code & monospace
  code: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-red-600 dark:text-red-400',
  pre: 'font-mono text-sm leading-relaxed bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto',

  // Special
  eyebrow: 'font-display text-lg font-700 uppercase tracking-widest text-blue-600 dark:text-blue-400',
  caption: 'font-primary text-xs font-500 tracking-wide text-gray-600 dark:text-gray-400',
  quote: 'font-primary text-xl italic leading-relaxed border-l-4 border-blue-600 pl-4 text-gray-700 dark:text-gray-300',
};

/**
 * React Typography Components
 */
import React from 'react';

export function H1({ children, className = '' }) {
  return <h1 className={`${typographyClasses.h1} ${className}`}>{children}</h1>;
}

export function H2({ children, className = '' }) {
  return <h2 className={`${typographyClasses.h2} ${className}`}>{children}</h2>;
}

export function H3({ children, className = '' }) {
  return <h3 className={`${typographyClasses.h3} ${className}`}>{children}</h3>;
}

export function H4({ children, className = '' }) {
  return <h4 className={`${typographyClasses.h4} ${className}`}>{children}</h4>;
}

export function H5({ children, className = '' }) {
  return <h5 className={`${typographyClasses.h5} ${className}`}>{children}</h5>;
}

export function H6({ children, className = '' }) {
  return <h6 className={`${typographyClasses.h6} ${className}`}>{children}</h6>;
}

export function Body({ children, size = 'base', className = '' }) {
  const sizeClasses = {
    xs: typographyClasses.bodyXs,
    sm: typographyClasses.bodySm,
    base: typographyClasses.body,
    lg: typographyClasses.bodyLg,
  };

  return <p className={`${sizeClasses[size]} ${className}`}>{children}</p>;
}

export function Label({ children, className = '' }) {
  return <label className={`${typographyClasses.label} ${className}`}>{children}</label>;
}

export function Eyebrow({ children, className = '' }) {
  return <span className={`${typographyClasses.eyebrow} ${className}`}>{children}</span>;
}

export function Caption({ children, className = '' }) {
  return <p className={`${typographyClasses.caption} ${className}`}>{children}</p>;
}

export function Quote({ children, author = '', className = '' }) {
  return (
    <blockquote className={className}>
      <p className={typographyClasses.quote}>{children}</p>
      {author && <footer className={`${typographyClasses.caption} mt-2 text-right`}>— {author}</footer>}
    </blockquote>
  );
}

export function Code({ children, className = '' }) {
  return <code className={`${typographyClasses.code} ${className}`}>{children}</code>;
}

/**
 * Font Import & Setup Instructions
 */
export const setupInstructions = `
To use this typography system:

1. Add Google Fonts import to your index.html HEAD or CSS file:
   ${typographyConfig.fonts.primary.import}
   ${typographyConfig.fonts.display.import}
   ${typographyConfig.fonts.mono.import}

2. Add typography variables to your global CSS or tailwind theme:
   ${typographyVariables}

3. Update your tailwind.config.js:
   module.exports = {
     theme: {
       extend: ${JSON.stringify(tailwindTypographyConfig.extend, null, 2)}
     }
   }

4. Use typography components in React or Tailwind classes:
   <H1>Main Heading</H1>
   <Body size="lg">Body text with larger size</Body>
   <p className="${typographyClasses.body}">Regular paragraph</p>

5. Import and use in your landing page:
   import { H1, H2, Body, Eyebrow } from '@/components/Typography';
`;

export default {
  typographyConfig,
  typographyVariables,
  tailwindTypographyConfig,
  typographyClasses,
  setupInstructions,
  H1, H2, H3, H4, H5, H6,
  Body, Label, Eyebrow, Caption, Quote, Code
};
