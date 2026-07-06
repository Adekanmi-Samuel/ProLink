/**
 * Circuit Breaker
 *
 * Protects downstream services from cascading failures.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
 *
 * Features:
 * - Configurable failure threshold and timeout
 * - Half-open probe on timeout
 * - Event-driven state changes
 * - Request counting for accurate failure rate
 */
class CircuitBreaker {
  /**
   * @param {string} name - Service name for identification
   * @param {object} options
   * @param {number} options.failureThreshold - Failures before open (default: 5)
   * @param {number} options.successThreshold - Successes before close (default: 3)
   * @param {number} options.timeout - ms before half-open (default: 30000)
   * @param {number} options.volumeThreshold - Minimum requests before tripping (default: 10)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.state = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = null;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 3;
    this.timeout = options.timeout || 30000; // 30s
    this.volumeThreshold = options.volumeThreshold || 10;
    this.lastStateChange = Date.now();
    this.listeners = new Map();
  }

  /**
   * Execute a call through the circuit breaker
   * @param {function} fn - Async function to execute
   * @returns {Promise<*>} Result of fn
   * @throws {Error} CircuitBreakerOpenError if circuit is open
   */
  async call(fn) {
    this.totalRequests++;

    if (this.state === 'OPEN') {
      if (this._shouldAttemptReset()) {
        this._halfOpen();
      } else {
        const err = new Error(`Circuit breaker OPEN for ${this.name}`);
        err.code = 'ECIRCUIT_OPEN';
        throw err;
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      throw err;
    }
  }

  /**
   * Get current state and metrics
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      failureRate: this.totalRequests > 0
        ? (this.failureCount / this.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      timeSinceLastChange: Date.now() - this.lastStateChange,
    };
  }

  /**
   * Force reset circuit to closed
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    this._emit('reset');
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Called on success
   */
  _onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this._close();
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success (sliding window behavior)
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Called on failure
   */
  _onFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this._open(err);
    } else if (
      this.state === 'CLOSED' &&
      this.totalRequests >= this.volumeThreshold &&
      this.failureCount >= this.failureThreshold
    ) {
      this._open(err);
    }
  }

  /**
   * Transition to OPEN state
   */
  _open(err) {
    this.state = 'OPEN';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    this._emit('open', err);
  }

  /**
   * Transition to HALF_OPEN state
   */
  _halfOpen() {
    this.state = 'HALF_OPEN';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    this._emit('half_open');
  }

  /**
   * Transition to CLOSED state
   */
  _close() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    this._emit('close');
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  _shouldAttemptReset() {
    return Date.now() - this.lastStateChange >= this.timeout;
  }

  /**
   * Emit event to listeners
   */
  _emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[CircuitBreaker] Listener error:`, err);
      }
    });
  }
}

/**
 * Registry of circuit breakers
 */
class CircuitBreakerRegistry {
  constructor() {
    this._breakers = new Map();
  }

  /**
   * Get or create a circuit breaker for a service
   */
  get(name, options = {}) {
    if (!this._breakers.has(name)) {
      this._breakers.set(name, new CircuitBreaker(name, options));
    }
    return this._breakers.get(name);
  }

  /**
   * Get all breaker states
   */
  getAllStates() {
    const states = {};
    for (const [name, breaker] of this._breakers) {
      states[name] = breaker.getState();
    }
    return states;
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this._breakers.values()) {
      breaker.reset();
    }
  }
}

// Singleton registry
const circuitBreakerRegistry = new CircuitBreakerRegistry();

module.exports = { CircuitBreaker, CircuitBreakerRegistry, circuitBreakerRegistry };
