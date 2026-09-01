export type FeedbackCategory = 'support' | 'bug' | 'feature' | 'general'

export interface FeedbackDiagnostics {
  appVersion: string
  buildNumber: string
  platform: string
  tier: string
}

export interface FeedbackPayload {
  category: FeedbackCategory
  title: string
  message: string
  contactEmail?: string | undefined
  diagnostics?: FeedbackDiagnostics | null | undefined
}

export interface FeedbackSubmissionResult {
  success: boolean
  issueNumber?: number
  issueUrl?: string
  directGitHubUrl?: string
  error?: string
}

export const GITHUB_REPO_OWNER = 'pennowtech'
export const GITHUB_REPO_NAME = 'Lingora'

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

export function formatIssueTitle(category: FeedbackCategory, title: string): string {
  const prefix = CATEGORY_TITLE_PREFIX[category] ?? '[Feedback]'
  const cleanTitle = title.trim()
  return cleanTitle.startsWith('[') ? cleanTitle : `${prefix} ${cleanTitle}`
}

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
  if (payload.diagnostics) {
    lines.push(`### ⚙️ Diagnostics`)
    lines.push(`| Property | Value |`)
    lines.push(`| :--- | :--- |`)
    lines.push(`| **App Version** | \`${payload.diagnostics.appVersion}\` |`)
    lines.push(`| **Build Number** | \`${payload.diagnostics.buildNumber}\` |`)
    lines.push(`| **Platform** | \`${payload.diagnostics.platform}\` |`)
    lines.push(`| **Feature Tier** | \`${payload.diagnostics.tier}\` |`)
    lines.push(`| **Submitted At** | \`${new Date().toISOString()}\` |`)
    lines.push('')
  }

  // Footer Disclaimer
  lines.push(`---`)
  lines.push(`*Submitted automatically via Lemmory App Feedback Form*`)

  return lines.join('\n')
}

export function buildGitHubIssueUrl(payload: FeedbackPayload): string {
  const title = formatIssueTitle(payload.category, payload.title)
  const body = formatIssueBody(payload)
  const labels = CATEGORY_LABELS[payload.category].join(',')

  const params = new URLSearchParams({
    title,
    body,
    labels,
  })

  return `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/new?${params.toString()}`
}

export async function submitFeedback(
  payload: FeedbackPayload,
  apiUrl?: string,
): Promise<FeedbackSubmissionResult> {
  const directGitHubUrl = buildGitHubIssueUrl(payload)
  const endpoint = apiUrl || process.env.EXPO_PUBLIC_FEEDBACK_API_URL

  if (!endpoint) {
    // When no backend URL is configured yet, return with direct GitHub prefilled link
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title.trim(),
        body: payload.message.trim(),
        email: payload.contactEmail?.trim() || undefined,
        targetOwner: GITHUB_REPO_OWNER,
        targetRepo: GITHUB_REPO_NAME,
        category: categoryCapitalized,
        platform: payload.diagnostics?.platform ? `React Native (${payload.diagnostics.platform})` : 'React Native',
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

    const data = await response.json()
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
