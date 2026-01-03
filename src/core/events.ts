import { EventEmitter } from "node:events";
import type { ToolActionInfo, TrustLevel } from "./types.js";

/**
 * Agent event definitions
 */
export interface AgentEvents {
  "tool:start": (message: string) => void;
  "tool:end": (summary: string) => void;
  "tool:action": (info: ToolActionInfo) => void;
  "tool:result": (result: string) => void;
  "thinking": (thought: string) => void;
  "trust:changed": (level: TrustLevel) => void;
  "backup:created": (filePath: string) => void;
  "backup:restored": (filePath: string) => void;
  "error": (error: Error) => void;
}

/**
 * Strongly-typed EventEmitter for agent events
 */
export class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof AgentEvents>(
    event: K,
    ...args: Parameters<AgentEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof AgentEvents>(
    event: K,
    listener: AgentEvents[K]
  ): this {
    return super.on(event, listener);
  }

  once<K extends keyof AgentEvents>(
    event: K,
    listener: AgentEvents[K]
  ): this {
    return super.once(event, listener);
  }

  off<K extends keyof AgentEvents>(
    event: K,
    listener: AgentEvents[K]
  ): this {
    return super.off(event, listener);
  }

  removeListener<K extends keyof AgentEvents>(
    event: K,
    listener: AgentEvents[K]
  ): this {
    return super.removeListener(event, listener);
  }

  removeAllListeners<K extends keyof AgentEvents>(event?: K): this {
    return super.removeAllListeners(event);
  }

  listeners<K extends keyof AgentEvents>(event: K): Function[] {
    return super.listeners(event);
  }

  listenerCount<K extends keyof AgentEvents>(event: K): number {
    return super.listenerCount(event);
  }
}

/**
 * Create a new typed event emitter instance
 */
export function createAgentEventEmitter(): TypedEventEmitter {
  return new TypedEventEmitter();
}
