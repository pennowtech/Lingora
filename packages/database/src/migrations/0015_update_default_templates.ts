import type { Migration } from './types'

const DEFAULT_FRONT = `<div class="dc-front">
  <div class="dc-word">{{ word }}</div>
  {% if gender %}<div class="dc-tag">{{ gender }}</div>{% endif %}
</div>`

const DEFAULT_BACK = `<div class="dc-back">
  <div class="dc-meaning">{{ meaning }}</div>
  {% if example %}
  <div class="dc-example">
    <div class="dc-example-de">{{ example_highlighted }}</div>
    {% if translation %}<div class="dc-example-en">{{ translation }}</div>{% endif %}
  </div>
  {% endif %}
  {% if synonyms.size > 0 %}
  <div class="dc-synonyms">
    <div class="dc-syn-list">
      {% for s in synonyms %}<span class="dc-syn-pill">{{ s.word }}</span>{% endfor %}
    </div>
  </div>
  {% endif %}
</div>`

const DEFAULT_STYLES = `.dc-front { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; min-height: 160px; }
.dc-word { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; font-size: 3.2rem; font-weight: 700; color: var(--theme-primary, #6C63FF); letter-spacing: -0.02em; line-height: 1.1; }
.dc-tag { display: inline-flex; align-items: center; font-size: 0.8rem; font-weight: 700; color: var(--theme-primary, #6C63FF); background: var(--theme-primary-soft, #F1F0FE); padding: 5px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid var(--theme-border, #E2E4F6); }

.dc-back { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; }
.dc-meaning { font-size: 2.1rem; font-weight: 800; color: var(--theme-text, #1C1B22); text-align: center; letter-spacing: -0.01em; line-height: 1.25; }
.dc-example { position: relative; background: var(--theme-surface-muted, #F8F9FE); border: 1px solid var(--theme-border, #E2E4F6); border-left: 5px solid var(--theme-primary, #6C63FF); border-radius: 16px; padding: 18px 20px; width: 100%; max-width: 440px; box-sizing: border-box; text-align: left; }
.dc-example-de { font-size: 1.1rem; font-weight: 500; color: var(--theme-text, #1C1B22); line-height: 1.55; }
.dc-example-en { font-size: 0.92rem; color: var(--theme-text-sec, #6B7280); margin-top: 8px; line-height: 1.45; font-weight: 400; }
.dc-example-de mark.dc-hl { background: var(--theme-primary-soft, #F1F0FE); color: var(--theme-primary, #6C63FF); font-weight: 800; padding: 1px 5px; border-radius: 4px; font-style: normal; }

.dc-synonyms { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
.dc-syn-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.dc-syn-pill { font-size: 0.82rem; font-weight: 600; color: var(--theme-text, #1C1B22); background: var(--theme-surface-muted, #F8F9FE); border: 1px solid var(--theme-border, #E2E4F6); padding: 4px 12px; border-radius: 999px; }`

/**
 * Migration 0015 — update default template definitions.
 * Updates default template row in SQLite for existing installations.
 */
export const updateDefaultTemplates: Migration = {
  version: 15,
  name: 'update_default_templates',
  up: async (db) => {
    await db.execute(
      `UPDATE templates SET front_template = ?, back_template = ?, styles = ? WHERE is_default = 1 AND type = 'vocab'`,
      [DEFAULT_FRONT, DEFAULT_BACK, DEFAULT_STYLES],
    )
  },
  down: async () => {},
}
