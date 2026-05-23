/**
 * interfaceMap.ts — Interface Map routes
 *
 * API-key protected (widget inspector + agent):
 *   POST   /api/v1/interface-map/capture         — upsert snapshot + elements from widget inspector
 *   GET    /api/v1/interface-map/context          — annotated elements for current page (?url=<path>)
 *
 * JWT-protected (dashboard):
 *   GET    /api/v1/interface-map/snapshots        — list all snapshots for org
 *   GET    /api/v1/interface-map/snapshots/:id    — get one snapshot with all elements
 *   PATCH  /api/v1/interface-map/elements/:id    — update annotation on one element
 *   DELETE /api/v1/interface-map/snapshots/:id   — archive (soft-delete) a snapshot
 */

import { Router, Response, Request } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── Helper: fuzzy URL matcher ────────────────────────────────────────────────
function urlMatches(storedUrl: string, liveUrl: string): boolean {
  const s = storedUrl.toLowerCase().replace(/\/$/, '');
  const l = liveUrl.toLowerCase().replace(/\/$/, '');
  return s === l || l.startsWith(s) || s.startsWith(l);
}

// ─── Helper: map raw element payload to Prisma create shape ──────────────────
function mapElement(el: {
  tag: string;
  selector: string;
  text?: string;
  elementType?: string;
  inputType?: string;
  ariaLabel?: string;
  placeholder?: string;
  name?: string;
  dataTestId?: string;
  role?: string;
  classes?: string[];
  rect?: { x: number; y: number; w: number; h: number };
  customLabel?: string;
  customDescription?: string;
  businessRule?: string;
  isSensitive?: boolean;
}) {
  return {
    tag:              el.tag,
    selector:         el.selector,
    text:             el.text || '',
    elementType:      el.elementType || inferElementType(el.tag, el.inputType),
    inputType:        el.inputType    || null,
    ariaLabel:        el.ariaLabel    || null,
    placeholder:      el.placeholder  || null,
    name:             el.name         || null,
    dataTestId:       el.dataTestId   || null,
    role:             el.role         || null,
    classes:          el.classes      || [],
    rect:             el.rect         ?? {},
    customLabel:      el.customLabel       || null,
    customDescription: el.customDescription || null,
    businessRule:     el.businessRule      || null,
    isSensitive:      el.isSensitive       ?? false,
    annotatedAt: (el.customLabel || el.customDescription || el.businessRule) ? new Date() : null,
  };
}

// ─── POST /api/v1/interface-map/capture (API-key auth) ────────────────────────
// Called by the widget inspector after a page scan + annotations.
// Upserts by (organizationId, url, stateLabel) — re-saving the same page+state
// replaces its elements rather than accumulating duplicates.
router.post('/capture', authenticateApiKey, async (req: Request, res: Response) => {
  const orgId = (req as AuthenticatedRequest).organization?.id;
  if (!orgId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { url, title, stateLabel, framework, elements } = req.body as {
    url: string;
    title?: string;
    stateLabel?: string;
    framework?: string;
    elements: Array<{
      tag: string; selector: string; text?: string;
      elementType?: string; inputType?: string; ariaLabel?: string;
      placeholder?: string; name?: string; dataTestId?: string;
      role?: string; classes?: string[]; rect?: { x: number; y: number; w: number; h: number };
      customLabel?: string; customDescription?: string; businessRule?: string; isSensitive?: boolean;
    }>;
  };

  if (!url?.trim()) { res.status(400).json({ error: 'url is required' }); return; }
  if (!Array.isArray(elements)) { res.status(400).json({ error: 'elements array is required' }); return; }

  const cleanUrl        = url.trim();
  const cleanStateLabel = stateLabel?.trim() || 'Default';
  const annotatedCount  = elements.filter(
    (e) => e.customLabel || e.customDescription || e.businessRule
  ).length;

  try {
    // Upsert: find existing active snapshot for this org+url+stateLabel
    const existing = await prisma.interfacePageSnapshot.findFirst({
      where: { organizationId: orgId, url: cleanUrl, stateLabel: cleanStateLabel, isActive: true },
      select: { id: true },
    });

    let snapshot;

    if (existing) {
      // Replace elements — delete old set, create new set
      await prisma.interfaceElement.deleteMany({ where: { snapshotId: existing.id } });
      snapshot = await prisma.interfacePageSnapshot.update({
        where: { id: existing.id },
        data: {
          title:          title?.trim() || cleanUrl,
          framework:      framework?.trim() || 'unknown',
          elementCount:   elements.length,
          annotatedCount,
          capturedAt:     new Date(),
          elements: { create: elements.map(mapElement) },
        },
        include: {
          elements: { select: { id: true, tag: true, selector: true, text: true, elementType: true } },
        },
      });
    } else {
      snapshot = await prisma.interfacePageSnapshot.create({
        data: {
          organizationId: orgId,
          url:            cleanUrl,
          title:          title?.trim() || cleanUrl,
          stateLabel:     cleanStateLabel,
          framework:      framework?.trim() || 'unknown',
          elementCount:   elements.length,
          annotatedCount,
          elements: { create: elements.map(mapElement) },
        },
        include: {
          elements: { select: { id: true, tag: true, selector: true, text: true, elementType: true } },
        },
      });
    }

    res.status(existing ? 200 : 201).json({ snapshot });
  } catch (err) {
    console.error('[interface-map/capture] error:', err);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// ─── GET /api/v1/interface-map/context (API-key auth) ────────────────────────
router.get('/context', authenticateApiKey, async (req: Request, res: Response) => {
  const orgId = (req as AuthenticatedRequest).organization?.id;
  if (!orgId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const pageUrl = (req.query.url as string)?.trim();
  if (!pageUrl) { res.json({ context: '', elements: [] }); return; }

  try {
    const snapshots = await prisma.interfacePageSnapshot.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        elements: {
          where: {
            OR: [
              { customLabel: { not: null } },
              { customDescription: { not: null } },
              { businessRule: { not: null } },
            ],
          },
          select: {
            id: true, tag: true, selector: true, text: true,
            elementType: true, customLabel: true, customDescription: true,
            businessRule: true, isSensitive: true,
          },
        },
      },
    });

    const matching = snapshots.filter((s) => urlMatches(s.url, pageUrl));
    if (matching.length === 0) { res.json({ context: '', elements: [] }); return; }

    const annotated = matching.flatMap((s) => s.elements);
    if (annotated.length === 0) { res.json({ context: '', elements: [] }); return; }

    const lines = annotated.map((e) => {
      const parts: string[] = [
        `[${e.elementType}] "${e.customLabel || e.text}" (${e.selector})`,
      ];
      if (e.customDescription) parts.push(`  Description: ${e.customDescription}`);
      if (e.businessRule)      parts.push(`  Rule: ${e.businessRule}`);
      if (e.isSensitive)       parts.push(`  Sensitive: true — do not read or log value`);
      return parts.join('\n');
    });

    const context = [
      '## Interface Map — Element-Level Context',
      `Page: ${pageUrl}`,
      lines.join('\n\n'),
    ].join('\n');

    res.json({ context, elements: annotated });
  } catch (err) {
    console.error('[interface-map/context] error:', err);
    res.status(500).json({ error: 'Failed to load interface context' });
  }
});

// All routes below require JWT
router.use(authenticateJWT);

// ─── GET /api/v1/interface-map/snapshots ──────────────────────────────────────
router.get('/snapshots', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  try {
    const snapshots = await prisma.interfacePageSnapshot.findMany({
      where: { organizationId: orgId, isActive: true },
      select: {
        id: true, url: true, title: true, stateLabel: true,
        framework: true, elementCount: true, annotatedCount: true,
        capturedAt: true, isActive: true,
      },
      orderBy: { capturedAt: 'desc' },
    });
    res.json({ snapshots });
  } catch (err) {
    console.error('[interface-map/snapshots] error:', err);
    res.status(500).json({ error: 'Failed to list snapshots' });
  }
});

// ─── GET /api/v1/interface-map/snapshots/:id ──────────────────────────────────
router.get('/snapshots/:id', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  try {
    const snapshot = await prisma.interfacePageSnapshot.findFirst({
      where: { id: req.params.id, organizationId: orgId },
      include: { elements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!snapshot) { res.status(404).json({ error: 'Snapshot not found' }); return; }
    res.json({ snapshot });
  } catch (err) {
    console.error('[interface-map/snapshots/:id] error:', err);
    res.status(500).json({ error: 'Failed to load snapshot' });
  }
});

// ─── PATCH /api/v1/interface-map/elements/:id ─────────────────────────────────
router.patch('/elements/:id', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const { customLabel, customDescription, businessRule, isSensitive, elementType } = req.body as {
    customLabel?: string;
    customDescription?: string;
    businessRule?: string;
    isSensitive?: boolean;
    elementType?: string;
  };

  try {
    const existing = await prisma.interfaceElement.findFirst({
      where: { id: req.params.id, snapshot: { organizationId: orgId } },
      include: { snapshot: { select: { id: true, organizationId: true } } },
    });
    if (!existing) { res.status(404).json({ error: 'Element not found' }); return; }

    const isAnnotated = !!(customLabel || customDescription || businessRule);

    const element = await prisma.interfaceElement.update({
      where: { id: req.params.id },
      data: {
        ...(customLabel !== undefined       && { customLabel:       customLabel?.trim()       || null }),
        ...(customDescription !== undefined && { customDescription: customDescription?.trim() || null }),
        ...(businessRule !== undefined      && { businessRule:      businessRule?.trim()      || null }),
        ...(isSensitive !== undefined       && { isSensitive }),
        ...(elementType !== undefined       && { elementType }),
        annotatedAt: isAnnotated ? new Date() : null,
      },
    });

    const annotatedCount = await prisma.interfaceElement.count({
      where: {
        snapshotId: existing.snapshot.id,
        OR: [
          { customLabel: { not: null } },
          { customDescription: { not: null } },
          { businessRule: { not: null } },
        ],
      },
    });
    await prisma.interfacePageSnapshot.update({
      where: { id: existing.snapshot.id },
      data: { annotatedCount },
    });

    res.json({ element });
  } catch (err) {
    console.error('[interface-map/elements/:id] error:', err);
    res.status(500).json({ error: 'Failed to update element' });
  }
});

// ─── DELETE /api/v1/interface-map/snapshots/:id ───────────────────────────────
router.delete('/snapshots/:id', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  try {
    const existing = await prisma.interfacePageSnapshot.findFirst({
      where: { id: req.params.id, organizationId: orgId },
    });
    if (!existing) { res.status(404).json({ error: 'Snapshot not found' }); return; }

    await prisma.interfacePageSnapshot.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ archived: true });
  } catch (err) {
    console.error('[interface-map/snapshots/:id DELETE] error:', err);
    res.status(500).json({ error: 'Failed to archive snapshot' });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function inferElementType(tag: string, inputType?: string): string {
  if (tag === 'button' || tag === 'a')   return tag === 'button' ? 'button' : 'link';
  if (tag === 'select')                  return 'select';
  if (tag === 'textarea')                return 'textarea';
  if (tag === 'input') {
    const t = inputType?.toLowerCase();
    if (t === 'submit' || t === 'button') return 'button';
    if (t === 'checkbox')                 return 'checkbox';
    if (t === 'radio')                    return 'radio';
    return 'input';
  }
  return 'unknown';
}

export default router;
