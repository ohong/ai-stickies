import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStyleSelection } from '@/src/hooks/use-style-selection'

describe('useStyleSelection', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useStyleSelection())

    expect(result.current.selectedStyleIds).toEqual([])
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.estimatedTime).toBe(0)
    expect(result.current.canProceed).toBe(false)
  })

  it('toggleStyle adds a style', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.toggleStyle('style-1')
    })

    expect(result.current.selectedStyleIds).toContain('style-1')
    expect(result.current.selectedCount).toBe(1)
  })

  it('toggleStyle removes a style when toggled again', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.toggleStyle('style-1')
    })

    expect(result.current.selectedCount).toBe(1)

    act(() => {
      result.current.toggleStyle('style-1')
    })

    expect(result.current.selectedStyleIds).not.toContain('style-1')
    expect(result.current.selectedCount).toBe(0)
  })

  it('toggleStyle adds and removes independently', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.toggleStyle('style-1')
      result.current.toggleStyle('style-2')
      result.current.toggleStyle('style-3')
    })

    expect(result.current.selectedCount).toBe(3)

    act(() => {
      result.current.toggleStyle('style-2')
    })

    expect(result.current.selectedCount).toBe(2)
    expect(result.current.selectedStyleIds).toContain('style-1')
    expect(result.current.selectedStyleIds).not.toContain('style-2')
    expect(result.current.selectedStyleIds).toContain('style-3')
  })

  it('selectAll selects multiple styles', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.selectAll(['style-a', 'style-b', 'style-c'])
    })

    expect(result.current.selectedCount).toBe(3)
    expect(result.current.selectedStyleIds).toContain('style-a')
    expect(result.current.selectedStyleIds).toContain('style-b')
    expect(result.current.selectedStyleIds).toContain('style-c')
  })

  it('selectAll replaces previous selection', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.toggleStyle('old-style')
    })

    expect(result.current.selectedCount).toBe(1)

    act(() => {
      result.current.selectAll(['new-1', 'new-2'])
    })

    expect(result.current.selectedCount).toBe(2)
    expect(result.current.selectedStyleIds).not.toContain('old-style')
    expect(result.current.selectedStyleIds).toContain('new-1')
    expect(result.current.selectedStyleIds).toContain('new-2')
  })

  it('clearSelection empties the set', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.selectAll(['style-1', 'style-2', 'style-3'])
    })

    expect(result.current.selectedCount).toBe(3)

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedStyleIds).toEqual([])
    expect(result.current.selectedCount).toBe(0)
  })

  it('isSelected returns correct boolean', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.toggleStyle('style-1')
    })

    expect(result.current.isSelected('style-1')).toBe(true)
    expect(result.current.isSelected('style-2')).toBe(false)
  })

  it('canProceed is false with 0 selected', () => {
    const { result } = renderHook(() => useStyleSelection())

    expect(result.current.canProceed).toBe(false)
  })

  it('canProceed is true with 1 selected', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.toggleStyle('style-1')
    })

    expect(result.current.canProceed).toBe(true)
  })

  it('canProceed is true with 5 selected', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.selectAll(['s1', 's2', 's3', 's4', 's5'])
    })

    expect(result.current.selectedCount).toBe(5)
    expect(result.current.canProceed).toBe(true)
  })

  it('canProceed is false with 6+ selected', () => {
    const { result } = renderHook(() => useStyleSelection())

    act(() => {
      result.current.selectAll(['s1', 's2', 's3', 's4', 's5', 's6'])
    })

    expect(result.current.selectedCount).toBe(6)
    expect(result.current.canProceed).toBe(false)
  })

  it('estimatedTime equals selectedCount * 2', () => {
    const { result } = renderHook(() => useStyleSelection())

    expect(result.current.estimatedTime).toBe(0)

    act(() => {
      result.current.toggleStyle('s1')
    })

    expect(result.current.estimatedTime).toBe(2)

    act(() => {
      result.current.selectAll(['s1', 's2', 's3'])
    })

    expect(result.current.estimatedTime).toBe(6)

    act(() => {
      result.current.selectAll(['s1', 's2', 's3', 's4', 's5'])
    })

    expect(result.current.estimatedTime).toBe(10)
  })
})
