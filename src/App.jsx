import React, { useState, useEffect } from 'react'
import FileBrowser from './components/FileBrowser.jsx'
import Settings from './components/Settings.jsx'
import { loadConfig } from './utils/github.js'

const s = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },

  header: {
    display: 'flex', alignItems: 'center',
    padding: '0 1.25rem', height: 54,
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0, gap: '0.5rem',
    boxShadow: '0 1px 0 var(--border)',
  },
  logoWrap: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', userSelect: 'none', marginRight: '1rem' },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: '1.2rem',
    color: 'var(--gold)', letterSpacing: '-0.01em',
  },
  logoDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.5, marginBottom: 2 },
  logoSub: {
    fontSize: '0.68rem', color: 'var(--text-faint)',
    fontFamily: 'var(--font-body)', letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  divider: { width: 1, height: 20, background: 'var(--border)', flexShrink: 0 },
  nav: { display: 'flex', gap: '0.2rem' },
  navBtn: {
    padding: '0.35rem 0.9rem', borderRadius: 'var(--radius)',
    border: '1px solid transparent', fontSize: '0.82rem',
    color: 'var(--text-dim)', background: 'transparent',
    transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'var(--font-body)',
    letterSpacing: '0.01em',
  },
  navBtnActive: {
    color: 'var(--gold)', background: 'var(--gold-glow)',
    borderColor: 'rgba(201,168,76,0.2)',
  },
  spacer: { flex: 1 },
  repoBadge: {
    fontSize: '0.72rem', color: 'var(--text-faint)',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '0.22rem 0.65rem',
    fontFamily: "'DM Mono', 'Courier New', monospace",
    letterSpacing: '0.02em',
  },
  settingsBtn: {
    padding: '0.35rem 0.8rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', color: 'var(--text-dim)',
    fontSize: '0.8rem', background: 'var(--bg3)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
  },
  content: { flex: 1, overflow: 'hidden' },

  setup: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', flexDirection: 'column', gap: '1rem', padding: '2rem',
    animation: 'fadeIn 0.35s ease',
  },
  setupCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '3rem 2.5rem',
    maxWidth: 440, width: '100%', textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
  },
  setupIcon: { fontSize: '2.5rem', marginBottom: '1rem', display: 'block' },
  setupTitle: {
    fontFamily: 'var(--font-display)', fontSize: '1.6rem',
    color: 'var(--gold)', marginBottom: '0.75rem',
  },
  setupText: {
    color: 'var(--text-dim)', fontSize: '0.875rem',
    lineHeight: 1.75, marginBottom: '1.5rem',
  },
  setupCode: {
    display: 'block', background: 'var(--bg3)', borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem', marginBottom: '1.5rem',
    fontFamily: "'DM Mono', monospace", fontSize: '0.8rem',
    color: 'var(--gold)', lineHeight: 1.8, textAlign: 'left',
    border: '1px solid var(--border)',
  },
  setupBtn: {
    padding: '0.65rem 2rem', borderRadius: 'var(--radius)',
    background: 'var(--gold)', color: '#0f0e0c',
    fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
    transition: 'opacity 0.15s',
  },
}

const TABS = [
  { id: 'notes', label: 'Notes & Files', icon: '📚' },
  { id: 'mcq',   label: 'MCQ Practice',  icon: '✏' },
  { id: 'ca',    label: 'Current Affairs', icon: '📰' },
]

const tabRoot = { notes: 'notes', mcq: 'mcq', ca: 'current-affairs' }

export default function App() {
  const [tab, setTab] = useState('notes')
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState(loadConfig())

  // Re-read config after settings saved
  function afterSettings() { setConfig(loadConfig()); setShowSettings(false) }

  const isConfigured = !!(config.owner && config.repo)

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logoWrap}>
          <span style={s.logo}>StudyShelf</span>
          <span style={s.logoSub}>UPSC · APPSC</span>
        </div>

        {isConfigured && (
          <>
            <div style={s.divider} />
            <nav style={s.nav}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  style={{ ...s.navBtn, ...(tab === t.id ? s.navBtnActive : {}) }}
                  onClick={() => setTab(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
          </>
        )}

        <div style={s.spacer} />

        {isConfigured && (
          <span style={s.repoBadge}>{config.owner}/{config.repo}</span>
        )}

        <button
          style={s.settingsBtn}
          onClick={() => setShowSettings(true)}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
        >
          ⚙ Settings
        </button>
      </header>

      <div style={s.content}>
        {!isConfigured ? (
          <div style={s.setup}>
            <div style={s.setupCard}>
              <span style={s.setupIcon}>📖</span>
              <div style={s.setupTitle}>Welcome to StudyShelf</div>
              <p style={s.setupText}>
                Connect your GitHub repository to get started.
                Your notes and MCQ files live there — StudyShelf just reads them.
              </p>
              <code style={s.setupCode}>
                your-repo/<br />
                &nbsp;&nbsp;notes/ &nbsp;&nbsp;&nbsp;← PDFs &amp; reading material<br />
                &nbsp;&nbsp;mcq/ &nbsp;&nbsp;&nbsp;&nbsp;← MCQ JSON files<br />
                &nbsp;&nbsp;current-affairs/
              </code>
              <button style={s.setupBtn} onClick={() => setShowSettings(true)}>
                Connect GitHub Repo →
              </button>
            </div>
          </div>
        ) : (
          <FileBrowser key={tab} rootPath={tabRoot[tab]} tab={tab} />
        )}
      </div>

      {showSettings && <Settings onClose={afterSettings} />}
    </div>
  )
}
