import type { CefrLevel, LanguageCode } from '@lingora/types'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect, useState, type JSX } from 'react'

const videoSource = require('../assets/startup-intro.mp4')
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Icon, type IconName } from './Icon'
import { Button } from './ui'
import { saveOnboardingPreferences } from '../lib/onboarding'
import { useServices } from '../lib/services'
import { radius, spacing, type } from '../lib/theme'
import { useColors, useThemedStyles } from '../lib/ThemeContext'
import type { ThemeColors } from '../lib/themes'

interface StartupScreenProps {
  visible: boolean
  onComplete: () => void
}

const CEFR_LEVELS: { level: CefrLevel; titleKey: string; descKey: string }[] = [
  { level: 'A1', titleKey: 'A1 - Beginner', descKey: 'Basic phrases and everyday expressions.' },
  { level: 'A2', titleKey: 'A2 - Elementary', descKey: 'Simple routine tasks and familiar topics.' },
  { level: 'B1', titleKey: 'B1 - Intermediate', descKey: 'Main points of clear speech and travel situations.' },
  { level: 'B2', titleKey: 'B2 - Upper Intermediate', descKey: 'Complex texts, technical discussions, and fluent conversation.' },
  { level: 'C1', titleKey: 'C1 - Advanced', descKey: 'Wide range of demanding texts and flexible language use.' },
  { level: 'C2', titleKey: 'C2 - Mastery', descKey: 'Effortless understanding, precise expression in complex situations.' },
]

const LANG_OPTIONS: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
]

const LANG_EMOJIS: Record<LanguageCode, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  hi: '🇮🇳',
  ja: '🇯🇵',
  vi: '🇻🇳',
}

const LANG_LABELS: Record<LanguageCode, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  ja: 'Japanese',
  vi: 'Vietnamese',
}

function FullVideoSplash(props: { onEnded: () => void }): JSX.Element {
  const colors = useColors()
  const { onEnded } = props

  try {
    const player = useVideoPlayer(videoSource, (player) => {
      player.loop = false
      player.muted = true
      player.play()
    })

    useEffect(() => {
      if (!player) return
      const interval = setInterval(() => {
        if (player.currentTime >= 5 || player.duration - player.currentTime <= 0.1) {
          clearInterval(interval)
          onEnded()
        }
      }, 200)
      return () => clearInterval(interval)
    }, [player, onEnded])

    return (
      <View style={StyleSheet.absoluteFill}>
        <VideoView style={StyleSheet.absoluteFill} player={player} nativeControls={false} contentFit="cover" />
      </View>
    )
  } catch {
    useEffect(() => {
      const timer = setTimeout(() => {
        onEnded()
      }, 2500)
      return () => clearTimeout(timer)
    }, [onEnded])

    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name="Languages" size={80} color={colors.primary} />
      </View>
    )
  }
}

interface FeatureSlide {
  id: string
  icon: IconName
  accentColor: string
  titleKey: string
  descKey: string
  badgeKey: string
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: 'ai_generation',
    icon: 'Sparkles',
    accentColor: '#6C63FF',
    titleKey: 'AI-Powered Vocabulary',
    descKey: 'Generate complete, accurate word packages with meanings, authentic example sentences, CEFR levels, and grammar notes in seconds.',
    badgeKey: 'SMART LOOKUP',
  },
  {
    id: 'fsrs_spaced_repetition',
    icon: 'Cpu',
    accentColor: '#2E9E5B',
    titleKey: 'FSRS Spaced Repetition',
    descKey: 'Scientifically proven memory scheduling algorithms ensure you review cards right before you forget them for maximum retention.',
    badgeKey: 'SMART REVIEWS',
  },
  {
    id: 'cloze_mining',
    icon: 'SquarePen',
    accentColor: '#D97706',
    titleKey: 'Sentence Mining & Cloze',
    descKey: 'Capture sentences from any app or website, turn them into cloze fill-in-the-blank cards, and master words in real context.',
    badgeKey: 'REAL CONTEXT',
  },
  {
    id: 'offline_privacy',
    icon: 'ShieldCheck',
    accentColor: '#2D7FF9',
    titleKey: 'Offline-First & Private',
    descKey: 'Your vocabulary database stays 100% on your device. Bring your own AI keys or use built-in offline dictionaries anytime.',
    badgeKey: 'YOUR DATA',
  },
]

function FeatureSlideshow(props: { onComplete: () => void; onSkip: () => void }): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const [currentIndex, setCurrentIndex] = useState(0)

  const slide = FEATURE_SLIDES[currentIndex]!

  const handleNext = () => {
    if (currentIndex < FEATURE_SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      props.onComplete()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.slideshowHeader}>
        <Text style={styles.slideshowStepCount}>
          {currentIndex + 1} / {FEATURE_SLIDES.length}
        </Text>
        <Pressable onPress={props.onSkip} hitSlop={12}>
          <Text style={styles.slideshowSkipText}>{t('Skip')}</Text>
        </Pressable>
      </View>

      <View style={styles.slideContainer}>
        {/* Animated Feature Visual Badge */}
        <View style={[styles.featureCardVisual, { borderColor: slide.accentColor + '40', backgroundColor: colors.surface }]}>
          <View style={[styles.featureBadgeTag, { backgroundColor: slide.accentColor + '20' }]}>
            <Text style={[styles.featureBadgeTagText, { color: slide.accentColor }]}>{t(slide.badgeKey)}</Text>
          </View>
          <View style={[styles.featureIconContainer, { backgroundColor: slide.accentColor + '15' }]}>
            <Icon name={slide.icon} size={54} color={slide.accentColor} />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.slideTitle}>{t(slide.titleKey)}</Text>
        <Text style={styles.slideDesc}>{t(slide.descKey)}</Text>
      </View>

      {/* Slide Indicator Dots & Navigation Button */}
      <View style={styles.slideshowFooter}>
        <View style={styles.dotsRow}>
          {FEATURE_SLIDES.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                idx === currentIndex && { backgroundColor: slide.accentColor, width: 22 },
              ]}
            />
          ))}
        </View>

        <Button
          label={currentIndex === FEATURE_SLIDES.length - 1 ? t('Get Started') : t('Next')}
          icon="ArrowRight"
          onPress={handleNext}
          style={{ width: '100%', backgroundColor: slide.accentColor }}
        />
      </View>
    </SafeAreaView>
  )
}

export function StartupScreen(props: StartupScreenProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useThemedStyles(createStyles)
  const services = useServices()

  const [step, setStep] = useState<'video' | 'slideshow' | 'setup'>('video')
  const [nativeLang, setNativeLang] = useState<LanguageCode>('en')
  const [targetLang, setTargetLang] = useState<LanguageCode>('de')
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1')
  const [saving, setSaving] = useState(false)

  const [showTargetModal, setShowTargetModal] = useState(false)
  const [showNativeModal, setShowNativeModal] = useState(false)

  const handleVideoEnd = () => {
    setStep('slideshow')
  }

  const handleSlideshowComplete = () => {
    setStep('setup')
  }

  const activeLevelConfig = CEFR_LEVELS.find((item) => item.level === selectedLevel) || CEFR_LEVELS[2]!

  const handleContinue = async () => {
    setSaving(true)
    await saveOnboardingPreferences({
      nativeLanguage: nativeLang,
      targetLanguage: targetLang,
      level: selectedLevel,
    })
    await services.reloadServices()
    setSaving(false)
    props.onComplete()
  }

  const handleSkip = async () => {
    setSaving(true)
    await saveOnboardingPreferences({
      nativeLanguage: nativeLang,
      targetLanguage: targetLang,
      level: selectedLevel,
    })
    await services.reloadServices()
    setSaving(false)
    props.onComplete()
  }

  return (
    <Modal visible={props.visible} animationType="fade" transparent={false} statusBarTranslucent>
      {step === 'video' ? (
        <FullVideoSplash onEnded={handleVideoEnd} />
      ) : step === 'slideshow' ? (
        <FeatureSlideshow onComplete={handleSlideshowComplete} onSkip={handleSlideshowComplete} />
      ) : (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Icon */}
            <View style={styles.iconContainer}>
              <Icon name="Languages" size={32} color={colors.primaryDark} />
            </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{t('Welcome to Lemmory')}</Text>
          <Text style={styles.subtitle}>
            {t('Learn German the way it actually works - in context, at your level, with real examples.')}
          </Text>

          {/* Language Pair Selector (Native Left -> Target Right) */}
          <Text style={styles.sectionHeader}>{t('CHOOSE YOUR LANGUAGE PAIR')}</Text>
          <View style={styles.languagePairRow}>
            {/* Native Language (Left) */}
            <Pressable
              onPress={() => setShowNativeModal(true)}
              style={[styles.flagCircle, styles.flagCircleActive]}
            >
              <Text style={styles.flagEmoji}>{LANG_EMOJIS[nativeLang] ?? '🌐'}</Text>
            </Pressable>
            <Icon name="ArrowRight" size={18} color={colors.textSecondary} style={styles.arrowIcon} />
            {/* Target Language (Right) */}
            <Pressable
              onPress={() => setShowTargetModal(true)}
              style={[styles.flagCircle, styles.flagCircleActive]}
            >
              <Text style={styles.flagEmoji}>{LANG_EMOJIS[targetLang] ?? '🌐'}</Text>
            </Pressable>
          </View>
          <Text style={styles.comingSoonText}>
            {LANG_LABELS[nativeLang]} ({t('Native')})
            {' > '}
            {LANG_LABELS[targetLang]} ({t('Learning')})
          </Text>

          {/* CEFR Level Selector */}
          <Text style={styles.sectionHeader}>{t('YOUR CURRENT GERMAN LEVEL')}</Text>
          <View style={styles.levelPillsRow}>
            {CEFR_LEVELS.map((item) => {
              const isSelected = item.level === selectedLevel
              return (
                <Pressable
                  key={item.level}
                  onPress={() => setSelectedLevel(item.level)}
                  style={[styles.levelPill, isSelected && styles.levelPillSelected]}
                >
                  <Text style={[styles.levelPillText, isSelected && styles.levelPillTextSelected]}>
                    {item.level}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* Active Level Description Card */}
          <View style={styles.levelDescCard}>
            <Text style={styles.levelDescText}>
              <Text style={styles.levelDescTitle}>{t(activeLevelConfig.titleKey)}. </Text>
              {t(activeLevelConfig.descKey)}
            </Text>
          </View>

          {/* CTA Buttons */}
          <Button
            label={saving ? t('Saving...') : t('Continue')}
            icon="ArrowRight"
            onPress={handleContinue}
            disabled={saving}
            style={styles.continueButton}
          />

          <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={12}>
            <Text style={styles.skipText}>{t("I'll set this up later")}</Text>
          </Pressable>

          {/* Target Language Modal */}
          <Modal visible={showTargetModal} animationType="fade" transparent onRequestClose={() => setShowTargetModal(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowTargetModal(false)} />
            <View style={styles.pickerSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.pickerSheetTitle}>{t("Language you're learning")}</Text>
              <ScrollView style={styles.pickerList}>
                {LANG_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.code}
                    style={styles.pickerOption}
                    onPress={() => {
                      setTargetLang(opt.code)
                      setShowTargetModal(false)
                    }}
                  >
                    <Text style={styles.pickerOptionLabel}>{opt.flag}  {t(opt.label)}</Text>
                    {targetLang === opt.code ? <Icon name="Check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Modal>

          {/* Native Language Modal */}
          <Modal visible={showNativeModal} animationType="fade" transparent onRequestClose={() => setShowNativeModal(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowNativeModal(false)} />
            <View style={styles.pickerSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.pickerSheetTitle}>{t('Your native / UI language')}</Text>
              <ScrollView style={styles.pickerList}>
                {LANG_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.code}
                    style={styles.pickerOption}
                    onPress={() => {
                      setNativeLang(opt.code)
                      setShowNativeModal(false)
                    }}
                  >
                    <Text style={styles.pickerOptionLabel}>{opt.flag}  {t(opt.label)}</Text>
                    {nativeLang === opt.code ? <Icon name="Check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
      )}
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    slideshowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    slideshowStepCount: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textMuted,
    },
    slideshowSkipText: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.primary,
    },
    slideContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    featureCardVisual: {
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xxl,
      position: 'relative',
    },
    featureBadgeTag: {
      position: 'absolute',
      top: -12,
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
    },
    featureBadgeTagText: {
      fontSize: type.micro,
      fontWeight: '800',
      letterSpacing: 1,
    },
    featureIconContainer: {
      width: 100,
      height: 100,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slideTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    slideDesc: {
      fontSize: type.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.sm,
    },
    slideshowFooter: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
      gap: spacing.xl,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
    },
    iconContainer: {
      width: 68,
      height: 68,
      borderRadius: radius.xl,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    videoContainer: {
      width: '100%',
      height: 200,
      borderRadius: radius.xl,
      overflow: 'hidden',
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      backgroundColor: colors.surfaceMuted,
    },
    video: {
      width: '100%',
      height: '100%',
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: type.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xxl,
    },
    sectionHeader: {
      fontSize: type.micro,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    languagePairRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    arrowIcon: {
      marginHorizontal: 2,
    },
    flagCircle: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flagCircleActive: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primarySoft,
    },
    flagCircleMuted: {
      backgroundColor: colors.surfaceMuted,
      borderStyle: 'dashed',
    },
    flagEmoji: {
      fontSize: 22,
    },
    comingSoonText: {
      fontSize: type.micro,
      color: colors.textMuted,
      marginBottom: spacing.xxl,
    },
    levelPillsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
      marginBottom: spacing.lg,
    },
    levelPill: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md - 2,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minWidth: 44,
      alignItems: 'center',
    },
    levelPillSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    levelPillText: {
      fontSize: type.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    levelPillTextSelected: {
      color: colors.textOnPrimary,
    },
    levelDescCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      width: '100%',
      marginBottom: spacing.xl,
    },
    levelDescText: {
      fontSize: type.caption,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    levelDescTitle: {
      fontWeight: '700',
      color: colors.text,
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: spacing.xl,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 8,
      height: 8,
    },
    continueButton: {
      width: '100%',
      marginBottom: spacing.lg,
    },
    skipButton: {
      paddingVertical: spacing.sm,
    },
    skipText: {
      fontSize: type.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: '#00000066',
    },
    pickerSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: '60%',
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    pickerSheetTitle: {
      fontSize: type.subheading,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.md,
    },
    pickerList: {
      flexGrow: 0,
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerOptionLabel: {
      fontSize: type.body,
      color: colors.text,
      fontWeight: '600',
    },
  })
