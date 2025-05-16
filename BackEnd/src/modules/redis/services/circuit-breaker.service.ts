import { Injectable, Logger } from '@nestjs/common';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly states = new Map<string, CircuitBreakerState>();
  private readonly failureThreshold = 5; // Número de falhas para abrir o circuito
  private readonly resetTimeout = 30000; // 30 segundos para resetar o circuito
  
  canExecute(operationKey: string): boolean {
    const state = this.getState(operationKey);
    
    if (!state.isOpen) {
      return true;
    }

    const now = Date.now();
    if (now - state.lastFailure >= this.resetTimeout) {
      this.resetState(operationKey);
      return true;
    }

    return false;
  }

  recordSuccess(operationKey: string): void {
    this.resetState(operationKey);
  }

  recordFailure(operationKey: string, error: Error): boolean {
    const state = this.getState(operationKey);
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.failureThreshold) {
      state.isOpen = true;
      this.logger.warn(`Circuit breaker aberto para operação ${operationKey}: ${error.message}`);
      return true;
    }

    return false;
  }

  private getState(operationKey: string): CircuitBreakerState {
    if (!this.states.has(operationKey)) {
      this.states.set(operationKey, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      });
    }
    return this.states.get(operationKey)!;
  }

  private resetState(operationKey: string): void {
    this.states.set(operationKey, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    });
  }
}
