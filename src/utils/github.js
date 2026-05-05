// ─── GitHub API Utility ───────────────────────────────────────────────────────
// Config priority: hardcoded (config.local.js) > localStorage (Settings UI)

import hardcodedConfig from '../config.local.js'

const BASE = 'https://api.github.com'

function getConfig() {
  let stored = {}
  try {
    stored = JSON.parse(localStorage.getItem('studyshelf_config') || '{}')
  } catch { /* ignore */ }

  // Hardcoded values win if non-empty
  return {
    owner:  (hardcodedConfig.owner  || stored.owner  || '').trim(),
    repo:   (hardcodedConfig.repo   || stored.repo   || '').trim(),
    branch: (hardcodedConfig.branch || stored.branch || 'main').trim(),
    token:  (hardcodedConfig.token  || stored.token  || '').trim(),
  }
}

function headers() {
  const { token } = getConfig()
  const h = { Accept: 'application/vnd.github.v3+json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// GET /repos/:owner/:repo/contents/:path
export async function getContents(path = '') {
  const { owner, repo, branch = 'main' } = getConfig()
  if (!owner || !repo) throw new Error('GitHub repo not configured. Open Settings first.')
  const url = `${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API error ${res.status}`)
  }
  return res.json()
}

// Returns raw text content of a file
export async function getFileText(path) {
  const data = await getContents(path)
  if (data.encoding === 'base64') {
    return atob(data.content.replace(/\n/g, ''))
  }
  const res = await fetch(data.download_url)
  return res.text()
}

// Returns raw bytes (ArrayBuffer) for a file — used for PDFs
export async function getFileBytes(path) {
  const data = await getContents(path)
  const b64 = data.content.replace(/\n/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// List directory entries
export async function listDir(path = '') {
  const data = await getContents(path)
  if (!Array.isArray(data)) throw new Error(`${path} is not a directory`)
  return data
}

// Save config
export function saveConfig(cfg) {
  localStorage.setItem('studyshelf_config', JSON.stringify(cfg))
}

export function loadConfig() {
  return getConfig()
}
