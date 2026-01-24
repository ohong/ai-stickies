import { observable } from '@legendapp/state'

export const sessionCounterState$ = observable({
  remaining: 10,
  total: 10,
  isLoading: false,
})