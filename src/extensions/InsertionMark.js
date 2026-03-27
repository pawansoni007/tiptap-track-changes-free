import { Mark, mergeAttributes } from '@tiptap/core'

export const InsertionMark = Mark.create({
  name: 'insertion',
  inclusive: true,
  exitable: true,

  addAttributes() {
    return {
      changeId: { default: null },
      createdAt: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-change-type="insertion"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'tracked-change tracked-change--insertion',
        'data-change-id': HTMLAttributes.changeId,
        'data-change-type': 'insertion',
      }),
      0,
    ]
  },
})
