export class StateManager {
  private counts: Map<string, number> = new Map();
  private miningLocks: Map<string, boolean> = new Map();
  private threshold: number;

  constructor(threshold: number = 15) {
    this.threshold = threshold;
  }

  incrementAndCheck(sessionId: string): boolean {
    const current = this.counts.get(sessionId) || 0;
    const next = current + 1;

    if (next >= this.threshold) {
      this.counts.set(sessionId, 0);
      return true;
    }

    this.counts.set(sessionId, next);
    return false;
  }

  acquireMiningLock(sessionId: string): boolean {
    if (this.miningLocks.get(sessionId)) {
      return false;
    }
    this.miningLocks.set(sessionId, true);
    return true;
  }

  releaseMiningLock(sessionId: string): void {
    this.miningLocks.set(sessionId, false);
  }
}
