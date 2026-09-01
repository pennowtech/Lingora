/**
 * Feedback, Bug Reporting, and Issue Submission Client
 *
 * Provides a unified, platform-agnostic interface for mobile, desktop, and web clients
 * to submit feedback, bug reports, feature requests, and help inquiries directly to GitHub
 * repositories via a secure serverless backend (or fallback browser prefill).
 */

/**
 * Supported feedback categories for categorization, labeling, and routing.
 */
export type FeedbackCategory = 'support' | 'bug' | 'feature' | 'general'

/**
 * Known client application identifiers.
 * You can pass one of these or any custom string (e.g. 'desktop-lemmory', 'android-lemmory', 'ios-lemmory').
 */
export type ClientAppTarget = 'desktop-lemmory' | 'android-lemmory' | 'ios-lemmory' | 'web-lemmory' | (string & {})

/**
 * Diagnostic metadata attached to a feedback submission.
 */
export interface FeedbackDiagnostics {
  /** Application version (e.g. "0.2.0") */
  appVersion: string
  /** Build or revision number (e.g. "15" or git commit hash) */
  buildNumber: string
  /** Client operating system / runtime platform (e.g. "iOS", "Android", "macOS", "Windows", "Linux", "Web") */
  platform: string
  /** Feature tier or license state (e.g. "free", "full", "pro") */
  tier: string
}

/**
 * Complete feedback submission payload.
 *
 * @example
 * ```typescript
 * const payload: FeedbackPayload = {
 *   category: 'bug',
 *   title: 'Audio playback fails on macOS',
 *   message: 'When tapping the speaker icon, no sound is heard.',
 *   app: 'desktop-lemmory',
 *   targetOwner: 'pennowtech',
 *   targetRepo: 'Lingora',
 *   contactEmail: 'user@example.com',
 *   diagnostics: {
 *     appVersion: '0.2.0',
 *     buildNumber: '12',
 *     platform: 'macOS 15.1',
 *     tier: 'full',
 *   },
 * }
 * ```
 */
export interface FeedbackPayload {
  /** Feedback category (support, bug, feature, general) */
  category: FeedbackCategory

  /** Brief issue summary or title */
  title: string

  /** Detailed message, reproduction steps, or feature description */
  message: string

  /**
   * The GitHub organization or username owning the target repository.
   * Defaults to 'pennowtech' if omitted.
   */
  targetOwner?: string | undefined

  /**
   * The GitHub repository name where the issue will be created.
   * Defaults to 'Lingora' if omitted.
   */
  targetRepo?: string | undefined

  /**
   * The specific client application submitting the feedback (e.g. 'desktop-lemmory', 'android-lemmory', 'ios-lemmory').
   * When provided, it attaches an `app:<name>` label to the GitHub issue and appears in diagnostics.
   * Defaults to undefined (no app label attached).
   */
  app?: ClientAppTarget | undefined

  /** Optional user email address for follow-ups */
  contactEmail?: string | undefined

  /** Optional runtime and environment diagnostics */
  diagnostics?: FeedbackDiagnostics | null | undefined
}

/**
 * Response structure returned after submitting feedback.
 */
export interface FeedbackSubmissionResult {
  /** True if the issue was successfully created or opened */
  success: boolean
  /** The created GitHub issue number (if submitted via backend) */
  issueNumber?: number | undefined
  /** The direct URL to the created or prefilled GitHub issue */
  issueUrl?: string | undefined
  /** Prefilled GitHub web URL fallback */
  directGitHubUrl?: string | undefined
  /** Error message if submission failed */
  error?: string | undefined
}

export const DEFAULT_GITHUB_REPO_OWNER = 'pennowtech'
export const DEFAULT_GITHUB_REPO_NAME = 'Lingora'
export const DEFAULT_FEEDBACK_API_URL = 'https://singhbuildstech.com/api/submit-issue'

export const CATEGORY_LABELS: Record<FeedbackCategory, string[]> = {
  support: ['user-feedback', 'feedback:support', 'help wanted'],
  bug: ['user-feedback', 'feedback:bug', 'bug'],
  feature: ['user-feedback', 'feedback:feature', 'enhancement'],
  general: ['user-feedback', 'feedback:general'],
}

export const CATEGORY_TITLE_PREFIX: Record<FeedbackCategory, string> = {
  support: '[Support]',
  bug: '[Bug]',
  feature: '[Feature]',
  general: '[Feedback]',
}

/**
 * Formats a clean issue title with a standardized category prefix.
 */
export function formatIssueTitle(category: FeedbackCategory, title: string): string {
  const prefix = CATEGORY_TITLE_PREFIX[category] ?? '[Feedback]'
  const cleanTitle = title.trim()
  return cleanTitle.startsWith('[') ? cleanTitle : `${prefix} ${cleanTitle}`
}

/**
 * Formats the markdown issue body with user description, optional contact, and structured diagnostic table.
 */
export function formatIssueBody(payload: FeedbackPayload): string {
  const lines: string[] = []

  // Category Header
  lines.push(`### 📋 Feedback Category`)
  lines.push(`**${payload.category.toUpperCase()}**\n`)

  // User Message
  lines.push(`### 💬 User Message`)
  lines.push(payload.message.trim())
  lines.push('')

  // Contact Info (if provided)
  if (payload.contactEmail && payload.contactEmail.trim() !== '') {
    lines.push(`### ✉️ Contact`)
    lines.push(`\`${payload.contactEmail.trim()}\``)
    lines.push('')
  }

  // Diagnostics Table (if included)
  if (payload.diagnostics || payload.app) {
    lines.push(`### ⚙️ Diagnostics`)
    lines.push(`| Property | Value |`)
    lines.push(`| :--- | :--- |`)
    if (payload.app) {
      lines.push(`| **Client App** | \`${payload.app}\` |`)
    }
    if (payload.diagnostics) {
      lines.push(`| **App Version** | \`${payload.diagnostics.appVersion}\` |`)
      lines.push(`| **Build Number** | \`${payload.diagnostics.buildNumber}\` |`)
      lines.push(`| **Platform** | \`${payload.diagnostics.platform}\` |`)
      lines.push(`| **Feature Tier** | \`${payload.diagnostics.tier}\` |`)
    }
    lines.push(`| **Submitted At** | \`${new Date().toISOString()}\` |`)
    lines.push('')
  }

  // Footer Disclaimer
  lines.push(`---`)
  lines.push(`*Submitted automatically via Lemmory App Feedback Form*`)

  return lines.join('\n')
}

/**
 * Generates a prefilled `https://github.com/{owner}/{repo}/issues/new?...` URL.
 */
export function buildGitHubIssueUrl(payload: FeedbackPayload): string {
  const owner = payload.targetOwner || DEFAULT_GITHUB_REPO_OWNER
  const repo = payload.targetRepo || DEFAULT_GITHUB_REPO_NAME
  const title = formatIssueTitle(payload.category, payload.title)
  const body = formatIssueBody(payload)

  const labels = [...CATEGORY_LABELS[payload.category]]
  if (payload.app && payload.app.trim() !== '') {
    labels.push(`app:${payload.app.trim().toLowerCase()}`)
  }

  const params = new URLSearchParams({
    title,
    body,
    labels: labels.join(','),
  })

  return `https://github.com/${owner}/${repo}/issues/new?${params.toString()}`
}

/**
 * Submits feedback directly to the backend proxy endpoint (`/api/submit-issue`).
 * If no backend is configured or network is unreachable, provides a prefilled GitHub URL.
 *
 * @param payload The structured feedback payload.
 * @param apiUrl Optional override URL for the feedback API endpoint (defaults to production backend).
 */
export async function submitFeedback(
  payload: FeedbackPayload,
  apiUrl?: string,
): Promise<FeedbackSubmissionResult> {
  const directGitHubUrl = buildGitHubIssueUrl(payload)
  const endpoint = apiUrl || DEFAULT_FEEDBACK_API_URL

  if (!endpoint) {
    return {
      success: true,
      directGitHubUrl,
      issueUrl: directGitHubUrl,
    }
  }

  try {
    const categoryCapitalized =
      payload.category.charAt(0).toUpperCase() + payload.category.slice(1)

    const deviceMetaStr = payload.diagnostics
      ? `App v${payload.diagnostics.appVersion} (Build ${payload.diagnostics.buildNumber}) · ${payload.diagnostics.platform} · Tier: ${payload.diagnostics.tier}`
      : ''

    const targetOwner = payload.targetOwner || DEFAULT_GITHUB_REPO_OWNER
    const targetRepo = payload.targetRepo || DEFAULT_GITHUB_REPO_NAME

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title.trim(),
        body: payload.message.trim(),
        email: payload.contactEmail?.trim() || undefined,
        targetOwner,
        targetRepo,
        category: categoryCapitalized,
        app: payload.app || undefined,
        platform: payload.diagnostics?.platform
          ? payload.diagnostics.platform
          : payload.app
            ? payload.app
            : 'App Client',
        deviceMeta: deviceMetaStr,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Network error')
      return {
        success: false,
        error: `Server responded with ${response.status}: ${errText}`,
        directGitHubUrl,
      }
    }

    const data = (await response.json()) as { issueNumber?: number; issueUrl?: string }
    return {
      success: true,
      issueNumber: data.issueNumber,
      issueUrl: data.issueUrl ?? directGitHubUrl,
      directGitHubUrl,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to reach feedback server'
    return {
      success: false,
      error: errorMsg,
      directGitHubUrl,
    }
  }
}
