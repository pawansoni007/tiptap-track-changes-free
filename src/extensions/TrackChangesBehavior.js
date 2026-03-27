import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import {
  createChangeAttributes,
  findMarkAttributesNearRange,
  selectionContainsOnlyInsertion,
  selectionContainsDeletion,
  getDeleteRange,
} from '../utils/trackChangeUtils'

const TRACK_CHANGES_PLUGIN_KEY = new PluginKey('trackChangesBehavior')

/**
 * Insert text with an insertion mark applied.
 * If the cursor is adjacent to an existing insertion, the new text
 * inherits its changeId — this is how consecutive typing becomes
 * a single grouped change without any debouncing.
 */
const insertTrackedText = (view, from, to, text) => {
  const { state, dispatch } = view
  const insertionMark = state.schema.marks.insertion

  const inheritedAttributes =
    to === from
      ? findMarkAttributesNearRange(state, from, to, 'insertion')
      : null

  const attributes = inheritedAttributes ?? createChangeAttributes('insertion')

  let transaction = state.tr.insertText(text, from, to)
  transaction = transaction.addMark(
    from,
    from + text.length,
    insertionMark.create(attributes),
  )
  dispatch(transaction.scrollIntoView())
  return true
}

/**
 * Mark deletion instead of actually removing text.
 * If the cursor is adjacent to an existing deletion mark,
 * the new deletion inherits its changeId for grouping.
 */
const markDeletion = (view, direction) => {
  const { state, dispatch } = view
  const deletionMark = state.schema.marks.deletion
  const range = getDeleteRange(state, direction)

  if (!range || range.from === range.to) return false

  if (selectionContainsDeletion(state, range.from, range.to)) return true

  let transaction = state.tr

  if (selectionContainsOnlyInsertion(state, range.from, range.to)) {
    dispatch(transaction.delete(range.from, range.to).scrollIntoView())
    return true
  }

  const inheritedAttributes = findMarkAttributesNearRange(
    state,
    range.from,
    range.to,
    'deletion',
  )
  const attributes = inheritedAttributes ?? createChangeAttributes('deletion')

  transaction = transaction.addMark(
    range.from,
    range.to,
    deletionMark.create(attributes),
  )
  dispatch(transaction.scrollIntoView())
  return true
}

export const TrackChangesBehavior = Extension.create({
  name: 'trackChangesBehavior',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: TRACK_CHANGES_PLUGIN_KEY,
        props: {
          handleTextInput(view, from, to, text) {
            return insertTrackedText(view, from, to, text)
          },

          handlePaste(view, event) {
            const pastedText = event.clipboardData?.getData('text/plain')
            if (!pastedText) return false

            event.preventDefault()
            const { from, to } = view.state.selection
            return insertTrackedText(view, from, to, pastedText)
          },

          handleKeyDown(view, event) {
            if (event.key === 'Backspace') {
              event.preventDefault()
              return markDeletion(view, 'backward')
            }
            if (event.key === 'Delete') {
              event.preventDefault()
              return markDeletion(view, 'forward')
            }
            return false
          },
        },
      }),
    ]
  },
})
