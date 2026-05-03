/**
 * crawl.ts — URL → clean text ingestion for the Knowledge Base
 *
 * Fetches a URL, strips navigation/ads/boilerplate, extracts meaningful
 * text content with basic structure preserved (headings, lists, paragraphs).
 *
 * Strategy:
 *  1. Fetch with a real browser User-Agent (avoids bot blocks)
 *  2. Parse HTML with cheerio
 *  3. Remove noise elements (nav, footer, script, ads, cookie banners)
 *  4. Extract main content (tries <main>, <article>, role=main, then <body>)
 *  5. Convert to clean plain text with headings preserved as # syntax
 *  6. Count words
 */

import { load } from 'cheerio';

const FETCH_TIMEOUT_MS = 12_000;
const MAX_CONTENT_CHARS = 40_000; // ~10k tokens — safe for embeddings

const NOISE_SELECTORS = [
  'script', 'style', 'noscript', 'iframe', 'svg',
  'nav', 'header', 'footer', 'aside',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '.cookie-banner', '.ad', '.advertisement', '#sidebar',
  '.navbar', '.nav', '.menu', '.footer', '.header',
];

export interface CrawlResult {
  title: string;
  text: string;   // clean plain text, max 40k chars
  wordCount: number;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ahaget-KB/1.0; +https://ahaget.ai/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    html = await res.text();
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout fetching ${url} after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw err;
  }

  const $ = load(html);

  // ── Extract page title ──────────────────────────────────────────────────────
  const title = ($('title').first().text() || $('h1').first().text() || url).trim().slice(0, 200);

  // ── Remove noise ────────────────────────────────────────────────────────────
  NOISE_SELECTORS.forEach((sel) => $(sel).remove());

  // ── Find main content container ─────────────────────────────────────────────
  let $content = $('main').first();
  if (!$content.length) $content = $('[role="main"]').first();
  if (!$content.length) $content = $('article').first();
  if (!$content.length) $content = $('[class*="content"]').first();
  if (!$content.length) $content = $('body');

  // ── Convert to structured plain text ────────────────────────────────────────
  const lines: string[] = [];

  $content.find('h1,h2,h3,h4,p,li,td,th,pre,blockquote').each((_i, el) => {
    const tag = el.type === 'tag' ? (el as { name?: string }).name ?? '' : '';
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text) return;

    if (['h1', 'h2'].includes(tag)) lines.push(`\n## ${text}\n`);
    else if (['h3', 'h4'].includes(tag)) lines.push(`\n### ${text}\n`);
    else if (tag === 'li') lines.push(`• ${text}`);
    else if (['pre', 'blockquote'].includes(tag)) lines.push(`> ${text}`);
    else lines.push(text);
  });

  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')   // collapse excessive blank lines
    .trim()
    .slice(0, MAX_CONTENT_CHARS);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { title, text, wordCount };
}

/**
 * Basic URL validation — ensures the target is a real http(s) page,
 * not a local/private address the server can reach but the user can't control.
 */
export function validatePublicUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported');
  }

  // Block private IPs / localhost (SSRF prevention)
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.') ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    throw new Error('Private/internal URLs are not permitted');
  }

  return parsed;
}
