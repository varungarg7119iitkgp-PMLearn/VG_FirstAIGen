import { incrementSearchCount, getSearchCount } from "../lib/social/social-proof-store";

describe("social-proof-store", () => {
  it("increments and retrieves search counts per vibe", () => {
    const vibe = "romantic";

    const before = getSearchCount(vibe);
    incrementSearchCount(vibe);
    incrementSearchCount(vibe);

    const after = getSearchCount(vibe);

    expect(after).toBe(before + 2);
  });
});

