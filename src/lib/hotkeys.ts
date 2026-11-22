export type TabId = 'overview' | 'layers' | 'milestones' | 'projects' | 'tree'

export const TAB_ORDER: TabId[] = ['overview', 'layers', 'milestones', 'projects', 'tree']

export interface ShortcutDefinition {
  keys: string[]
  label: string
  description: string
  category: 'Navigation' | 'Search & Overlays' | 'Actions'
}

export const SHORTCUTS_LIST: ShortcutDefinition[] = [
  {
    keys: ['1', '2', '3', '4', '5'],
    label: '1 – 5',
    description: 'Switch between Overview (1), Layers (2), Milestones (3), Projects (4), and Network (5)',
    category: 'Navigation',
  },
  {
    keys: ['←', '→'],
    label: 'Arrow Left / Right',
    description: 'Navigate to previous or next tab view',
    category: 'Navigation',
  },
  {
    keys: ['/', 'Ctrl+K', '⌘K'],
    label: '/ or Ctrl+K / ⌘K',
    description: 'Open instant global search across all roadmap contents',
    category: 'Search & Overlays',
  },
  {
    keys: ['Esc'],
    label: 'Escape',
    description: 'Dismiss search palette, layer detail dialog, or shortcut modal',
    category: 'Search & Overlays',
  },
  {
    keys: ['?'],
    label: '?',
    description: 'Open keyboard shortcuts legend',
    category: 'Actions',
  },
]

/**
 * Determines whether a keyboard event originated from an editable form element
 * where normal single-character hotkeys (like 1-4, /, ?) should be ignored.
 * Safe across both browser and Node runtime environments.
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!target) {
    return false
  }

  const element = target as { tagName?: unknown; isContentEditable?: unknown }
  if (typeof element.tagName !== 'string') {
    return false
  }

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  if (Boolean(element.isContentEditable)) {
    return true
  }

  return false
}

/**
 * Returns the next or previous tab in circular order.
 */
export function cycleTab(current: TabId, direction: 'next' | 'prev'): TabId {
  const currentIndex = TAB_ORDER.indexOf(current)
  if (currentIndex === -1) return 'overview'

  const offset = direction === 'next' ? 1 : -1
  const nextIndex = (currentIndex + offset + TAB_ORDER.length) % TAB_ORDER.length
  return TAB_ORDER[nextIndex]
}

/**
 * Returns the matching tab if a number key 1-5 was pressed outside an input.
 */
export function parseTabNumberKey(key: string): TabId | null {
  switch (key) {
    case '1':
      return 'overview'
    case '2':
      return 'layers'
    case '3':
      return 'milestones'
    case '4':
      return 'projects'
    case '5':
      return 'tree'
    default:
      return null
  }
}

/**
 * Checks if the event matches the global search hotkey:
 * - Ctrl+K or Cmd+K
 * - '/' key when not focused in an input
 */
export function isSearchHotkey(e: { key: string; ctrlKey?: boolean; metaKey?: boolean; target?: EventTarget | null }): boolean {
  const isModifier = !!(e.ctrlKey || e.metaKey)
  const key = e.key.toLowerCase()

  if (isModifier && key === 'k') {
    return true
  }

  if (!isModifier && key === '/' && !isInputElement(e.target as EventTarget | null)) {
    return true
  }

  return false
}

/**
 * Checks if the event matches the help hotkey:
 * - '?' key when not focused in an input
 */
export function isHelpHotkey(e: { key: string; target?: EventTarget | null }): boolean {
  if (e.key === '?' && !isInputElement(e.target as EventTarget | null)) {
    return true
  }
  return false
}
