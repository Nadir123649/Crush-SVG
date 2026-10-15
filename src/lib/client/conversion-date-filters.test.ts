import assert from "node:assert/strict";
import test from "node:test";
import { clearConversionDateFilters } from "./conversion-date-filters";

test("clearing conversion date filters resets both dates and pagination while preserving status", () => {
  assert.deepEqual(
    clearConversionDateFilters({
      status: "success",
      startDate: "2026-10-01",
      endDate: "2026-10-14",
    }),
    {
      status: "success",
      startDate: "",
      endDate: "",
      page: 1,
    },
  );
});

test("clearing an already empty date range still returns page one without changing status", () => {
  assert.deepEqual(
    clearConversionDateFilters({
      status: "failed",
      startDate: "",
      endDate: "",
    }),
    {
      status: "failed",
      startDate: "",
      endDate: "",
      page: 1,
    },
  );
});
