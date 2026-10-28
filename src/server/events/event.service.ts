import { ProgressEvent, Snapshot } from '@/types/resume-sprint';
import { ProgressEventRepository } from '@/server/persistence/repository';

type Listener = (event: ProgressEvent) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  public subscribe(sessionId: string, listener: Listener): () => void {
    let set = this.listeners.get(sessionId);
    if (!set) {
      set = new Set();
      this.listeners.set(sessionId, set);
    }
    set.add(listener);

    return () => {
      const currentSet = this.listeners.get(sessionId);
      if (currentSet) {
        currentSet.delete(listener);
        if (currentSet.size === 0) {
          this.listeners.delete(sessionId);
        }
      }
    };
  }

  public emit(event: ProgressEvent): void {
    const set = this.listeners.get(event.sessionId);
    if (set) {
      for (const listener of set) {
        try {
          listener(event);
        } catch (err) {
          console.error('[EventBus] Listener dispatch error:', err);
        }
      }
    }
  }
}

export const eventBus = new EventBus();

export class EventService {
  public static async recordAndEmit(params: {
    sessionId: string;
    operationId: string;
    stage: 'SAVING' | 'VALIDATING' | 'ESTIMATING' | 'SCORING' | 'READY' | 'FAILED';
    snapshot: Snapshot;
    errorCode?: string;
  }): Promise<ProgressEvent> {
    const existingEvents = await ProgressEventRepository.listBySession(params.sessionId);
    const sequence = existingEvents.length + 1;

    const event: ProgressEvent = {
      id: `evt_${Date.now()}_${sequence}`,
      sessionId: params.sessionId,
      operationId: params.operationId,
      sequence,
      snapshot: params.snapshot,
      stage: params.stage,
      errorCode: params.errorCode,
    };

    await ProgressEventRepository.append(event);
    eventBus.emit(event);
    return event;
  }

  public static async getEventsForReplay(sessionId: string, lastEventId?: string): Promise<ProgressEvent[]> {
    const all = await ProgressEventRepository.listBySession(sessionId);
    if (!lastEventId) {
      return all;
    }

    const lastIdx = all.findIndex((e) => e.id === lastEventId);
    if (lastIdx === -1) {
      return all;
    }
    return all.slice(lastIdx + 1);
  }
}
