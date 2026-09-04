import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { MarkdownDocViewer } from '../../components/MarkdownDocViewer'
import { HelpVideoPlayerModal } from '../../components/HelpVideoPlayerModal'
import { DEFAULT_HELP_VIDEO_ID, extractYouTubeVideoId, getHelpDoc, sanitizeVideoTitle } from '@lingora/core'
import { useServices } from '../../lib/services'
import { spacing } from '../../lib/theme'
import { useThemedStyles } from '../../lib/ThemeContext'
import type { ThemeColors } from '../../lib/themes'

interface ActiveVideo {
  videoId: string
  title: string
}

export default function HelpChapterScreen(): JSX.Element {
  const { t } = useTranslation()
  const styles = useThemedStyles(createStyles)
  const { nativeLanguage } = useServices()
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()

  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null)

  const doc = useMemo(() => {
    return getHelpDoc(chapterId || '01-home-dashboard', nativeLanguage)
  }, [chapterId, nativeLanguage])

  // The markdown viewer hands back whatever the tapped link/section actually contained - a real
  // YouTube URL for an in-body link, or free text for a 'video' section (see MarkdownDocViewer's
  // handleLink and its 'video' case). Extract the real ID rather than assuming every chapter's
  // video is the same one - falls back to the one video that exists today only when nothing
  // extractable is found, instead of silently always playing that video regardless of what was
  // tapped.
  const handleVideoPress = (titleOrUrl: string): void => {
    setActiveVideo({
      videoId: extractYouTubeVideoId(titleOrUrl) ?? DEFAULT_HELP_VIDEO_ID,
      title: sanitizeVideoTitle(titleOrUrl),
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Stack.Screen
        options={{
          title: t('Guide'),
        }}
      />

      {/* Render Parsed Markdown Content */}
      <MarkdownDocViewer
        doc={doc}
        onVideoPress={handleVideoPress}
        onActionPress={(action) => {
          if (action.includes('search')) router.push('/(tabs)/search')
          else if (action.includes('decks')) router.push('/(tabs)/decks')
          else if (action.includes('mine')) router.push('/(tabs)/mine')
        }}
      />

      {/* Interactive Video Player Modal */}
      <HelpVideoPlayerModal
        visible={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoId={activeVideo?.videoId ?? DEFAULT_HELP_VIDEO_ID}
        title={activeVideo?.title ?? t('🎬 Video Walkthrough')}
      />
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  })
