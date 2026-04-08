import { StateManager } from './state.js';

describe('StateManager', () => {
  it('increments message count and triggers when threshold reached', () => {
    const state = new StateManager(3);
    expect(state.incrementAndCheck('session-1')).toBe(false);
    expect(state.incrementAndCheck('session-1')).toBe(false);
    expect(state.incrementAndCheck('session-1')).toBe(true);
    expect(state.incrementAndCheck('session-1')).toBe(false);
  });
});
