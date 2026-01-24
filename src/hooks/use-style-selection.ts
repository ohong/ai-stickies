'use client'

import { useState, useCallback, useMemo } from 'react'

const MINUTES_PER_STYLE = 2

interface StyleSelectionState {
  selectedStyleIds: Set<string>
}

export function useStyleSelection() {
  const [state, setState] = useState<StyleSelectionState>({
    selectedStyleIds: new Set(),
  })

  const toggleStyle = useCallback((id: string) => {
    setState((prev) => {
      const newSet = new Set(prev.selectedStyleIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedStyleIds: newSet }
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setState({ selectedStyleIds: new Set(ids) })
  }, [])

  const clearSelection = useCallback(() => {
    setState({ selectedStyleIds: new Set() })
  }, [])

  const isSelected = useCallback(
    (id: string) => state.selectedStyleIds.has(id),
    [state.selectedStyleIds]
  )

  const selectedCount = useMemo(
    () => state.selectedStyleIds.size,
    [state.selectedStyleIds]
  )

  const estimatedTime = useMemo(
    () => selectedCount * MINUTES_PER_STYLE,
    [selectedCount]
  )

  const selectedStyleIds = useMemo(
    () => Array.from(state.selectedStyleIds),
    [state.selectedStyleIds]
  )

  const canProceed = selectedCount > 0 && selectedCount <= 5

  return {
    selectedStyleIds,
    selectedCount,
    estimatedTime,
    canProceed,
    toggleStyle,
    selectAll,
    clearSelection,
    isSelected,
  }
}
