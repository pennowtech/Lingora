export interface FeedbackRequestPayload {
  category: 'support' | 'bug' | 'feature' | 'general'
  title: string
  message: string
  contactEmail?: string
  diagnostics?: {
    appVersion?: string
    buildNumber?: string
    platform?: string
    tier?: string
  } | null
  formattedTitle?: string
  formattedBody?: string
  labels?: string[]
}

export interface FeedbackResponse {
  success: boolean
  issueNumber?: number
  issueUrl?: string
  error?: string
}

const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'pennowtech'
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'Lingora'

const CATEGORY_LABELS: Record<string, string[]> = {
  support: ['user-feedback', 'feedback:support', 'help wanted'],
  bug: ['user-feedback', 'feedback:bug', 'bug'],
  feature: ['user-feedback', 'feedback:feature', 'enhancement'],
  general: ['user-feedback', 'feedback:general'],
}

const CATEGORY_TITLE_PREFIX: Record<string, string> = {
  support: '[Support]',
  bug: '[Bug]',
  feature: '[Feature]',
  general: '[Feedback]',
}

export function formatGitHubIssue(payload: FeedbackRequestPayload): { title: string; body: string; labels: string[] } {
  const prefix = CATEGORY_TITLE_PREFIX[payload.category] ?? '[Feedback]'
  const cleanTitle = (payload.title || '').trim()
  const title = cleanTitle.startsWith('[') ? cleanTitle : `${prefix} ${cleanTitle}`

  const lines: string[] = []
  lines.push(`### 📋 Feedback Category`)
  lines.push(`**${(payload.category || 'general').toUpperCase()}**\n`)

  lines.push(`### 💬 User Message`)
  lines.push((payload.message || '').trim())
  lines.push('')

  if (payload.contactEmail && payload.contactEmail.trim() !== '') {
    lines.push(`### ✉️ Contact`)
    lines.push(`\`${payload.contactEmail.trim()}\``)
    lines.push('')
  }

  if (payload.diagnostics) {
    lines.push(`### ⚙️ Diagnostics`)
    lines.push(`| Property | Value |`)
    lines.push(`| :--- | :--- |`)
    if (payload.diagnostics.appVersion) lines.push(`| **App Version** | \`${payload.diagnostics.appVersion}\` |`)
    if (payload.diagnostics.buildNumber) lines.push(`| **Build Number** | \`${payload.diagnostics.buildNumber}\` |`)
    if (payload.diagnostics.platform) lines.push(`| **Platform** | \`${payload.diagnostics.platform}\` |`)
    if (payload.diagnostics.tier) lines.push(`| **Feature Tier** | \`${payload.diagnostics.tier}\` |`)
    lines.push(`| **Submitted At** | \`${new Date().toISOString()}\` |`)
    lines.push('')
  }

  lines.push(`---`)
  lines.push(`*Submitted automatically via Lemmory App Feedback Form*`)

  const labels = payload.labels && payload.labels.length > 0
    ? payload.labels
    : (CATEGORY_LABELS[payload.category] || ['user-feedback'])

  return {
    title: payload.formattedTitle || title,
    body: payload.formattedBody || lines.join('\n'),
    labels,
  }
}

export async function createGitHubFeedbackIssue(
  payload: FeedbackRequestPayload,
  githubToken = process.env.GITHUB_TOKEN,
): Promise<FeedbackResponse> {
  if (!githubToken) {
    return {
      success: false,
      error: 'GITHUB_TOKEN environment variable is not configured on the server.',
    }
  }

  if (!payload.title || !payload.message) {
    return {
      success: false,
      error: 'Missing required fields: title and message are required.',
    }
  }

  const { title, body, labels } = formatGitHubIssue(payload)

  const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Lingora-Feedback-Service',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return {
        success: false,
        error: `GitHub API error (${response.status}): ${errText}`,
      }
    }

    const data = (await response.json()) as { number: number; html_url: string }
    return {
      success: true,
      issueNumber: data.number,
      issueUrl: data.html_url,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown network error calling GitHub API',
    }
  }
}
