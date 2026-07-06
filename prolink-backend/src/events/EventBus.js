const EventEmitter = require('events');

/**
 * Enterprise Event Bus
 * 
 * Decouples services through event-driven architecture.
 * Supports:
 * - Pub/Sub with wildcard patterns
 * - Once listeners
 * - Async listeners with error isolation
 * - Event metrics
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this._listenerCounts = new Map();
  }

  /**
   * Publish an event to all subscribers
   */
  emit(event, data) {
    const count = super.listenerCount(event);
    if (count === 0) return false;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[EventBus] → ${event}`, { dataSize: JSON.stringify(data).length });
    }

    return super.emit(event, payload);
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name or pattern
   * @param {function} listener - Async or sync handler
   * @returns {function} Unsubscribe function
   */
  on(event, listener) {
    const wrappedListener = async (payload) => {
      try {
        await listener(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    };

    super.on(event, wrappedListener);
    this._trackListener(event);

    return () => super.off(event, wrappedListener);
  }

  /**
   * Subscribe to an event once
   */
  once(event, listener) {
    super.once(event, async (payload) => {
      try {
        await listener(payload);
      } catch (err) {
        console.error(`[EventBus] Error in once listener for "${event}":`, err);
      }
    });
    this._trackListener(event);
  }

  /**
   * Track listener counts for metrics
   */
  _trackListener(event) {
    const baseEvent = event.split(':')[0];
    this._listenerCounts.set(baseEvent, (this._listenerCounts.get(baseEvent) || 0) + 1);
  }

  /**
   * Get metrics about listeners
   */
  getMetrics() {
    return {
      totalListeners: super.listenerCount(''),
      byEvent: Object.fromEntries(this._listenerCounts),
      events: this.eventNames(),
    };
  }

  /**
   * Remove all listeners for an event
   */
  clearEvent(event) {
    super.removeAllListeners(event);
    this._listenerCounts.delete(event.split(':')[0]);
  }
}

// Singleton
const eventBus = new EventBus();

// Predefined events
eventBus.JOB_CREATED = 'job:created';
eventBus.JOB_UPDATED = 'job:updated';
eventBus.JOB_ASSIGNED = 'job:assigned';
eventBus.JOB_COMPLETED = 'job:completed';
eventBus.BID_PLACED = 'bid:placed';
eventBus.MESSAGE_SENT = 'message:sent';
eventBus.USER_REGISTERED = 'user:registered';
eventBus.USER_VERIFIED = 'user:verified';
eventBus.PAYMENT_PROCESSED = 'payment:processed';
eventBus.DISPUTE_OPENED = 'dispute:opened';
eventBus.DISPUTE_RESOLVED = 'dispute:resolved';
eventBus.REVIEW_SUBMITTED = 'review:submitted';
eventBus.CACHE_CLEARED = 'cache:cleared';

module.exports = eventBus;
