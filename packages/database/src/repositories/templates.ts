import type { Template } from '@lingora/types'
import type { DatabaseAdapter } from '../adapter'

/**
 * LiquidJS card templates. Phase 5 renders them; the CRUD ships with the
 * rest of the data layer so the card model is complete.
 */

/** Raw template row as it comes back from SQLite (booleans are 0/1). */
interface TemplateRow extends Omit<Template, 'isDefault'> {
  isDefault: number
}

const TEMPLATE_COLUMNS = `id, name, front_template AS frontTemplate, back_template AS backTemplate, styles, is_default AS isDefault, created_at AS createdAt, updated_at AS updatedAt`

/** SQLite stores booleans as 0/1 — convert so callers get a real boolean. */
function toTemplate(row: TemplateRow): Template {
  return { ...row, isDefault: row.isDefault !== 0 }
}

/**
 * Get all templates, default first, then alphabetically.
 */
export async function getAllTemplates(db: DatabaseAdapter): Promise<Template[]> {
  const rows = await db.query<TemplateRow>(
    `SELECT ${TEMPLATE_COLUMNS} FROM templates ORDER BY is_default DESC, name ASC`,
  )
  return rows.map(toTemplate)
}

/**
 * Get a single template by its ID.
 */
export async function getTemplateById(
  db: DatabaseAdapter,
  templateId: string,
): Promise<Template | null> {
  const row = await db.querySingle<TemplateRow>(
    `SELECT ${TEMPLATE_COLUMNS} FROM templates WHERE id = ?`,
    [templateId],
  )
  return row ? toTemplate(row) : null
}

/**
 * Get the default template — used for every card without an explicit template.
 */
export async function getDefaultTemplate(db: DatabaseAdapter): Promise<Template | null> {
  const row = await db.querySingle<TemplateRow>(
    `SELECT ${TEMPLATE_COLUMNS} FROM templates WHERE is_default = 1 LIMIT 1`,
  )
  return row ? toTemplate(row) : null
}

/**
 * Create a template. If it is flagged as default, the previous default is
 * cleared in the same transaction so there is always exactly one default.
 */
export async function createTemplate(db: DatabaseAdapter, template: Template): Promise<void> {
  await db.transaction(async (tx) => {
    if (template.isDefault) {
      await tx.execute(`UPDATE templates SET is_default = 0 WHERE is_default = 1`)
    }
    await tx.execute(
      `INSERT INTO templates (id, name, front_template, back_template, styles, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.id,
        template.name,
        template.frontTemplate,
        template.backTemplate,
        template.styles ?? null,
        template.isDefault ? 1 : 0,
        template.createdAt,
        template.updatedAt,
      ],
    )
  })
}

/**
 * Update a template's content. The isDefault flag is handled the same way
 * as in createTemplate so the single-default invariant holds.
 */
export async function updateTemplate(db: DatabaseAdapter, template: Template): Promise<void> {
  await db.transaction(async (tx) => {
    if (template.isDefault) {
      await tx.execute(`UPDATE templates SET is_default = 0 WHERE is_default = 1 AND id != ?`, [
        template.id,
      ])
    }
    await tx.execute(
      `UPDATE templates SET name = ?, front_template = ?, back_template = ?, styles = ?, is_default = ?, updated_at = ?
       WHERE id = ?`,
      [
        template.name,
        template.frontTemplate,
        template.backTemplate,
        template.styles ?? null,
        template.isDefault ? 1 : 0,
        Date.now(),
        template.id,
      ],
    )
  })
}

/**
 * Delete a template.
 */
export async function deleteTemplate(db: DatabaseAdapter, templateId: string): Promise<void> {
  await db.execute(`DELETE FROM templates WHERE id = ?`, [templateId])
}
