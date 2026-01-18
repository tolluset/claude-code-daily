import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from 'shiki';

/**
 * Singleton instance of Shiki highlighter
 * Initialized lazily on first use to avoid blocking app startup
 */
let highlighterInstance: Highlighter | null = null;
let initializationPromise: Promise<Highlighter> | null = null;

/**
 * Supported languages for syntax highlighting
 * Add more as needed, but be mindful of bundle size
 */
const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'python',
  'json',
  'html',
  'css',
  'markdown',
  'bash',
  'shell',
  'yaml',
  'sql',
  'rust',
  'go',
  'java',
];

/**
 * Themes for light and dark modes
 */
const SUPPORTED_THEMES: BundledTheme[] = ['github-light', 'github-dark'];

/**
 * Get or create the Shiki highlighter singleton instance
 * Uses lazy initialization to avoid blocking app startup
 */
export async function getShikiHighlighter(): Promise<Highlighter> {
  // Return existing instance if available
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Wait for ongoing initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start new initialization
  initializationPromise = createHighlighter({
    themes: SUPPORTED_THEMES,
    langs: SUPPORTED_LANGUAGES,
  });

  try {
    highlighterInstance = await initializationPromise;
    return highlighterInstance;
  } catch (error) {
    // Reset promise to allow retry
    initializationPromise = null;
    throw error;
  }
}

/**
 * Preload the highlighter in the background
 * Call this during app initialization to reduce first-use latency
 */
export function preloadShikiHighlighter(): void {
  // Trigger initialization without blocking
  getShikiHighlighter().catch((error) => {
    console.error('Failed to preload Shiki highlighter:', error);
  });
}

/**
 * Normalize language name to Shiki's expected format
 */
export function normalizeLanguage(lang: string | undefined): BundledLanguage {
  if (!lang) {
    return 'plaintext';
  }

  const normalized = lang.toLowerCase().trim();

  // Map common aliases to canonical names
  const aliasMap: Record<string, BundledLanguage> = {
    ts: 'typescript',
    js: 'javascript',
    py: 'python',
    sh: 'bash',
    yml: 'yaml',
    md: 'markdown',
    rs: 'rust',
  };

  const mapped = aliasMap[normalized] as BundledLanguage | undefined;
  if (mapped && SUPPORTED_LANGUAGES.includes(mapped)) {
    return mapped;
  }

  // Return as-is if it's a supported language
  if (SUPPORTED_LANGUAGES.includes(normalized as BundledLanguage)) {
    return normalized as BundledLanguage;
  }

  // Fallback to plaintext
  return 'plaintext';
}

/**
 * Highlight code using Shiki
 * Returns HTML string with syntax highlighting
 */
export async function highlightCode(
  code: string,
  language: string | undefined,
  theme: 'light' | 'dark' = 'light'
): Promise<string> {
  const highlighter = await getShikiHighlighter();
  const normalizedLang = normalizeLanguage(language);
  const themeName = theme === 'dark' ? 'github-dark' : 'github-light';

  return highlighter.codeToHtml(code, {
    lang: normalizedLang,
    theme: themeName,
  });
}
