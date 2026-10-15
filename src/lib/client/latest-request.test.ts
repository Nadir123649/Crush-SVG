import assert from "node:assert/strict";
import test from "node:test";
import { LatestRequestSequence } from "./latest-request";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("a delayed page request cannot overwrite newer date-filter results", async () => {
  for (const filterAction of ["change", "clear"] as const) {
    const sequence = new LatestRequestSequence();
    const state = {
      rows: [] as string[],
      total: 0,
      page: 1,
      loading: false,
    };
    const pageThree = deferred<{ rows: string[]; total: number; page: number }>();
    const filteredPageOne = deferred<{ rows: string[]; total: number; page: number }>();

    const applyRequest = async (
      requestId: number,
      response: Promise<{ rows: string[]; total: number; page: number }>,
    ) => {
      state.loading = true;
      try {
        const result = await response;
        if (!sequence.isCurrent(requestId)) return;
        state.rows = result.rows;
        state.total = result.total;
        state.page = result.page;
      } finally {
        if (sequence.isCurrent(requestId)) state.loading = false;
      }
    };

    const oldRequest = applyRequest(sequence.begin(), pageThree.promise);
    sequence.invalidate();
    const latestRequest = applyRequest(sequence.begin(), filteredPageOne.promise);

    pageThree.resolve({ rows: ["stale page 3"], total: 90, page: 3 });
    await oldRequest;
    assert.deepEqual(state, {
      rows: [],
      total: 0,
      page: 1,
      loading: true,
    }, `filter action "${filterAction}" keeps the latest request loading`);

    filteredPageOne.resolve({ rows: [`${filterAction} results`], total: 1, page: 1 });
    await latestRequest;
    assert.deepEqual(state, {
      rows: [`${filterAction} results`],
      total: 1,
      page: 1,
      loading: false,
    });
  }
});

test("invalidating a request prevents its completion from clearing current loading state", async () => {
  const sequence = new LatestRequestSequence();
  const pending = deferred<void>();
  const requestId = sequence.begin();
  let loading = true;

  sequence.invalidate();
  pending.resolve();
  await pending.promise;
  if (sequence.isCurrent(requestId)) loading = false;

  assert.equal(loading, true);
});
