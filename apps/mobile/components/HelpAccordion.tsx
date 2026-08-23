import { useState, type JSX } from 'react'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { Card, IconButton } from './ui'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

/**
 * A bottom-sheet "?" help panel: one collapsible accordion item per topic, all behind a single
 * trigger, so a screen with several things worth explaining (a template editor's tabs, an Audio
 * Settings screen's four engines) doesn't scatter small gray hint paragraphs across its layout.
 * First built for apps/settings/templates.tsx's editor help, then generalized here so
 * apps/settings/tts.tsx could reuse the exact same mechanism rather than re-implementing it —
 * pull this file (plus `useHelpAccordion`) into another app with minimal changes:
 *   1. Copy this file and adjust the three imports at the top (`Card`/`IconButton` from this
 *      app's own UI kit, `useColors`/`useThemedStyles` from this app's own theme hook — or drop
 *      theming and hardcode colors if the target app has no theme system yet).
 *   2. `spacing`/`radius`/`type` come from lib/theme.ts's design-token scales — swap for
 *      whatever the target app uses, or inline literal numbers.
 * Everything else — the accordion state, the section data shape, the rendering — needs no changes.
 */

export interface HelpParagraph {
  text: string
  /** Renders in a monospace/code style instead of body text — for a literal snippet inside an
   * explanation (e.g. a CSS custom property, a config key). */
  code?: boolean
  /** Renders the whole paragraph bold — for a short lead-in sentence worth calling out before the
   * plain-text detail that follows it. Whole-paragraph only, not an inline/partial bold. */
  bold?: boolean
}

export interface HelpSection {
  id: string
  title: string
  icon: IconName
  /** Plain strings render as regular paragraphs — use `HelpParagraph` only where a paragraph
   * needs the code style. */
  paragraphs: (string | HelpParagraph)[]
}

/** Tracks which section (if any) is open and whether the sheet itself is visible. Call
 * `openSection(id)` from any "?" button — the sheet opens pre-expanded to that section, matching
 * "explain what I'm looking at right now" rather than always landing on the same top section. */
export function useHelpAccordion(initialSectionId: string | null = null): {
  visible: boolean
  sectionId: string | null
  openSection: (id: string) => void
  setSectionId: (id: string | null) => void
  close: () => void
} {
  const [visible, setVisible] = useState(false)
  const [sectionId, setSectionId] = useState<string | null>(initialSectionId)

  const openSection = (id: string): void => {
    setSectionId(id)
    setVisible(true)
  }
  const close = (): void => setVisible(false)

  return { visible, sectionId, openSection, setSectionId, close }
}

export function HelpAccordionSheet(props: {
  visible: boolean
  onClose: () => void
  title: string
  sections: HelpSection[]
  activeSectionId: string | null
  onSectionPress: (id: string) => void
  /** Each paragraph string goes through this before rendering — pass your screen's `t` from
   * `useTranslation()` for translated help text, or omit to render the strings as-is. */
  translate?: (text: string) => string
}): JSX.Element {
  const styles = useThemedStyles(createStyles)
  const colors = useColors()
  const t = props.translate ?? ((text: string) => text)

  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(props.title)}</Text>
            <IconButton icon="X" onPress={props.onClose} />
          </View>
          <ScrollView>
            {props.sections.map((section) => {
              const isOpen = props.activeSectionId === section.id
              return (
                <View key={section.id} style={styles.accordionItem}>
                  <Card onPress={() => props.onSectionPress(section.id)} style={styles.accordionHeader}>
                    <View style={styles.accordionHeaderRow}>
                      <Icon name={section.icon} size={18} color={colors.primary} />
                      <Text style={styles.sectionTitle}>{t(section.title)}</Text>
                      <View style={styles.accordionSpacer} />
                      <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} color={colors.textMuted} />
                    </View>
                  </Card>
                  {isOpen ? (
                    <View style={styles.accordionBody}>
                      {section.paragraphs.map((paragraph, index) => {
                        const p = typeof paragraph === 'string' ? { text: paragraph } : paragraph
                        return (
                          <Text key={index} style={[p.code ? styles.code : styles.body, p.bold && styles.bold]}>
                            {t(p.text)}
                          </Text>
                        )
                      })}
                    </View>
                  ) : null}
                </View>
              )
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: '80%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    title: { fontSize: type.subheading, fontWeight: '800', color: colors.text, flex: 1 },
    accordionItem: { marginBottom: spacing.sm },
    accordionHeader: { paddingVertical: spacing.sm },
    accordionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    accordionSpacer: { flex: 1 },
    accordionBody: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm },
    sectionTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
    body: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
    bold: { fontWeight: '700', color: colors.text },
    code: {
      fontFamily: 'monospace',
      fontSize: type.micro,
      color: colors.primary,
      lineHeight: 18,
      marginTop: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
  })
