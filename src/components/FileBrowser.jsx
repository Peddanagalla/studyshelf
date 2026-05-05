import React, { useState, useEffect } from 'react'
import { listDir, getFileText } from '../utils/github.js'
import { parseMCQ } from '../utils/mcq.js'
import PdfViewer from './PdfViewer.jsx'
import MCQPractice from './MCQPractice.jsx'
import MCQImporter from './MCQImporter.jsx'

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  wrap: { display: 'flex', height: '100%', overflow: 'hidden', minHeight: '100vh' },
  sidebar: {
    width: 260, minWidth: 240, flexShrink: 0,
    background: 'var(--bg2)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
    boxShadow: '1px 0 0 rgba(255,255,255,0.04)',
  },
  sidebarTop: { padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  importBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    width: '100%', padding: '0.7rem 0.85rem',
    borderRadius: '999px', border: '1px dashed rgba(16,185,129,0.3)',
    background: 'var(--accent-glow)', color: 'var(--accent)',
    fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s ease', fontFamily: 'var(--font-body)',
  },
  sidebarList: { flex: 1, padding: '0.75rem 0', overflowY: 'auto' },
  sectionHead: {
    padding: '0.75rem 1rem 0.3rem',
    fontSize: '0.72rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--text-faint)',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem', color: 'var(--text-dim)',
    cursor: 'pointer', transition: 'all 0.14s ease',
    borderRadius: 'var(--radius)',
    borderLeft: '2px solid transparent',
    userSelect: 'none',
    wordBreak: 'break-word',
  },
  itemActive: {
    color: 'var(--accent)', background: 'var(--accent-glow)',
    borderLeftColor: 'var(--accent)',
  },
  itemHover: {
    color: 'var(--text)', background: 'var(--bg3)',
  },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  breadcrumb: {
    padding: '0.85rem 1.15rem',
    fontSize: '0.78rem', color: 'var(--text-dim)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap',
    flexShrink: 0,
  },
  crumb: { cursor: 'pointer', transition: 'color 0.12s ease' },
  crumbSep: { color: 'var(--text-faint)', fontSize: '0.7rem' },
  mainContent: { flex: 1, overflow: 'auto' },
  placeholder: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-faint)', gap: '0.6rem', padding: '2rem',
    background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
  },
  placeholderIcon: { fontSize: '2.5rem', opacity: 0.5 },
  placeholderText: { fontSize: '0.875rem', textAlign: 'center', lineHeight: 1.7 },
  loadingRow: {
    padding: '0.45rem 0.9rem', fontSize: '0.8rem',
    color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  errorRow: { padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: 'var(--red)' },
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (ext === 'pdf') return '📄'
  if (ext === 'json') return '📝'
  if (ext === 'md') return '📃'
  if (ext === 'txt') return '📋'
  return '📎'
}

function useDir(path) {
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (path === null) return
    let cancelled = false
    setLoading(true); setError(null)
    listDir(path)
      .then(d => { if (!cancelled) { setEntries(d); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [path])

  return { entries, loading, error }
}

function SidebarItem({ label, icon, active, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...s.item, ...(active ? s.itemActive : hovered ? s.itemHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <span style={{ opacity: 0.7, fontSize: '0.85rem' }}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

export default function FileBrowser({ rootPath = '', tab }) {
  const rootLabel = rootPath
    ? rootPath.charAt(0).toUpperCase() + rootPath.slice(1).replace(/-/g, ' ')
    : 'Root'
  const [stack, setStack] = useState([{ name: rootLabel, path: rootPath }])
  const [selectedFile, setSelectedFile] = useState(null)
  const [mcqData, setMcqData] = useState(null)
  const [mcqLoading, setMcqLoading] = useState(false)
  const [mcqError, setMcqError] = useState(null)
  const [view, setView] = useState('browser') // 'browser'|'pdf'|'mcq'|'import'

  const currentPath = stack[stack.length - 1].path
  const { entries, loading, error } = useDir(currentPath)

  const dirs = (entries || []).filter(e => e.type === 'dir')
  const files = (entries || []).filter(e => e.type === 'file')
  const isMcqTab = tab === 'mcq' || tab === 'ca'

  function enterDir(entry) {
    setStack(p => [...p, { name: entry.name, path: entry.path }])
    setSelectedFile(null)
  }

  function breadcrumbTo(idx) {
    setStack(p => p.slice(0, idx + 1))
    setSelectedFile(null); setView('browser')
  }

  async function openFile(entry) {
    setSelectedFile(entry)
    if (entry.name.endsWith('.pdf')) {
      setView('pdf')
    } else if (entry.name.endsWith('.json')) {
      setMcqLoading(true); setMcqError(null); setView('browser')
      try {
        const text = await getFileText(entry.path)
        const data = parseMCQ(text)
        setMcqData(data); setView('mcq')
      } catch (e) {
        setMcqError(e.message)
      } finally {
        setMcqLoading(false)
      }
    }
  }

  function exitViewer() {
    setView('browser'); setSelectedFile(null); setMcqData(null)
  }

  /* ── PDF view ── */
  if (view === 'pdf' && selectedFile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={s.breadcrumb} className="browser-breadcrumb">
          <span style={{ ...s.crumb, color: 'var(--accent)' }} onClick={exitViewer}>← Back</span>
          <span style={s.crumbSep}>/</span>
          <span>{selectedFile.name}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PdfViewer
            filePath={selectedFile.path}
            onExtracted={data => { setMcqData(data); setView('mcq') }}
          />
        </div>
      </div>
    )
  }

  /* ── MCQ practice ── */
  if (view === 'mcq' && mcqData) {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <MCQPractice mcqData={mcqData} onBack={exitViewer} />
      </div>
    )
  }

  /* ── AI Importer ── */
  if (view === 'import') {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <MCQImporter
          onImported={data => { setMcqData(data); setView('mcq') }}
          onCancel={() => setView('browser')}
        />
      </div>
    )
  }

  /* ── File browser ── */
  return (
    <div style={s.wrap} className="file-browser">
      <div style={s.sidebar} className="browser-sidebar">
        {/* Import button — only on MCQ / current affairs tabs */}
        {isMcqTab && (
          <div style={s.sidebarTop} className="sidebar-top">
            <button style={s.importBtn} onClick={() => setView('import')}>
              ✦ Import MCQs with AI
            </button>
          </div>
        )}

        <div style={s.sidebarList} className="sidebar-list">
          {loading && <div style={s.loadingRow}><span className="spinner" /> Loading…</div>}
          {error && <div style={s.errorRow}>⚠ {error}</div>}

          {dirs.length > 0 && (
            <>
              <div style={s.sectionHead}>Folders</div>
              {dirs.map(d => (
                <SidebarItem key={d.sha} label={d.name} icon="📁" active={false} onClick={() => enterDir(d)} />
              ))}
            </>
          )}

          {files.length > 0 && (
            <>
              <div style={s.sectionHead}>Files</div>
              {files.map(f => (
                <SidebarItem
                  key={f.sha} label={f.name}
                  icon={fileIcon(f.name)}
                  active={selectedFile?.path === f.path}
                  onClick={() => openFile(f)}
                />
              ))}
            </>
          )}

          {!loading && !error && dirs.length === 0 && files.length === 0 && (
            <div style={s.loadingRow}>This folder is empty</div>
          )}
        </div>
      </div>

      <div style={s.main} className="browser-main">
        {/* Breadcrumb */}
        <div style={s.breadcrumb} className="browser-breadcrumb">
          {stack.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={s.crumbSep}>›</span>}
              <span
                style={{ ...s.crumb, color: i === stack.length - 1 ? 'var(--text)' : 'var(--text-dim)' }}
                onClick={() => breadcrumbTo(i)}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div style={s.mainContent}>
          <div style={s.placeholder}>
            {mcqLoading && <><span className="spinner" /><span style={{ fontSize: '0.875rem' }}>Loading MCQ set…</span></>}
            {mcqError && <span style={{ color: 'var(--red)', fontSize: '0.875rem' }}>⚠ {mcqError}</span>}
            {!mcqLoading && !mcqError && (
              <>
                <span style={s.placeholderIcon}>
                  {isMcqTab ? '✏' : '📂'}
                </span>
                <span style={s.placeholderText}>
                  {isMcqTab
                    ? 'Select a .json file to practice\nor use "Import MCQs with AI" to parse raw text'
                    : 'Select a file from the sidebar\n.pdf to read · .json for MCQ practice'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
