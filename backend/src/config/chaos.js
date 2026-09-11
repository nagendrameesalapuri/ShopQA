// In-memory "chaos" state for QA Helper endpoints (backend/src/routes/qa.js).
// Lets a tester turn artificial network conditions on/off against the real
// storefront endpoints instead of only hitting a standalone helper route —
// so Playwright can drive the actual UI and assert on loading states,
// retries, and error handling under controllable conditions.
const state = {
  latencyMs: 0, // artificial delay added to every request through chaosMiddleware
  errorRate: 0, // 0-1 probability of a request failing with `errorStatus`
  errorStatus: 500,
};

const getState = () => ({ ...state });

const configure = ({ latencyMs, errorRate, errorStatus }) => {
  if (latencyMs !== undefined) state.latencyMs = Math.max(0, Math.min(10000, Number(latencyMs) || 0));
  if (errorRate !== undefined) state.errorRate = Math.max(0, Math.min(1, Number(errorRate) || 0));
  if (errorStatus !== undefined) state.errorStatus = Number(errorStatus) || 500;
  return getState();
};

const reset = () => configure({ latencyMs: 0, errorRate: 0, errorStatus: 500 });

// Mount on any route that should be affected by chaos mode (kept opt-in per
// router rather than global, so auth/QA-control endpoints stay reliable).
const chaosMiddleware = async (req, res, next) => {
  if (state.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, state.latencyMs));
  }
  if (state.errorRate > 0 && Math.random() < state.errorRate) {
    return res.status(state.errorStatus).json({
      error: "Simulated chaos failure",
      code: "CHAOS_INJECTED",
    });
  }
  next();
};

module.exports = { getState, configure, reset, chaosMiddleware };
