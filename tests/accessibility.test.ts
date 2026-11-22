import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cycleTab,
  parseTabNumberKey,
  isSearchHotkey,
  isHelpHotkey,
  isInputElement,
  SHORTCUTS_LIST,
  TAB_ORDER,
  type TabId,
} from '../src/lib/hotkeys'

test('cycleTab correctly navigates sequentially in both directions', () => {
  // Forward cycling
  assert.equal(cycleTab('overview', 'next'), 'layers')
  assert.equal(cycleTab('layers', 'next'), 'milestones')
  assert.equal(cycleTab('milestones', 'next'), 'projects')
  assert.equal(cycleTab('projects', 'next'), 'tree')
  assert.equal(cycleTab('tree', 'next'), 'overview')

  // Backward cycling
  assert.equal(cycleTab('overview', 'prev'), 'tree')
  assert.equal(cycleTab('tree', 'prev'), 'projects')
  assert.equal(cycleTab('projects', 'prev'), 'milestones')
  assert.equal(cycleTab('milestones', 'prev'), 'layers')
  assert.equal(cycleTab('layers', 'prev'), 'overview')

  // Fallback for unknown tab
  assert.equal(cycleTab('unknown' as TabId, 'next'), 'overview')
})

test('parseTabNumberKey maps 1-5 to valid tab IDs', () => {
  assert.equal(parseTabNumberKey('1'), 'overview')
  assert.equal(parseTabNumberKey('2'), 'layers')
  assert.equal(parseTabNumberKey('3'), 'milestones')
  assert.equal(parseTabNumberKey('4'), 'projects')
  assert.equal(parseTabNumberKey('5'), 'tree')
  assert.equal(parseTabNumberKey('0'), null)
  assert.equal(parseTabNumberKey('6'), null)
  assert.equal(parseTabNumberKey('k'), null)
})

test('isSearchHotkey detects Ctrl+K, Cmd+K, and slash appropriately', () => {
  // Ctrl+K
  assert.equal(isSearchHotkey({ key: 'k', ctrlKey: true }), true)
  assert.equal(isSearchHotkey({ key: 'K', ctrlKey: true }), true)

  // Cmd+K (metaKey)
  assert.equal(isSearchHotkey({ key: 'k', metaKey: true }), true)
  assert.equal(isSearchHotkey({ key: 'K', metaKey: true }), true)

  // Plain / outside input
  assert.equal(isSearchHotkey({ key: '/', target: null }), true)

  // Plain / inside input element should be ignored
  assert.equal(isSearchHotkey({ key: '/', target: { tagName: 'INPUT' } as unknown as EventTarget }), false)

  // Ignored keys
  assert.equal(isSearchHotkey({ key: 'k' }), false)
  assert.equal(isSearchHotkey({ key: 'x', ctrlKey: true }), false)
})

test('isHelpHotkey detects question mark key outside input elements', () => {
  assert.equal(isHelpHotkey({ key: '?', target: null }), true)
  assert.equal(isHelpHotkey({ key: '?', target: { tagName: 'TEXTAREA' } as unknown as EventTarget }), false)
  assert.equal(isHelpHotkey({ key: 'h', target: null }), false)
})

test('isInputElement identifies HTML input, textarea, select, and contentEditable safely', () => {
  // Null or undefined target
  assert.equal(isInputElement(null), false)
  assert.equal(isInputElement(undefined as unknown as EventTarget), false)

  // Plain element (div)
  const divElement = {
    tagName: 'DIV',
    isContentEditable: false,
  } as unknown as EventTarget
  assert.equal(isInputElement(divElement), false)

  // Input element
  const inputElement = {
    tagName: 'INPUT',
    isContentEditable: false,
  } as unknown as EventTarget
  assert.equal(isInputElement(inputElement), true)

  // Textarea element
  const textareaElement = {
    tagName: 'TEXTAREA',
    isContentEditable: false,
  } as unknown as EventTarget
  assert.equal(isInputElement(textareaElement), true)

  // Select element
  const selectElement = {
    tagName: 'SELECT',
    isContentEditable: false,
  } as unknown as EventTarget
  assert.equal(isInputElement(selectElement), true)

  // Contenteditable element
  const editableDiv = {
    tagName: 'DIV',
    isContentEditable: true,
  } as unknown as EventTarget
  assert.equal(isInputElement(editableDiv), true)
})

test('SHORTCUTS_LIST provides all required keyboard interactions', () => {
  assert.ok(SHORTCUTS_LIST.length >= 4, 'Should document at least 4 key shortcut groups')

  // Check navigation shortcuts exist
  const navShortcuts = SHORTCUTS_LIST.filter((s) => s.category === 'Navigation')
  assert.ok(navShortcuts.length > 0, 'Must have navigation shortcuts')

  // Check search & overlay shortcuts exist
  const searchShortcuts = SHORTCUTS_LIST.filter((s) => s.category === 'Search & Overlays')
  assert.ok(searchShortcuts.length > 0, 'Must have search/overlay shortcuts')
  assert.ok(searchShortcuts.some((s) => s.keys.includes('Esc')), 'Must include Escape key dismissal')
  assert.ok(searchShortcuts.some((s) => s.keys.includes('/')), 'Must include search slash hotkey')

  // Verify TAB_ORDER includes all 5 tabs
  assert.deepEqual(TAB_ORDER, ['overview', 'layers', 'milestones', 'projects', 'tree'])
})
