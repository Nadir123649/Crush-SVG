import 'server-only'

export interface SseController {
  enqueue(chunk: string): boolean
  close(): void
}

type ControllerSet = Set<SseController>

const subscribers = new Map<string, ControllerSet>()

export function subscribe(userId: string, controller: SseController): void {
  let set = subscribers.get(userId)
  if (!set) {
    set = new Set()
    subscribers.set(userId, set)
  }
  set.add(controller)
}

export function unsubscribe(userId: string, controller: SseController): void {
  const set = subscribers.get(userId)
  if (!set) return
  set.delete(controller)
  if (set.size === 0) subscribers.delete(userId)
}

export function publishLogout(userId: string): number {
  const set = subscribers.get(userId)
  if (!set) return 0
  const count = set.size
  for (const controller of set) {
    controller.enqueue('data: logout\n\n')
    controller.close()
  }
  subscribers.delete(userId)
  return count
}
