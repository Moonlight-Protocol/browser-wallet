type DrainRunner = (key: string) => Promise<void>;

type QueueOptions = {
  concurrencyLimit: number;
};

export class PrioritySyncQueue {
  private readonly concurrencyLimit: number;
  private readonly inFlight = new Set<string>();
  private readonly queuedPriority: string[] = [];
  private readonly queuedNormal: string[] = [];
  private active = 0;

  constructor(options: QueueOptions) {
    this.concurrencyLimit = options.concurrencyLimit;
  }

  isSyncing(key: string): boolean {
    return (
      this.inFlight.has(key) ||
      this.queuedPriority.includes(key) ||
      this.queuedNormal.includes(key)
    );
  }

  enqueue(key: string, priority: boolean) {
    if (this.inFlight.has(key)) return;

    // Upgrade from normal -> priority if needed.
    if (priority) {
      const idx = this.queuedNormal.indexOf(key);
      if (idx !== -1) this.queuedNormal.splice(idx, 1);
      if (!this.queuedPriority.includes(key)) this.queuedPriority.push(key);
      return;
    }

    if (this.queuedPriority.includes(key) || this.queuedNormal.includes(key)) {
      return;
    }
    this.queuedNormal.push(key);
  }

  drain(runner: DrainRunner) {
    while (this.active < this.concurrencyLimit) {
      const key = this.queuedPriority.shift() ?? this.queuedNormal.shift();
      if (!key) return;
      if (this.inFlight.has(key)) continue;

      this.inFlight.add(key);
      this.active += 1;

      runner(key)
        .catch(() => undefined)
        .finally(() => {
          this.inFlight.delete(key);
          this.active -= 1;
          this.drain(runner);
        });
    }
  }
}
