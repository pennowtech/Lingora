import { router } from 'expo-router'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Linking, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { InlineMarkdown } from './InlineMarkdown'
import { Card } from './ui'
import { isYouTubeUrl, type ParsedHelpDoc } from '@lingora/core'
import { resolveHelpScreenshot } from '../lib/helpScreenshots'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

interface MarkdownDocViewerProps {
  doc: ParsedHelpDoc
  onVideoPress?: (videoTitleOrUrl: string) => void
  onActionPress?: (action: string) => void
}

export function MarkdownDocViewer({
  doc,
  onVideoPress,
  onActionPress,
}: MarkdownDocViewerProps): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const colors = useColors()

  const handleLink = (url: string) => {
    // If YouTube video link, play inline in in-app modal
    if (isYouTubeUrl(url)) {
      if (onVideoPress) {
        onVideoPress(url)
        return
      }
    }

    // Internal in-app action link, e.g. [Look up a word](action:search) - routes through the
    // caller's own onActionPress instead of a fixed set of destinations hardcoded in here, so a
    // doc author can link straight to a specific in-app flow (see help-chapter.tsx's handler).
    if (url.startsWith('action:')) {
      onActionPress?.(url.slice('action:'.length))
      return
    }

    // Check if link points to an internal chapter file
    const chapterMatch = url.match(/(0\d-[a-z0-9-]+)(?:\.md)?/)
    if (chapterMatch?.[1]) {
      router.push({
        pathname: '/settings/help-chapter',
        params: { chapterId: chapterMatch[1] },
      })
      return
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      void Linking.openURL(url)
    }
  }

  return (
    <View style={styles.container}>
      {doc.sections.map((section, idx) => {
        switch (section.type) {
          case 'divider': {
            return <View key={idx} style={styles.divider} />
          }

          case 'heading': {
            if (section.level === 1) {
              const cleanH1 = section.content.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '').trim()
              return (
                <Text key={idx} style={styles.h1} selectable>
                  {cleanH1}
                </Text>
              )
            }
            if (section.level === 2) {
              return (
                <Text key={idx} style={styles.h2} selectable>
                  {section.content}
                </Text>
              )
            }
            if (section.level === 3) {
              return (
                <Text key={idx} style={styles.h3} selectable>
                  {section.content}
                </Text>
              )
            }
            // Level 4 (4 hashes ####) or higher
            return (
              <Text key={idx} style={styles.h4} selectable>
                {section.content}
              </Text>
            )
          }

          case 'paragraph': {
            return (
              <InlineMarkdown
                key={idx}
                text={section.content}
                style={styles.paragraph}
                boldStyle={styles.bold}
                italicStyle={styles.italic}
                codeStyle={styles.inlineCode}
                onLinkPress={handleLink}
                selectable
              />
            )
          }

          case 'bullet': {
            return (
              <View key={idx} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <InlineMarkdown
                  text={section.content}
                  style={styles.bulletText}
                  boldStyle={styles.bold}
                  italicStyle={styles.italic}
                  codeStyle={styles.inlineCode}
                  onLinkPress={handleLink}
                  selectable
                />
              </View>
            )
          }

          case 'callout': {
            const isTip = section.calloutType === 'tip'
            const isWarning = section.calloutType === 'warning'
            return (
              <View
                key={idx}
                style={[
                  styles.calloutBox,
                  isTip ? styles.tipCallout : isWarning ? styles.warningCallout : styles.noteCallout,
                ]}
              >
                <View style={styles.calloutHeader}>
                  <Icon
                    name={isTip ? 'Sparkles' : isWarning ? 'CircleAlert' : 'Info'}
                    size={16}
                    color={isTip ? colors.primary : isWarning ? colors.warning : colors.primary}
                  />
                  <Text style={[styles.calloutTitle, { color: isTip ? colors.primary : colors.text }]}>
                    {isTip ? 'Pro-Tip' : isWarning ? 'Caution' : 'Note'}
                  </Text>
                </View>
                <InlineMarkdown
                  text={section.content}
                  style={styles.calloutText}
                  boldStyle={styles.bold}
                  italicStyle={styles.italic}
                  codeStyle={styles.inlineCode}
                  onLinkPress={handleLink}
                  selectable
                />
              </View>
            )
          }

          case 'video': {
            return (
              <Card
                key={idx}
                style={styles.videoCard}
                onPress={() => onVideoPress && onVideoPress(section.content)}
              >
                <View style={styles.videoCardContent}>
                  <View style={styles.videoIconCircle}>
                    <Icon name="Play" size={18} color={colors.textOnPrimary} />
                  </View>
                  <View style={styles.videoTextContainer}>
                    <Text style={styles.videoTitle}>🎬 {t('Video Tutorial')}</Text>
                    <InlineMarkdown
                      text={section.content}
                      style={styles.videoSubtitle}
                      boldStyle={styles.bold}
                      selectable
                    />
                  </View>
                </View>
              </Card>
            )
          }

          case 'table': {
            const header = section.tableHeader ?? []
            const rows = section.tableRows ?? []
            // First column (usually a short label/link) gets less room than the rest (usually a
            // longer description) - every cell in a column shares the same flex weight, so columns
            // stay aligned between the header row and every body row regardless of that row's own
            // content length (the previous per-cell minWidth/maxWidth sized each row independently,
            // so header and body columns drifted out of alignment with each other).
            const cellFlex = (cellIdx: number): number => (cellIdx === 0 ? 1 : 2)
            return (
              <View key={idx} style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {header.map((cell, cellIdx) => (
                    <View
                      key={cellIdx}
                      style={[styles.tableHeaderCell, { flex: cellFlex(cellIdx) }, cellIdx > 0 && styles.tableCellDivider]}
                    >
                      <Text style={styles.tableHeaderText}>{cell}</Text>
                    </View>
                  ))}
                </View>
                {rows.map((row, rowIdx) => (
                  <View key={rowIdx} style={[styles.tableRow, styles.tableRowDivider, rowIdx % 2 === 1 && styles.tableRowAlt]}>
                    {row.map((cell, cellIdx) => (
                      <View
                        key={cellIdx}
                        style={[styles.tableCell, { flex: cellFlex(cellIdx) }, cellIdx > 0 && styles.tableCellDivider]}
                      >
                        <InlineMarkdown
                          text={cell}
                          style={styles.tableCellText}
                          boldStyle={styles.bold}
                          italicStyle={styles.italic}
                          codeStyle={styles.inlineCode}
                          onLinkPress={handleLink}
                          selectable
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )
          }

          case 'image': {
            // section.mediaUrl is a screenshot id (e.g. "home-daily-study-hub"), not a real URL -
            // Metro needs a require() with a literal string, so this looks it up in a static map
            // (helpScreenshots.ts) rather than loading an arbitrary path. Falls back to the old
            // placeholder box when the id isn't found (a translated doc referencing an id not yet
            // added to the map, or the id genuinely doesn't exist).
            const screenshot = resolveHelpScreenshot(section.mediaUrl)
            if (screenshot) {
              return (
                <View key={idx} style={styles.screenshotCard}>
                  <View style={styles.screenshotFrame}>
                    <Image source={screenshot} style={styles.screenshotImage} resizeMode="contain" />
                  </View>
                  <View style={styles.screenshotCaptionRow}>
                    <View style={styles.screenshotBadge}>
                      <Icon name="Smartphone" size={11} color={colors.textMuted} />
                      <Text style={styles.screenshotBadgeText}>{t('App screenshot')}</Text>
                    </View>
                    {section.mediaCaption ? (
                      <Text style={styles.screenshotCaption} selectable>
                        {section.mediaCaption}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )
            }
            return (
              <View key={idx} style={styles.imageBox}>
                <View style={styles.imagePlaceholder}>
                  <Icon name="Image" size={28} color={colors.textMuted} />
                  <Text style={styles.imageCaption} selectable>
                    {section.mediaCaption ?? t('Screenshot Reference')}
                  </Text>
                </View>
              </View>
            )
          }

          case 'code': {
            return (
              <View key={idx} style={styles.codeBlock}>
                <Text style={styles.codeBlockText} selectable>
                  {section.content}
                </Text>
              </View>
            )
          }

          default:
            return null
        }
      })}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingBottom: spacing.xxl,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    h1: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      lineHeight: 26,
    },
    h2: {
      fontSize: type.subheading,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      lineHeight: 26,
    },
    h3: {
      fontSize: type.body,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
      lineHeight: 24,
    },
    h4: {
      fontSize: type.caption,
      fontWeight: '600',
      color: colors.primary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    paragraph: {
      fontSize: type.body,
      color: colors.textSecondary,
      lineHeight: 26,
      marginBottom: spacing.md,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      paddingLeft: spacing.xs,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 11,
      marginRight: spacing.sm,
      opacity: 0.7,
    },
    bulletText: {
      fontSize: type.body,
      color: colors.textSecondary,
      lineHeight: 26,
      flex: 1,
    },
    bold: {
      fontWeight: '600',
      color: colors.text,
    },
    italic: {
      fontStyle: 'italic',
    },
    inlineCode: {
      fontFamily: 'monospace',
      backgroundColor: colors.primarySoft,
      color: colors.primary,
      paddingHorizontal: 4,
      borderRadius: 4,
      fontSize: type.caption,
    },
    calloutBox: {
      borderRadius: radius.lg,
      padding: spacing.md,
      marginVertical: spacing.md,
      borderWidth: 1,
    },
    tipCallout: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    warningCallout: {
      backgroundColor: colors.warningSoft,
      borderColor: colors.warning,
    },
    noteCallout: {
      backgroundColor: colors.surface,
      borderColor: colors.textMuted,
    },
    calloutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    calloutTitle: {
      fontSize: type.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    calloutText: {
      fontSize: type.caption,
      color: colors.text,
      lineHeight: 22,
    },
    videoCard: {
      marginVertical: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderColor: colors.primarySoft,
      borderWidth: 1,
    },
    videoCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    videoIconCircle: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoTextContainer: {
      flex: 1,
    },
    videoTitle: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    videoSubtitle: {
      fontSize: type.caption,
      color: colors.textSecondary,
    },
    imageBox: {
      marginVertical: spacing.md,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    imagePlaceholder: {
      height: 140,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    imageCaption: {
      fontSize: type.micro,
      color: colors.textMuted,
      fontWeight: '600',
    },
    // A real captured screenshot, framed like a reference figure rather than a live control - the
    // "App screenshot" badge exists specifically so it never reads as part of the interactive UI
    // (nothing here is tappable), and so a slightly stale screenshot doesn't look like the app is
    // broken if a later release shifts a pixel or two from what's pictured.
    screenshotCard: {
      marginVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    screenshotFrame: {
      backgroundColor: colors.surfaceMuted,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    screenshotImage: {
      width: '100%',
      height: 380,
      borderRadius: radius.md,
    },
    screenshotCaptionRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    screenshotBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    screenshotBadgeText: {
      fontSize: type.micro,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    screenshotCaption: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    codeBlock: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    codeBlockText: {
      fontFamily: 'monospace',
      fontSize: type.micro,
      color: colors.primary,
      lineHeight: 20,
    },
    table: {
      marginVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
    },
    tableRowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tableHeaderRow: {
      backgroundColor: colors.surfaceMuted,
    },
    tableRowAlt: {
      backgroundColor: colors.surfaceMuted,
    },
    tableCellDivider: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    tableHeaderCell: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    tableHeaderText: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.text,
    },
    tableCell: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: 'center',
    },
    tableCellText: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  })
