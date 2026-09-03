import type { ImageSourcePropType } from 'react-native'
import homeDailyStudyHub from '../assets/help/Home_and_Daily_Study_Hub.png'
import wordOfTheDayPopup from '../assets/help/word_of_the_day.png'
import searchDictionary from '../assets/help/Instant_Search_and_Multi_Engine_Dictionary.png'
import wordDetailCardCreator from '../assets/help/Word_Detail_and_Card_Creator.png'
import decksStudyProgress from '../assets/help/Study_Progress_and_Decks.png'
import srsReviewWordMeaning from '../assets/help/Spaced_Repetition_Review_Engine_Word_Meaning.png'
import srsReviewMcq from '../assets/help/Spaced_Repetition_Review_Engine_MCQ.png'
import srsReviewMcq2 from '../assets/help/Spaced_Repetition_Review_Engine_MCQ2.png'
import learningStatistics from '../assets/help/Learning_Statistics_Analytics.png'
import miningStudioPassageLibrary from '../assets/help/Mining_Studio_and_Passage_Library.png'
import miningStudioStudyAndMine1 from '../assets/help/Mining_Studio_Study_and_Mine_Analysis_1.png'
import miningStudioStudyAndMine2 from '../assets/help/Mining_Studio_Study_and_Mine_Analysis_2.png'
import settingsAiEngines from '../assets/help/Settings_and_AI_Engines.png'
import aiProvidersSettings from '../assets/help/AI_Providers_Settings.png'
import sendFeedback from '../assets/help/Send_Feedback.png'

/**
 * Real in-app screenshots used to illustrate the Help docs - Metro needs a `require()`/`import`
 * with a literal string, so a dynamic load of an arbitrary markdown-provided path (the naive way
 * to support `![caption](path)` image references) isn't possible. This is the static lookup
 * instead: doc authors reference a screenshot by its id (e.g. `![Home screen](home-daily-study-hub)`),
 * and `MarkdownDocViewer`'s 'image' case resolves that id here. The same screenshots are reused
 * across every locale's docs (en/de/hi) - only the caption text differs per language, not the image.
 */
export const HELP_SCREENSHOTS: Record<string, ImageSourcePropType> = {
  'home-daily-study-hub': homeDailyStudyHub,
  'word-of-the-day-popup': wordOfTheDayPopup,
  'search-dictionary': searchDictionary,
  'word-detail-card-creator': wordDetailCardCreator,
  'decks-study-progress': decksStudyProgress,
  'srs-review-word-meaning': srsReviewWordMeaning,
  'srs-review-mcq': srsReviewMcq,
  'srs-review-mcq-2': srsReviewMcq2,
  'learning-statistics': learningStatistics,
  'mining-studio-passage-library': miningStudioPassageLibrary,
  'mining-studio-study-and-mine-1': miningStudioStudyAndMine1,
  'mining-studio-study-and-mine-2': miningStudioStudyAndMine2,
  'settings-ai-engines': settingsAiEngines,
  'ai-providers-settings': aiProvidersSettings,
  'send-feedback': sendFeedback,
}

export type HelpScreenshotId = keyof typeof HELP_SCREENSHOTS

export function resolveHelpScreenshot(id: string | undefined): ImageSourcePropType | undefined {
  if (!id) return undefined
  return HELP_SCREENSHOTS[id]
}
