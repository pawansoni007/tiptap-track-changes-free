import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextSelection } from '@tiptap/pm/state'
import { InsertionMark } from '../extensions/InsertionMark'
import { DeletionMark } from '../extensions/DeletionMark'
import { TrackChangesBehavior } from '../extensions/TrackChangesBehavior'
import { findChangeRange, collectAllChanges } from '../utils/trackChangeUtils'

/* ─── sample document ─── */
const sampleContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This sample editor tracks inline insertions and deletions like a lightweight Word review mode. ' },
        { type: 'text', text: 'Revenue streams have exceeded projections by ' },
        {
          type: 'text',
          text: 'a small margin',
          marks: [{ type: 'deletion', attrs: { changeId: 'demo-del-1', createdAt: new Date().toISOString() } }],
        },
        {
          type: 'text',
          text: 'approximately 12%',
          marks: [{ type: 'insertion', attrs: { changeId: 'demo-ins-1', createdAt: new Date().toISOString() } }],
        },
        { type: 'text', text: ', driven primarily by ' },
        {
          type: 'text',
          text: 'new customer acquisition',
          marks: [{ type: 'deletion', attrs: { changeId: 'demo-del-2', createdAt: new Date().toISOString() } }],
        },
        {
          type: 'text',
          text: 'expansion of the digital lending platform',
          marks: [{ type: 'insertion', attrs: { changeId: 'demo-ins-2', createdAt: new Date().toISOString() } }],
        },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'The investment advisory segment has shown ' },
        {
          type: 'text',
          text: 'promise',
          marks: [{ type: 'deletion', attrs: { changeId: 'demo-del-3', createdAt: new Date().toISOString() } }],
        },
        {
          type: 'text',
          text: 'exceptional traction with a 40% month-over-month increase in AUM',
          marks: [{ type: 'insertion', attrs: { changeId: 'demo-ins-3', createdAt: new Date().toISOString() } }],
        },
        { type: 'text', text: '. We recommend ' },
        {
          type: 'text',
          text: 'continuing current strategies',
          marks: [{ type: 'deletion', attrs: { changeId: 'demo-del-4', createdAt: new Date().toISOString() } }],
        },
        {
          type: 'text',
          text: 'accelerating investment in AI-driven personalization',
          marks: [{ type: 'insertion', attrs: { changeId: 'demo-ins-4', createdAt: new Date().toISOString() } }],
        },
        { type: 'text', text: ' for the upcoming quarter.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Type anywhere to create ' },
        { type: 'text', text: 'green insertions', marks: [{ type: 'bold' }] },
        { type: 'text', text: '. Press Backspace or Delete on existing text to mark ' },
        { type: 'text', text: 'red deletions', marks: [{ type: 'bold' }] },
        { type: 'text', text: '. Hover any change to accept or reject it.' },
      ],
    },
  ],
}

/* ─── icons ─── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5 8.5 6 12 13.5 4.5" /></svg>
)
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" /></svg>
)
const BoldIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>)
const ItalicIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>)
const UnderlineIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>)
const UndoIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>)
const RedoIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" /></svg>)
const ListIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" /></svg>)
const PenIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>)

/* ─── Floating accept/reject menu ─── */
function TrackChangeMenu({ activeChange, onAccept, onReject, onKeepOpen, onClose }) {
  if (!activeChange) return null

  const label = activeChange.markName === 'insertion' ? 'Insertion' : 'Deletion'
  const isInsert = activeChange.markName === 'insertion'

  return (
    <div
      className="floating-menu"
      onMouseEnter={onKeepOpen}
      onMouseLeave={onClose}
    >
      <span className={`fm-badge ${isInsert ? 'fm-badge-ins' : 'fm-badge-del'}`}>
        {label}
      </span>
      <button className="fm-btn fm-accept" onClick={onAccept}>
        <CheckIcon /> Accept
      </button>
      <button className="fm-btn fm-reject" onClick={onReject}>
        <XIcon /> Reject
      </button>
    </div>
  )
}

/* ─── Sidebar Change Card ─── */
function ChangeCard({ change, onAccept, onReject, onHover, isActive }) {
  const isInsert = change.type === 'insertion'
  const timeStr = change.createdAt
    ? new Date(change.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div
      className={`change-card ${isInsert ? 'cc-insert' : 'cc-delete'} ${isActive ? 'cc-active' : ''}`}
      onMouseEnter={() => onHover(change.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="cc-header">
        <span className={`cc-dot ${isInsert ? 'cc-dot-insert' : 'cc-dot-delete'}`} />
        <span className="cc-type">{isInsert ? 'Insertion' : 'Deletion'}</span>
        {timeStr && <span className="cc-time">{timeStr}</span>}
      </div>
      <div className={`cc-text ${!isInsert ? 'cc-text-del' : ''}`}>
        {isInsert ? '+' : '−'} {change.text}
      </div>
      <div className="cc-actions">
        <button className="cc-btn cc-accept" onClick={() => onAccept(change)}>Accept</button>
        <button className="cc-btn cc-reject" onClick={() => onReject(change)}>Reject</button>
      </div>
    </div>
  )
}

/* ─── Toolbar Button ─── */
function ToolbarBtn({ icon, label, active, onClick, disabled }) {
  return (
    <button className={`tb-btn ${active ? 'tb-active' : ''}`} onClick={onClick} disabled={disabled} title={label}>
      {icon}
    </button>
  )
}

/* ─── Main Component ─── */
export default function TrackChangesEditor() {
  const [activeChange, setActiveChange] = useState(null)
  const [changes, setChanges] = useState([])
  const [hoveredCardId, setHoveredCardId] = useState(null)
  const [toast, setToast] = useState(null)
  const [showMarkup, setShowMarkup] = useState(true)
  const [menuPos, setMenuPos] = useState(null)
  const hoverTimeoutRef = useRef(null)
  const editorWrapRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      InsertionMark,
      DeletionMark,
      TrackChangesBehavior,
    ],
    content: sampleContent,
    editorProps: {
      attributes: { class: 'editor-content' },
    },
    onUpdate: () => refreshChanges(),
  })

  const refreshChanges = useCallback(() => {
    if (!editor) return
    setChanges(collectAllChanges(editor.state.doc))
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const timer = setTimeout(refreshChanges, 80)
    return () => clearTimeout(timer)
  }, [editor, refreshChanges])

  /* ─── Pointer-based hover (ported from reference) ─── */
  useEffect(() => {
    if (!editor) return

    const cancelHide = () => {
      window.clearTimeout(hoverTimeoutRef.current)
    }

    const scheduleHide = () => {
      cancelHide()
      hoverTimeoutRef.current = window.setTimeout(() => {
        setActiveChange(null)
        setMenuPos(null)
      }, 160)
    }

    const showChange = (changeId, markName, hoveredElement) => {
      const range = findChangeRange(editor.state.doc, changeId, markName)
      if (!range) return

      cancelHide()

      // Set the editor selection to the full change range
      editor.view.dispatch(
        editor.state.tr.setSelection(
          TextSelection.create(editor.state.doc, range.from, range.to),
        ),
      )

      setActiveChange({ changeId, markName, ...range })

      // Position the floating menu BELOW the hovered element (like MS Word)
      const editorRect = editorWrapRef.current?.getBoundingClientRect()
      if (hoveredElement && editorRect) {
        const spanRect = hoveredElement.getBoundingClientRect()
        setMenuPos({
          top: spanRect.bottom - editorRect.top + 8,
          left: spanRect.left - editorRect.left + spanRect.width / 2,
        })
      }
    }

    const handlePointerMove = (event) => {
      const target = event.target instanceof Element ? event.target : null
      if (!target) return

      // If hovering the floating menu itself, keep it open
      if (target.closest('.floating-menu')) {
        cancelHide()
        return
      }

      const trackedNode = target.closest('[data-change-id]')

      if (!trackedNode) {
        scheduleHide()
        return
      }

      const changeId = trackedNode.getAttribute('data-change-id')
      const markName = trackedNode.getAttribute('data-change-type')
      if (!changeId || !markName) return

      // Already showing this change — just reposition to follow the cursor
      if (activeChange?.changeId === changeId && activeChange?.markName === markName) {
        cancelHide()
        // Update position to follow which span element the cursor is on
        const editorRect = editorWrapRef.current?.getBoundingClientRect()
        if (editorRect) {
          const spanRect = trackedNode.getBoundingClientRect()
          setMenuPos({
            top: spanRect.bottom - editorRect.top + 8,
            left: spanRect.left - editorRect.left + spanRect.width / 2,
          })
        }
        return
      }

      showChange(changeId, markName, trackedNode)
    }

    const dom = editor.view.dom
    dom.addEventListener('pointermove', handlePointerMove)
    dom.addEventListener('pointerleave', scheduleHide)

    return () => {
      dom.removeEventListener('pointermove', handlePointerMove)
      dom.removeEventListener('pointerleave', scheduleHide)
      cancelHide()
    }
  }, [activeChange, editor])

  /* ─── Sidebar hover → highlight in editor ─── */
  useEffect(() => {
    if (!editor) return
    const el = editorWrapRef.current?.querySelector('.editor-content')
    if (!el) return
    el.querySelectorAll('.track-sidebar-hl').forEach(s => s.classList.remove('track-sidebar-hl'))
    if (hoveredCardId) {
      el.querySelectorAll(`[data-change-id="${hoveredCardId}"]`).forEach(s => s.classList.add('track-sidebar-hl'))
    }
  }, [hoveredCardId, editor])

  /* ─── Accept / Reject ─── */
  const clearActiveChange = useCallback(() => {
    window.clearTimeout(hoverTimeoutRef.current)
    setActiveChange(null)
    setMenuPos(null)
  }, [])

  const handleAction = useCallback((actionType, change) => {
    if (!editor) return

    const ch = change || activeChange
    if (!ch) return

    const markName = ch.markName || ch.type
    const changeId = ch.changeId || ch.id

    const range = findChangeRange(editor.state.doc, changeId, markName)
    if (!range) { clearActiveChange(); return }

    const markType = editor.state.schema.marks[markName]
    const shouldDeleteText =
      (markName === 'insertion' && actionType === 'reject') ||
      (markName === 'deletion' && actionType === 'accept')

    let transaction = editor.state.tr
    if (shouldDeleteText) {
      transaction = transaction.delete(range.from, range.to)
    } else {
      transaction = transaction.removeMark(range.from, range.to, markType)
    }

    editor.view.dispatch(transaction.scrollIntoView())
    clearActiveChange()
    setTimeout(refreshChanges, 50)
    showToast(`Change ${actionType}ed`)
  }, [editor, activeChange, clearActiveChange, refreshChanges, showToast])

  const acceptAll = useCallback(() => {
    if (!editor) return
    const allChanges = collectAllChanges(editor.state.doc)
    // Process in reverse order to maintain positions
    const sorted = [...allChanges].sort((a, b) => b.from - a.from)
    let tr = editor.state.tr
    for (const ch of sorted) {
      const range = findChangeRange(tr.doc, ch.id, ch.type)
      if (!range) continue
      const markType = editor.state.schema.marks[ch.type]
      if (ch.type === 'deletion') {
        tr = tr.delete(range.from, range.to)
      } else {
        tr = tr.removeMark(range.from, range.to, markType)
      }
    }
    editor.view.dispatch(tr.scrollIntoView())
    clearActiveChange()
    setTimeout(refreshChanges, 50)
    showToast('All changes accepted')
  }, [editor, clearActiveChange, refreshChanges, showToast])

  const rejectAll = useCallback(() => {
    if (!editor) return
    const allChanges = collectAllChanges(editor.state.doc)
    const sorted = [...allChanges].sort((a, b) => b.from - a.from)
    let tr = editor.state.tr
    for (const ch of sorted) {
      const range = findChangeRange(tr.doc, ch.id, ch.type)
      if (!range) continue
      const markType = editor.state.schema.marks[ch.type]
      if (ch.type === 'insertion') {
        tr = tr.delete(range.from, range.to)
      } else {
        tr = tr.removeMark(range.from, range.to, markType)
      }
    }
    editor.view.dispatch(tr.scrollIntoView())
    clearActiveChange()
    setTimeout(refreshChanges, 50)
    showToast('All changes rejected')
  }, [editor, clearActiveChange, refreshChanges, showToast])

  const changeCount = changes.length

  if (!editor) return null

  return (
    <div className="app-shell">
      {/* ─── Toolbar ─── */}
      <header className="toolbar">
        <div className="toolbar-left">
          <span className="app-logo"><PenIcon /></span>
          <span className="app-title">TrackEdit</span>
          <span className="app-badge">Tiptap</span>
        </div>
        <div className="toolbar-center">
          <div className="tb-group">
            <ToolbarBtn icon={<UndoIcon />} label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
            <ToolbarBtn icon={<RedoIcon />} label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
          </div>
          <div className="tb-divider" />
          <div className="tb-group">
            <ToolbarBtn icon={<BoldIcon />} label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolbarBtn icon={<ItalicIcon />} label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolbarBtn icon={<UnderlineIcon />} label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
          </div>
          <div className="tb-divider" />
          <div className="tb-group">
            <ToolbarBtn icon={<ListIcon />} label="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          </div>
        </div>
        <div className="toolbar-right">
          <button className={`markup-toggle ${showMarkup ? 'markup-on' : ''}`} onClick={() => setShowMarkup(!showMarkup)}>
            <span className="markup-dot" />
            {showMarkup ? 'Markup' : 'Final'}
          </button>
          {changeCount > 0 && <span className="change-count">{changeCount} change{changeCount !== 1 ? 's' : ''}</span>}
          {changeCount > 0 && showMarkup && (
            <>
              <button className="bulk-btn bulk-accept" onClick={acceptAll}>Accept All</button>
              <button className="bulk-btn bulk-reject" onClick={rejectAll}>Reject All</button>
            </>
          )}
        </div>
      </header>

      {/* ─── Status ─── */}
      <div className="status-bar">
        <span className="status-tracking">
          <span className="status-pulse" />
          All edits are tracked — type or delete to see it live
        </span>
      </div>

      {/* ─── Main ─── */}
      <div className="main-area">
        <div className={`editor-scroll ${!showMarkup ? 'hide-markup' : ''}`}>
          <div className="paper" ref={editorWrapRef}>
            <div className="paper-header">
              <span className="paper-dot" />
              Review Draft
            </div>
            <div style={{ position: 'relative' }}>
              <EditorContent editor={editor} />
              {/* Floating accept/reject menu */}
              {showMarkup && activeChange && menuPos && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${menuPos.top}px`,
                    left: `${menuPos.left}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                  }}
                >
                  <TrackChangeMenu
                    activeChange={activeChange}
                    onAccept={() => handleAction('accept')}
                    onReject={() => handleAction('reject')}
                    onKeepOpen={() => window.clearTimeout(hoverTimeoutRef.current)}
                    onClose={() => {
                      hoverTimeoutRef.current = window.setTimeout(() => {
                        setActiveChange(null)
                        setMenuPos(null)
                      }, 160)
                    }}
                  />
                </div>
              )}
            </div>
            {changeCount === 0 && (
              <div className="all-resolved">
                <span>✓</span> All changes have been resolved
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        {showMarkup && changeCount > 0 && (
          <aside className="sidebar">
            <div className="sidebar-title">Pending Changes ({changeCount})</div>
            {changes.map(c => (
              <ChangeCard
                key={c.id}
                change={c}
                onAccept={(ch) => handleAction('accept', ch)}
                onReject={(ch) => handleAction('reject', ch)}
                onHover={setHoveredCardId}
                isActive={hoveredCardId === c.id}
              />
            ))}
          </aside>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
