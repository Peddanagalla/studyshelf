import React, { useState, useRef } from 'react'
import { parseMCQ, extractMCQsFromText } from '../utils/mcq.js'

/* ─────────────────────────────────────────────────────────────────────────────
   MCQImporter
   Two modes:
   1. Paste text  — user pastes raw MCQ text, AI parses it
   2. Upload file — user uploads a .txt / .md file, same pipeline
   (PDF upload kept simple: extract text client-side is unreliable without
    heavy libs, so we ask user to paste text from PDF instead)
───────────────────────────────────────────────────────────────────────────── */

const s = {
  wrap: { padding: '1.5rem 2rem', maxWidth: 720, margin: '0 auto' },
  heading: {
    fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text)',
    marginBottom: '0.3rem',
  },
  sub: { fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: '1.5rem', lineHeight: 1.6 },
  tabs: { display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' },
  tab: {
    padding: '0.4rem 1rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', fontSize: '0.82rem',
    cursor: 'pointer', transition: 'all 0.15s',
    background: 'var(--bg3)', color: 'var(--text-dim)',
  },
  tabActive: {
    background: 'var(--gold-glow)', color: 'var(--gold)',
    borderColor: 'rgba(201,168,76,0.35)',
  },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  label: {
    display: 'block', fontSize: '0.72rem', letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.5rem',
  },
  textarea: {
    width: '100%', minHeight: 220,
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)',
    padding: '0.75rem', fontSize: '0.875rem', lineHeight: 1.65,
    resize: 'vertical', fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  },
  titleInput: {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)',
    padding: '0.55rem 0.8rem', fontSize: '0.9rem',
    fontFamily: 'var(--font-body)', marginBottom: '1rem',
  },
  hint: { fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '0.4rem', lineHeight: 1.6 },
  dropZone: {
    border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '2.5rem 1rem', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.15s',
    background: 'var(--bg3)',
  },
  dropZoneHover: { borderColor: 'var(--gold)', background: 'var(--gold-glow)' },
  dropIcon: { fontSize: '2rem', marginBottom: '0.5rem' },
  dropText: { fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '0.3rem' },
  dropSub: { fontSize: '0.75rem', color: 'var(--text-faint)' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem', alignItems: 'center' },
  parseBtn: {
    padding: '0.55rem 1.4rem', borderRadius: 'var(--radius)',
    background: 'var(--gold)', color: '#0f0e0c',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    transition: 'opacity 0.15s',
  },
  cancelBtn: {
    padding: '0.55rem 1rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', color: 'var(--text-dim)',
    fontSize: '0.82rem', background: 'var(--bg3)', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  status: { fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  error: { fontSize: '0.82rem', color: 'var(--red)', marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(192,80,77,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(192,80,77,0.2)' },
  preview: {
    marginTop: '1.25rem', padding: '1rem',
    background: 'var(--bg3)', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  },
  previewTitle: { fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em' },
  previewQ: { fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.3rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border)' },
}

const SYSTEM_PROMPT = `You are an MCQ extractor. The user will give you raw text containing multiple choice questions.
Extract ALL questions and return ONLY valid JSON in this exact format, nothing else, no markdown:
{
  "title": "inferred title or topic",
  "questions": [
    {
      "id": 1,
      "q": "question text",
      "options": ["option A text", "option B text", "option C text", "option D text"],
      "answer": 0,
      "explanation": "brief explanation if detectable, else empty string"
    }
  ]
}
Rules:
- answer is 0-indexed (0=A, 1=B, 2=C, 3=D)
- Strip option labels (A., B., 1., 2., etc.) from the options array
- If answer key is not present in text, set answer to 0 and note "Answer not found" in explanation
- Include every question you can find
- Return ONLY the JSON object, no other text`

async function callClaude(text, title) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Set VITE_ANTHROPIC_API_KEY in your .env file.')
  }

  const prompt = title
    ? `Title hint: "${title}"\n\nMCQ text:\n${text}`
    : `MCQ text:\n${text}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const content = data.content || data.completion?.content || data.completion?.message?.content || []
  const raw = Array.isArray(content)
    ? (content.find(b => b.type === 'text')?.text || content.map(c => c.text || '').join(' '))
    : typeof content === 'string'
      ? content
      : ''
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()

  try {
    return parseMCQ(clean)
  } catch (err) {
    // Fallback: if AI output isn't valid JSON, try extracting MCQs directly from text.
    const fallback = extractMCQsFromText(raw, title)
    if (fallback.questions.length > 0) {
      return fallback
    }
    throw new Error('AI response was not valid MCQ JSON and no questions could be inferred from the text.')
  }
}

export default function MCQImporter({ onImported, onCancel }) {
  const [mode, setMode] = useState('paste') // 'paste' | 'file'
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [parseSource, setParseSource] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true); setError(null); setPreview(null); setParseSource(null)
    try {
      const content = text.trim()
      let result
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        setParseSource('local')
        result = extractMCQsFromText(content, title.trim())
        if (result.questions.length === 0) {
          throw new Error('No questions were found in the uploaded text. Try formatting the content with numbered questions and answer keys.')
        }
      } else {
        try {
          result = await callClaude(content, title.trim())
          setParseSource('ai')
        } catch (aiError) {
          const fallback = extractMCQsFromText(content, title.trim())
          if (fallback.questions.length > 0) {
            result = fallback
            setParseSource('local-fallback')
          } else {
            throw aiError
          }
        }
      }
      setPreview(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleFile(file) {
    if (!file) return
    if (file.size > 500_000) { setError('File too large. Keep under 500KB or paste the text directly.'); return }
    const reader = new FileReader()
    reader.onload = e => { setText(e.target.result); setMode('paste') }
    reader.onerror = () => setError('Could not read file.')
    reader.readAsText(file)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div style={s.wrap} className="fade-in">
      <div style={s.heading}>Import MCQs</div>
      <div style={s.sub}>
        Paste raw MCQ text (from a book, PDF copy, or anywhere) and AI will parse it into a practice set.
        No need to format anything — just dump the text.
      </div>

      <div style={s.tabs}>
        {[['paste', '✏ Paste Text'], ['file', '📎 Upload .txt File']].map(([id, label]) => (
          <button key={id} style={{ ...s.tab, ...(mode === id ? s.tabActive : {}) }} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      <div style={s.card}>
        <label style={s.label}>Set Title (optional)</label>
        <input
          style={s.titleInput}
          placeholder="e.g. Polity — Fundamental Rights"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {mode === 'paste' ? (
          <>
            <label style={s.label}>MCQ Text</label>
            <textarea
              style={s.textarea}
              placeholder={`Paste your MCQ text here. Any format works, for example:\n\n1. Which Article abolishes untouchability?\n(A) Article 14\n(B) Article 15\n(C) Article 17\n(D) Article 21\nAnswer: C\n\n2. ...`}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div style={s.hint}>
              Works with numbered lists, lettered options, answer keys — any format. Explanations are picked up if present.
            </div>
          </>
        ) : (
          <>
            <div
              style={{ ...s.dropZone, ...(dragging ? s.dropZoneHover : {}) }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div style={s.dropIcon}>📄</div>
              <div style={s.dropText}>Drop a .txt or .md file here</div>
              <div style={s.dropSub}>or click to browse · max 500 KB</div>
              <input ref={fileRef} type="file" accept=".txt,.md,.text" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={s.hint}>
              For PDFs: open in any PDF reader → select all text → copy → use Paste Text tab.
              If you do not have an API key, the app will still try to infer questions locally.
            </div>
          </>
        )}

        {error && <div style={s.error}>⚠ {error}</div>}

        {preview && (
          <div style={s.preview}>
            <div style={s.previewTitle}>Parsed — {preview.questions.length} questions found</div>
            {parseSource && (
              <div style={{ ...s.hint, marginTop: '0.4rem', color: 'var(--text)'}}>
                Parsed using {parseSource === 'ai' ? 'AI parsing' : parseSource === 'local' ? 'local text parsing' : 'local fallback parsing'}.
              </div>
            )}
            {preview.questions.slice(0, 3).map((q, i) => (
              <div key={i} style={s.previewQ}>Q{i + 1}: {q.q.slice(0, 90)}{q.q.length > 90 ? '…' : ''}</div>
            ))}
            {preview.questions.length > 3 && (
              <div style={{ ...s.previewQ, color: 'var(--text-faint)', borderLeftColor: 'transparent' }}>
                + {preview.questions.length - 3} more
              </div>
            )}
          </div>
        )}

        <div style={s.actions}>
          {!preview ? (
            <button
              style={{ ...s.parseBtn, opacity: (loading || !text.trim()) ? 0.5 : 1 }}
              onClick={handleParse}
              disabled={loading || !text.trim()}
            >
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Parsing…</> : '✦ Parse with AI'}
            </button>
          ) : (
            <button style={s.parseBtn} onClick={() => onImported(preview)}>
              Start Practice →
            </button>
          )}
          {preview && (
            <button style={s.cancelBtn} onClick={() => setPreview(null)}>Re-parse</button>
          )}
          <button style={s.cancelBtn} onClick={onCancel}>Cancel</button>
          {loading && <span style={s.status}>Extracting questions…</span>}
        </div>
      </div>
    </div>
  )
}
