import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from 'shiki';

/**
 * Singleton instance of Shiki highlighter
 * Initialized lazily on first use to avoid blocking app startup
 */
let highlighterInstance: Highlighter | null = null;
let initializationPromise: Promise<Highlighter> | null = null;

/**
 * Critical languages loaded on initialization
 * These are frequently used in Claude Code sessions
 */
const CRITICAL_LANGUAGES: BundledLanguage[] = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'python',
  'json',
  'markdown',
  'bash',
  'shell',
];

/**
 * Optional languages loaded on-demand
 * These are less frequently used and loaded only when needed
 */
const OPTIONAL_LANGUAGES: BundledLanguage[] = [
  'html',
  'css',
  'yaml',
  'sql',
  'rust',
  'go',
  'java',
];

/**
 * All supported languages (for validation)
 */
const SUPPORTED_LANGUAGES = [...CRITICAL_LANGUAGES, ...OPTIONAL_LANGUAGES];

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

  // Start new initialization with critical languages only
  initializationPromise = createHighlighter({
    themes: SUPPORTED_THEMES,
    langs: CRITICAL_LANGUAGES,
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
 * Load an optional language on-demand
 * This function is idempotent - safe to call multiple times for the same language
 */
export async function loadOptionalLanguage(lang: BundledLanguage): Promise<void> {
  // Only load if it's an optional language
  if (!OPTIONAL_LANGUAGES.includes(lang)) {
    return;
  }

  const highlighter = await getShikiHighlighter();
  const loadedLanguages = highlighter.getLoadedLanguages();

  // Skip if already loaded
  if (loadedLanguages.includes(lang)) {
    return;
  }

  try {
    await highlighter.loadLanguage(lang);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Failed to load optional language: ${lang}`, error);
    }
  }
}

/**
 * Normalize language name to Shiki's expected format
 */
export function normalizeLanguage(lang: string | undefined): BundledLanguage {
  if (!lang) {
    return 'text' as BundledLanguage;
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

  // Fallback to text
  return 'text' as BundledLanguage;
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
