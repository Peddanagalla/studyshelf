import React, { useState, useEffect } from 'react'
import { listDir, getFileText } from '../utils/github.js'
import { parseMCQ } from '../utils/mcq.js'
import PdfViewer from './PdfViewer.jsx'
import MCQPractice from './MCQPractice.jsx'
import MCQImporter from './MCQImporter.jsx'

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const s = {
  wrap: { display: 'flex', height: '100%', overflow: 'hidden' },
  sidebar: {
    width: 248, flexShrink: 0,
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  sidebarTop: { padding: '0.75rem 0.75rem 0.5rem', borderBottom: '1px solid var(--border)' },
  importBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    width: '100%', padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius)', border: '1px dashed rgba(201,168,76,0.3)',
    background: 'var(--gold-glow)', color: 'var(--gold)',
    fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
  },
  sidebarList: { flex: 1, padding: '0.4rem 0', overflowY: 'auto' },
  sectionHead: {
    padding: '0.5rem 0.9rem 0.2rem',
    fontSize: '0.67rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--text-faint)',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.42rem 0.9rem',
    fontSize: '0.855rem', color: 'var(--text-dim)',
    cursor: 'pointer', transition: 'all 0.12s',
    borderLeft: '2px solid transparent',
    userSelect: 'none',
    wordBreak: 'break-word',
  },
  itemActive: {
    color: 'var(--gold)', background: 'var(--gold-glow)',
    borderLeftColor: 'var(--gold)',
  },
  itemHover: {
    color: 'var(--text)', background: 'var(--bg3)',
  },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  breadcrumb: {
    padding: '0.55rem 1.25rem',
    fontSize: '0.78rem', color: 'var(--text-dim)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg2)',
    display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap',
    flexShrink: 0,
  },
  crumb: { cursor: 'pointer', transition: 'color 0.12s' },
  crumbSep: { color: 'var(--text-faint)', fontSize: '0.7rem' },
  mainContent: { flex: 1, overflow: 'auto' },
  placeholder: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-faint)', gap: '0.6rem', padding: '2rem',
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
        <div style={s.breadcrumb}>
          <span style={{ ...s.crumb, color: 'var(--gold)' }} onClick={exitViewer}>← Back</span>
          <span style={s.crumbSep}>/</span>
          <span>{selectedFile.name}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PdfViewer filePath={selectedFile.path} />
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
    <div style={s.wrap}>
      <div style={s.sidebar}>
        {/* Import button — only on MCQ / current affairs tabs */}
        {isMcqTab && (
          <div style={s.sidebarTop}>
            <button style={s.importBtn} onClick={() => setView('import')}>
              ✦ Import MCQs with AI
            </button>
          </div>
        )}

        <div style={s.sidebarList}>
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

      <div style={s.main}>
        {/* Breadcrumb */}
        <div style={s.breadcrumb}>
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
