import React, { useState, useEffect } from 'react'
import FileBrowser from './components/FileBrowser.jsx'
import Settings from './components/Settings.jsx'
import { loadConfig } from './utils/github.js'

const s = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },

  header: {
    display: 'flex', alignItems: 'center',
    padding: '0.85rem 1.25rem', minHeight: 56,
    background: 'var(--bg2)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0, gap: '0.75rem',
    boxShadow: '0 1px 8px rgba(0,0,0,0.18)',
  },
  logoWrap: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', userSelect: 'none', marginRight: '1rem' },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: '1.5rem',
    color: 'var(--accent)', letterSpacing: '-0.02em', fontWeight: 700,
  },
  logoDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6, marginBottom: 2 },
  logoSub: {
    fontSize: '0.68rem', color: 'var(--text-faint)',
    fontFamily: 'var(--font-body)', letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  divider: { width: 1, height: 20, background: 'var(--border)', flexShrink: 0 },
  nav: { display: 'flex', gap: '0.2rem' },
  navBtn: {
    padding: '0.5rem 1rem', borderRadius: 999,
    border: '1px solid transparent', fontSize: '0.88rem',
    color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)',
    transition: 'all 0.15s ease', cursor: 'pointer', fontFamily: 'var(--font-body)',
    letterSpacing: '0.01em',
  },
  navBtnActive: {
    color: 'var(--accent)', background: 'var(--accent-glow)',
    borderColor: 'rgba(16,185,129,0.2)',
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
    padding: '0.55rem 1rem', borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)',
    fontSize: '0.88rem', background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    transition: 'all 0.15s ease', fontFamily: 'var(--font-body)',
  },
  content: { flex: 1, overflow: 'hidden' },

  setup: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', flexDirection: 'column', gap: '1rem', padding: '2rem',
    animation: 'fadeIn 0.35s ease',
  },
  setupCard: {
    background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 'var(--radius-lg)', padding: '3rem 2.5rem',
    maxWidth: 520, width: '100%', textAlign: 'center',
    boxShadow: '0 18px 55px rgba(0,0,0,0.18)',
  },
  setupIcon: { fontSize: '2.5rem', marginBottom: '1rem', display: 'block' },
  setupTitle: {
    fontFamily: 'var(--font-display)', fontSize: '1.9rem',
    color: 'var(--accent)', marginBottom: '0.75rem', fontWeight: 700,
  },
  setupText: {
    color: 'var(--text-dim)', fontSize: '0.875rem',
    lineHeight: 1.75, marginBottom: '1.5rem',
  },
  setupCode: {
    display: 'block', background: 'var(--bg3)', borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem', marginBottom: '1.5rem',
    fontFamily: "'Fira Code', monospace", fontSize: '0.8rem',
    color: 'var(--accent)', lineHeight: 1.8, textAlign: 'left',
    border: '1px solid var(--border)',
  },
  setupBtn: {
    padding: '0.65rem 2rem', borderRadius: 'var(--radius)',
    background: 'var(--accent)', color: '#fff',
    fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
    border: 'none', fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
    transition: 'opacity 0.15s, transform 0.15s',
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
    <div style={s.app} className="app">
      <header style={s.header} className="app-header">
        <div style={s.logoWrap} className="logo-wrap">
          <span style={s.logo}>CivilEdge</span>
          <span style={s.logoSub}>CIVIL SERVICES</span>
        </div>

        {isConfigured && (
          <>
            <div style={s.divider} />
            <nav style={s.nav} className="app-nav">
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
          <span style={s.repoBadge} className="repo-badge">{config.owner}/{config.repo}</span>
        )}

        <button
          style={s.settingsBtn}
          className="settings-trigger"
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
            <div style={s.setupCard} className="setup-card">
              <span style={s.setupIcon}>📖</span>
              <div style={s.setupTitle}>Welcome to CivilEdge</div>
              <p style={s.setupText}>
                Connect your GitHub repository to get started.
                Your notes and MCQ files live there — CivilEdge just reads them.
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
