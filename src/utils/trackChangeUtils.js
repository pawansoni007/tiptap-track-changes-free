/*
 * trackChangeUtils.js
 * Core utility functions for the track-changes system.
 * Ported from the reference Emergent implementation.
 */

/**
 * Create attributes for a new tracked change.
 * If an existingId is passed, it will be reused (for adjacent-mark inheritance).
 */
export const createChangeAttributes = (changeType, existingId = null) => ({
  changeId:
    existingId ??
    `${changeType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
})

/**
 * Scan positions around a range to find an existing mark of `markName`
 * that can be extended. This is the KEY function that makes consecutive
 * typing share a single changeId — no debouncing needed.
 *
 * It probes up to 4 positions near the insertion/deletion point. If any
 * of them already carry a tracked mark of the same type, we inherit
 * its attrs (including its changeId).
 */
export const findMarkAttributesNearRange = (state, from, to, markName) => {
  const positions = [
    Math.max(1, from - 1),
    from,
    Math.max(1, to - 1),
    Math.min(state.doc.content.size, to + 1),
  ]

  for (const position of positions) {
    let attributes = null

    state.doc.nodesBetween(
      Math.max(1, position - 1),
      Math.min(state.doc.content.size, position + 1),
      (node, nodePosition) => {
        if (attributes || !node.isText) return

        const nodeEnd = nodePosition + node.nodeSize
        if (position < nodePosition || position > nodeEnd) return

        const mark = node.marks.find(
          (item) => item.type.name === markName && item.attrs.changeId,
        )
        if (mark) {
          attributes = mark.attrs
        }
      },
    )

    if (attributes) return attributes
  }

  return null
}

/**
 * Check whether every text node in [from, to) is purely an insertion.
 */
export const selectionContainsOnlyInsertion = (state, from, to) => {
  const insertionMark = state.schema.marks.insertion
  let hasText = false
  let onlyInsertion = true

  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText || !node.text) return
    hasText = true
    if (!insertionMark.isInSet(node.marks)) {
      onlyInsertion = false
    }
  })

  return hasText && onlyInsertion
}

/**
 * Check whether the range contains any deletion mark.
 */
export const selectionContainsDeletion = (state, from, to) => {
  const deletionMark = state.schema.marks.deletion
  let containsDeletion = false

  state.doc.nodesBetween(from, to, (node) => {
    if (containsDeletion || !node.isText) return
    if (deletionMark.isInSet(node.marks)) {
      containsDeletion = true
    }
  })

  return containsDeletion
}

/**
 * Resolve the actual range that should be deleted, given a direction.
 */
export const getDeleteRange = (state, direction) => {
  const { from, to, empty } = state.selection

  if (!empty) return { from, to }

  if (direction === 'backward') {
    return from <= 1 ? null : { from: from - 1, to: from }
  }

  return from >= state.doc.content.size ? null : { from, to: from + 1 }
}

/**
 * Walk the entire document to find the contiguous range of a change
 * identified by its changeId + markName.
 */
export const findChangeRange = (doc, changeId, markName) => {
  let from = null
  let to = null

  doc.descendants((node, position) => {
    if (!node.isText) return true

    const trackedMark = node.marks.find(
      (mark) => mark.type.name === markName && mark.attrs.changeId === changeId,
    )

    if (!trackedMark) return true

    from = from === null ? position : Math.min(from, position)
    to = Math.max(to ?? position, position + node.nodeSize)

    return true
  })

  return from === null || to === null ? null : { from, to }
}

/**
 * Find a tracked change at the current selection/cursor.
 */
export const getSelectedChange = (editor) => {
  if (!editor) return null

  const findTrackedMark = (marks = []) =>
    marks.find(
      (mark) =>
        ['insertion', 'deletion'].includes(mark.type.name) && mark.attrs.changeId,
    )

  const { from, to, empty, $from } = editor.state.selection

  if (empty) {
    const activeMark = findTrackedMark($from.marks())
    return activeMark
      ? { markName: activeMark.type.name, ...activeMark.attrs }
      : null
  }

  let selectedChange = null

  editor.state.doc.nodesBetween(from, to, (node) => {
    if (selectedChange || !node.isText) return

    const activeMark = findTrackedMark(node.marks)
    if (activeMark) {
      selectedChange = { markName: activeMark.type.name, ...activeMark.attrs }
    }
  })

  return selectedChange
}

/**
 * Collect all tracked changes from the document for the sidebar.
 */
export const collectAllChanges = (doc) => {
  const map = new Map()

  doc.descendants((node, pos) => {
    if (!node.isText) return

    for (const mark of node.marks) {
      if (mark.type.name !== 'insertion' && mark.type.name !== 'deletion') continue
      const id = mark.attrs.changeId
      if (!id) continue

      if (map.has(id)) {
        const existing = map.get(id)
        existing.text += node.text
        existing.to = pos + node.nodeSize
      } else {
        map.set(id, {
          id,
          type: mark.type.name,
          createdAt: mark.attrs.createdAt || '',
          text: node.text,
          from: pos,
          to: pos + node.nodeSize,
        })
      }
    }
  })

  return Array.from(map.values())
}
