import React, { useEffect, useRef, useState } from 'react'
import { getFileBytes } from '../utils/github.js'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.6rem 1rem',
    background: 'var(--bg3)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  pageInfo: { fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: 'auto' },
  btn: {
    padding: '0.3rem 0.7rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: '0.8rem',
    background: 'var(--bg4)',
    transition: 'background var(--transition)',
  },
  canvas: { display: 'block', margin: '0 auto' },
  scroll: { flex: 1, overflow: 'auto', padding: '1rem', background: 'var(--bg)' },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '200px', color: 'var(--text-dim)', gap: '0.75rem',
  },
  error: {
    padding: '1.5rem', color: 'var(--red)',
    fontSize: '0.875rem', textAlign: 'center',
  },
}

let pdfjsLib = null

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib
  const mod = await import('pdfjs-dist')
  mod.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).href
  pdfjsLib = mod
  return mod
}

export default function PdfViewer({ filePath }) {
  const canvasRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [scale, setScale] = useState(1.4)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPdf(null)
    setPage(1)

    async function load() {
      try {
        const lib = await getPdfjs()
        const bytes = await getFileBytes(filePath)
        const doc = await lib.getDocument({ data: bytes }).promise
        if (cancelled) return
        setPdf(doc)
        setTotal(doc.numPages)
        setLoading(false)
      } catch (e) {
        if (!cancelled) { setError(e.message); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [filePath])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false

    async function render() {
      try {
        const pg = await pdf.getPage(page)
        if (cancelled) return
        const viewport = pg.getViewport({ scale })
        const canvas = canvasRef.current
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await pg.render({ canvasContext: ctx, viewport }).promise
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    }
    render()
    return () => { cancelled = true }
  }, [pdf, page, scale])

  if (loading) return (
    <div style={s.wrap}>
      <div style={s.loading}><span className="spinner" /> Loading PDF…</div>
    </div>
  )
  if (error) return <div style={s.error}>⚠ {error}</div>

  return (
    <div style={s.wrap}>
      <div style={s.toolbar}>
        <button style={s.btn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>◀</button>
        <button style={s.btn} onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page >= total}>▶</button>
        <button style={s.btn} onClick={() => setScale(sc => Math.max(0.6, +(sc - 0.2).toFixed(1)))}>−</button>
        <button style={s.btn} onClick={() => setScale(sc => Math.min(3, +(sc + 0.2).toFixed(1)))}>+</button>
        <span style={s.pageInfo}>Page {page} / {total} · {Math.round(scale * 100)}%</span>
      </div>
      <div style={s.scroll}>
        <canvas ref={canvasRef} style={s.canvas} />
      </div>
    </div>
  )
}
