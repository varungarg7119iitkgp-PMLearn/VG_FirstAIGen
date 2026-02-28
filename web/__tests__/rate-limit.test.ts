import { isRateLimited } from "../lib/rate-limit";

describe("rate-limit", () => {
  it("allows a small number of requests per window and then blocks", () => {
    const key = "test-client";
    // First several calls should be allowed.
    for (let i = 0; i < 5; i += 1) {
      expect(isRateLimited(key)).toBe(false);
    }

    // Simulate many more calls to hit the limit.
    let limited = false;
    for (let i = 0; i < 40; i += 1) {
      if (isRateLimited(key)) {
        limited = true;
        break;
      }
    }

    expect(limited).toBe(true);
  });
});

