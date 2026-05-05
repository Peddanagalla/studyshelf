import React, { useState, useEffect } from 'react'
import { saveConfig, loadConfig } from '../utils/github.js'

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--bg2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    width: '100%',
    maxWidth: 520,
    animation: 'fadeIn 0.2s ease',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    color: 'var(--accent)',
    marginBottom: '1.5rem',
  },
  field: { marginBottom: '1.2rem' },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    background: 'var(--bg3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text)',
    padding: '0.75rem 0.95rem',
    fontSize: '0.95rem',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--text-faint)',
    marginTop: '0.3rem',
  },
  actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' },
  btnCancel: {
    padding: '0.65rem 1.15rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-dim)',
    fontSize: '0.9rem',
    background: 'transparent',
  },
  btnSave: {
    padding: '0.65rem 1.25rem',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  saved: {
    fontSize: '0.8rem',
    color: 'var(--green)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  }
}

export default function Settings({ onClose }) {
  const [cfg, setCfg] = useState({ owner: '', repo: '', branch: 'main', token: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const existing = loadConfig()
    if (existing.owner) setCfg(existing)
  }, [])

  function handleSave() {
    saveConfig(cfg)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  return (
    <div style={styles.overlay} className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="settings-modal fade-in">
        <div style={styles.title}>⚙ Settings</div>

        <div style={styles.field}>
          <label style={styles.label}>GitHub Username</label>
          <input
            style={styles.input}
            value={cfg.owner}
            onChange={e => setCfg(p => ({ ...p, owner: e.target.value }))}
            placeholder="e.g. harikrishna"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Repository Name</label>
          <input
            style={styles.input}
            value={cfg.repo}
            onChange={e => setCfg(p => ({ ...p, repo: e.target.value }))}
            placeholder="e.g. upsc-notes"
          />
          <div style={styles.hint}>Create a private repo on GitHub and use it as your file store.</div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Branch</label>
          <input
            style={styles.input}
            value={cfg.branch}
            onChange={e => setCfg(p => ({ ...p, branch: e.target.value }))}
            placeholder="main"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Personal Access Token</label>
          <input
            type="password"
            style={styles.input}
            value={cfg.token}
            onChange={e => setCfg(p => ({ ...p, token: e.target.value }))}
            placeholder="ghp_xxxxxxxxxxxx"
          />
          <div style={styles.hint}>
            GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained.
            Give it <strong style={{ color: 'var(--text-dim)' }}>Contents: Read</strong> permission.
            Stored locally in your browser only.
          </div>
        </div>

        <div style={styles.actions} className="settings-actions">
          {saved && <span style={styles.saved}>✓ Saved!</span>}
          <button style={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button style={styles.btnSave} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
