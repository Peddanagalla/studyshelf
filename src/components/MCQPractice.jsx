import React, { useState } from 'react'
import { scoreSession } from '../utils/mcq.js'

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  wrap: { padding: '1.5rem 2rem', maxWidth: 780, margin: '0 auto', paddingBottom: '4rem' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '1.25rem', gap: '1rem',
  },
  titleBlock: {},
  title: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text)', lineHeight: 1.3 },
  subtitle: { fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '0.2rem', letterSpacing: '0.04em' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' },
  progressBar: { flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--gold)', borderRadius: 2, transition: 'width 0.4s ease' },
  progressLabel: { fontSize: '0.75rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' },

  // Question number strip
  qStrip: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' },
  qDot: {
    width: 28, height: 28, borderRadius: 4, border: '1px solid',
    fontSize: '0.72rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s ease',
  },

  // Card
  qCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.75rem',
    marginBottom: '1rem', animation: 'fadeIn 0.2s ease',
    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
  },
  qMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' },
  qBadge: {
    fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--gold)', background: 'var(--gold-glow)',
    border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: 4, padding: '0.15rem 0.5rem',
  },
  qText: { fontSize: '0.975rem', lineHeight: 1.75, color: 'var(--text)', marginBottom: '1.25rem' },

  optBtn: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem', width: '100%', textAlign: 'left',
    padding: '0.7rem 1rem', marginBottom: '0.45rem',
    borderRadius: 'var(--radius)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '0.9rem', background: 'var(--bg3)',
    transition: 'all 0.15s ease', cursor: 'pointer', lineHeight: 1.5,
  },
  optLetter: {
    minWidth: 22, height: 22, borderRadius: 3,
    background: 'var(--bg4)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginTop: 1,
    transition: 'all 0.15s ease',
  },
  explainBox: {
    marginTop: '0.85rem', padding: '0.7rem 0.9rem',
    borderRadius: 'var(--radius)', background: 'var(--bg)',
    borderLeft: '2px solid var(--gold-dim)',
    fontSize: '0.83rem', color: 'var(--text-dim)', lineHeight: 1.65,
    animation: 'fadeIn 0.2s ease',
  },

  // Nav bar
  navBar: {
    display: 'flex', gap: '0.5rem', justifyContent: 'space-between',
    alignItems: 'center', marginTop: '0.75rem',
  },
  navGroup: { display: 'flex', gap: '0.5rem' },
  navBtn: {
    padding: '0.5rem 1rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', color: 'var(--text-dim)',
    fontSize: '0.82rem', background: 'var(--bg3)',
    transition: 'all 0.15s ease', cursor: 'pointer',
  },
  submitBtn: {
    padding: '0.5rem 1.4rem', borderRadius: 'var(--radius)',
    background: 'var(--gold)', color: '#0f0e0c',
    fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.02em',
    transition: 'opacity 0.15s', cursor: 'pointer',
  },

  // Result
  resultWrap: { padding: '2rem', maxWidth: 600, margin: '0 auto', animation: 'fadeIn 0.3s ease' },
  resultCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  resultTitle: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-dim)', marginBottom: '1.25rem' },
  scoreRing: {
    width: 120, height: 120, borderRadius: '50%',
    border: '3px solid var(--gold)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.5rem',
    background: 'var(--gold-glow)',
  },
  scoreNum: { fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--gold)', lineHeight: 1 },
  scoreUnit: { fontSize: '0.72rem', color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  stats: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' },
  stat: {
    padding: '0.6rem 1.1rem', borderRadius: 'var(--radius)',
    background: 'var(--bg3)', border: '1px solid var(--border)', minWidth: 80,
  },
  statNum: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', display: 'block' },
  statLabel: { fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  resultActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center' },

  // Review
  reviewWrap: { padding: '1.5rem 2rem', maxWidth: 780, margin: '0 auto', paddingBottom: '3rem' },
  reviewItem: {
    padding: '1.1rem 1.25rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', marginBottom: '0.75rem',
    background: 'var(--bg2)', borderLeftWidth: 3,
  },
}

/* ─── Option styling based on state ─────────────────────────────────────── */
// During practice: only highlight selected (gold). No answer reveal.
// After submit (review): show correct=green, wrong=red
function optStyle(i, selected, correct, mode) {
  const base = { ...s.optBtn }
  const letterBase = { ...s.optLetter }

  if (mode === 'practice') {
    if (i === selected) {
      base.background = 'var(--gold-glow)'
      base.borderColor = 'rgba(201,168,76,0.4)'
      base.color = 'var(--gold)'
      letterBase.background = 'var(--gold)'
      letterBase.color = '#0f0e0c'
      letterBase.borderColor = 'var(--gold)'
    }
  } else {
    // review mode — show correct/wrong
    if (i === correct) {
      base.background = 'rgba(106,170,110,0.1)'
      base.borderColor = 'var(--green)'
      base.color = 'var(--green)'
      letterBase.background = 'var(--green)'
      letterBase.color = '#0f0e0c'
      letterBase.borderColor = 'var(--green)'
    } else if (i === selected && i !== correct) {
      base.background = 'rgba(192,80,77,0.1)'
      base.borderColor = 'var(--red)'
      base.color = 'var(--red)'
      letterBase.background = 'var(--red)'
      letterBase.color = '#fff'
      letterBase.borderColor = 'var(--red)'
    }
  }
  return { btn: base, letter: letterBase }
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function MCQPractice({ mcqData, onBack }) {
  const { title, questions } = mcqData
  const [cur, setCur] = useState(0)
  const [answers, setAnswers] = useState({})   // index → chosen option
  const [submitted, setSubmitted] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const q = questions[cur]
  const selected = answers[cur]
  const attempted = Object.keys(answers).length
  const progress = (attempted / questions.length) * 100

  function select(i) {
    if (submitted) return
    // toggle off if same option clicked again
    if (answers[cur] === i) {
      setAnswers(p => { const n = { ...p }; delete n[cur]; return n })
    } else {
      setAnswers(p => ({ ...p, [cur]: i }))
    }
  }

  const score = submitted ? scoreSession(questions, answers) : null

  /* ── Result screen ── */
  if (submitted && !showReview) {
    return (
      <div style={s.resultWrap}>
        <div style={s.resultCard}>
          <div style={s.resultTitle}>Session Complete</div>
          <div style={s.scoreRing}>
            <span style={s.scoreNum}>{score.percent}</span>
            <span style={s.scoreUnit}>percent</span>
          </div>
          <div style={s.stats}>
            <div style={s.stat}>
              <span style={{ ...s.statNum, color: 'var(--green)' }}>{score.correct}</span>
              <span style={s.statLabel}>Correct</span>
            </div>
            <div style={s.stat}>
              <span style={{ ...s.statNum, color: 'var(--red)' }}>{score.wrong}</span>
              <span style={s.statLabel}>Wrong</span>
            </div>
            <div style={s.stat}>
              <span style={{ ...s.statNum, color: 'var(--text-dim)' }}>{score.skipped}</span>
              <span style={s.statLabel}>Skipped</span>
            </div>
            <div style={s.stat}>
              <span style={{ ...s.statNum, color: 'var(--text-dim)' }}>{score.total}</span>
              <span style={s.statLabel}>Total</span>
            </div>
          </div>
          <div style={s.resultActions}>
            <button style={s.navBtn} onClick={onBack}>← Back</button>
            <button style={s.submitBtn} onClick={() => setShowReview(true)}>Review Answers</button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Review screen ── */
  if (submitted && showReview) {
    return (
      <div style={s.reviewWrap} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <button style={s.navBtn} onClick={() => setShowReview(false)}>← Score</button>
          <span style={s.title}>{title}</span>
        </div>
        {questions.map((q, i) => {
          const userAns = answers[i]
          const correct = userAns === q.answer
          const skipped = userAns === undefined
          const color = skipped ? 'var(--text-faint)' : correct ? 'var(--green)' : 'var(--red)'
          return (
            <div key={i} style={{ ...s.reviewItem, borderLeftColor: color }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 3, minWidth: 24 }}>Q{i + 1}</span>
                <span style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>{q.q}</span>
              </div>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer
                const isUser = oi === userAns
                return (
                  <div key={oi} style={{
                    padding: '0.25rem 0.5rem 0.25rem 1.5rem', fontSize: '0.85rem',
                    color: isCorrect ? 'var(--green)' : (isUser && !correct) ? 'var(--red)' : 'var(--text-faint)',
                    fontWeight: isCorrect ? 600 : 400,
                  }}>
                    {LETTERS[oi]}. {opt}
                    {isCorrect && ' ✓'}
                    {isUser && !correct && ' ✗'}
                  </div>
                )
              })}
              {q.explanation && (
                <div style={{ ...s.explainBox, marginTop: '0.6rem' }}>💡 {q.explanation}</div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  /* ── Practice screen ── */
  return (
    <div style={s.wrap} className="fade-in">
      <div style={s.header}>
        <div style={s.titleBlock}>
          <div style={s.title}>{title}</div>
          <div style={s.subtitle}>{questions.length} questions · answers revealed after submit</div>
        </div>
      </div>

      <div style={s.progressRow}>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        <span style={s.progressLabel}>{attempted}/{questions.length} answered</span>
      </div>

      {/* Number strip */}
      <div style={s.qStrip}>
        {questions.map((_, i) => {
          const isCur = i === cur
          const isDone = answers[i] !== undefined
          return (
            <button
              key={i}
              style={{
                ...s.qDot,
                borderColor: isCur ? 'var(--gold)' : isDone ? 'var(--border)' : 'var(--border)',
                background: isCur ? 'var(--gold-glow)' : isDone ? 'var(--bg3)' : 'transparent',
                color: isCur ? 'var(--gold)' : isDone ? 'var(--text-dim)' : 'var(--text-faint)',
                fontWeight: isCur ? 700 : 400,
              }}
              onClick={() => setCur(i)}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      <div style={s.qCard}>
        <div style={s.qMeta}>
          <span style={s.qBadge}>Q {cur + 1} / {questions.length}</span>
        </div>
        <div style={s.qText}>{q.q}</div>
        {q.options.map((opt, i) => {
          const { btn, letter } = optStyle(i, selected, q.answer, 'practice')
          return (
            <button key={i} style={btn} onClick={() => select(i)}>
              <span style={letter}>{LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Nav */}
      <div style={s.navBar}>
        <div style={s.navGroup}>
          <button style={s.navBtn} onClick={onBack}>✕ Exit</button>
          <button style={s.navBtn} disabled={cur === 0} onClick={() => setCur(p => p - 1)}>← Prev</button>
          <button style={s.navBtn} disabled={cur === questions.length - 1} onClick={() => setCur(p => p + 1)}>Next →</button>
        </div>
        <button style={s.submitBtn} onClick={() => setSubmitted(true)}>
          Submit & Score
        </button>
      </div>
    </div>
  )
}
