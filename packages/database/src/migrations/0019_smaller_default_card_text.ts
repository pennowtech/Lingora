import type { Migration } from './types'

const DEFAULT_STYLES = `.dc-front { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; min-height: 160px; box-sizing: border-box; }
.dc-word { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 700; color: var(--theme-primary, #6C63FF); letter-spacing: -0.02em; line-height: 1.15; word-break: break-word; overflow-wrap: break-word; max-width: 100%; text-align: center; }
.dc-tag { display: inline-flex; align-items: center; font-size: 0.72rem; font-weight: 700; color: var(--theme-primary, #6C63FF); background: var(--theme-primary-soft, #F1F0FE); padding: 5px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid var(--theme-border, #E2E4F6); max-width: 100%; box-sizing: border-box; word-break: break-word; }

.dc-back { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; box-sizing: border-box; }
.dc-meaning { font-size: clamp(1.1rem, 3.6vw, 1.5rem); font-weight: 800; color: var(--theme-text, #1C1B22); text-align: center; letter-spacing: -0.01em; line-height: 1.25; word-break: break-word; overflow-wrap: break-word; max-width: 100%; }
.dc-example { position: relative; background: var(--theme-surface-muted, #F8F9FE); border: 1px solid var(--theme-border, #E2E4F6); border-left: 5px solid var(--theme-primary, #6C63FF); border-radius: 16px; padding: 18px 20px; width: 100%; max-width: 440px; box-sizing: border-box; text-align: left; word-break: break-word; overflow-wrap: break-word; }
.dc-example-de { font-size: 0.92rem; font-weight: 500; color: var(--theme-text, #1C1B22); line-height: 1.5; word-break: break-word; overflow-wrap: break-word; }
.dc-example-en { font-size: 0.8rem; color: var(--theme-text-sec, #6B7280); margin-top: 8px; line-height: 1.4; font-weight: 400; word-break: break-word; overflow-wrap: break-word; }
.dc-example-de mark.dc-hl { background: var(--theme-primary-soft, #F1F0FE); color: var(--theme-primary, #6C63FF); font-weight: 800; padding: 1px 5px; border-radius: 4px; font-style: normal; }

.dc-synonyms { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; }
.dc-syn-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 100%; }
.dc-syn-pill { font-size: 0.82rem; font-weight: 600; color: var(--theme-text, #1C1B22); background: var(--theme-surface-muted, #F8F9FE); border: 1px solid var(--theme-border, #E2E4F6); padding: 4px 12px; border-radius: 999px; word-break: break-word; }`

/**
 * Migration 0019 — smaller default vocab card text.
 *
 * The shipped default template's word/POS-tag/meaning/example sizes were all oversized on-device
 * (the front word alone went up to 2.6rem) — this shrinks each roughly 20-25%, matching the JS
 * DEFAULT_STYLES constant in apps/mobile/lib/templates.ts (the "Reset to default" / "+ New"
 * starting point). Same reasoning as migration 0015: the templates table's `is_default` row is a
 * DB snapshot, not read live from that constant, so an existing install needs its row updated
 * directly or this only ever helps a fresh install.
 */
export const smallerDefaultCardText: Migration = {
  version: 19,
  name: 'smaller_default_card_text',
  up: async (db) => {
    await db.execute(`UPDATE templates SET styles = ? WHERE is_default = 1 AND type = 'vocab'`, [DEFAULT_STYLES])
  },
  down: async () => {},
}
