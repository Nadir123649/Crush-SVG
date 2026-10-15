import assert from "node:assert/strict";
import test from "node:test";
import {
  DATE_RANGE_PRESETS,
  addMonths,
  formatDateValue,
  getCalendarDays,
  getPresetDateRange,
  isDateInRange,
  parseDateValue,
} from "./DatePicker";

test("date filter menu includes all supported preset options", () => {
  assert.deepEqual(
    DATE_RANGE_PRESETS.map(({ label }) => label),
    [
      "Today",
      "Yesterday",
      "Last 7 Days",
      "Last Week",
      "Last 30 Days",
      "This Month",
      "Last Month",
      "Custom Range",
    ],
  );
});

test("date picker parses and formats local ISO date values", () => {
  const date = parseDateValue("2024-02-29");

  assert.ok(date);
  assert.equal(formatDateValue(date), "2024-02-29");
  assert.equal(parseDateValue("2023-02-29"), null);
  assert.equal(parseDateValue("2024-2-09"), null);
});

test("calendar grid starts on Sunday and contains six full weeks", () => {
  const days = getCalendarDays(new Date(2024, 1, 1));

  assert.equal(days.length, 42);
  assert.equal(formatDateValue(days[0]), "2024-01-28");
  assert.equal(formatDateValue(days[32]), "2024-02-29");
  assert.equal(days[0].getDay(), 0);
});

test("month navigation crosses year boundaries", () => {
  const january = addMonths(new Date(2025, 0, 1), -1);
  const december = addMonths(new Date(2024, 11, 1), 1);

  assert.equal(formatDateValue(january), "2024-12-01");
  assert.equal(formatDateValue(december), "2025-01-01");
});

test("date range includes its boundaries and rejects dates outside them", () => {
  assert.equal(isDateInRange(new Date(2024, 4, 10), "2024-05-10", "2024-05-20"), true);
  assert.equal(isDateInRange(new Date(2024, 4, 20), "2024-05-10", "2024-05-20"), true);
  assert.equal(isDateInRange(new Date(2024, 4, 9), "2024-05-10", "2024-05-20"), false);
  assert.equal(isDateInRange(new Date(2024, 4, 21), "2024-05-10", "2024-05-20"), false);
});

test("rolling presets include the current local date and exact day counts", () => {
  const now = new Date(2024, 2, 10, 23, 45);

  assert.deepEqual(getPresetDateRange("today", now), {
    startDate: "2024-03-10",
    endDate: "2024-03-10",
  });
  assert.deepEqual(getPresetDateRange("yesterday", now), {
    startDate: "2024-03-09",
    endDate: "2024-03-09",
  });
  assert.deepEqual(getPresetDateRange("last-7-days", now), {
    startDate: "2024-03-04",
    endDate: "2024-03-10",
  });
  assert.deepEqual(getPresetDateRange("last-30-days", now), {
    startDate: "2024-02-10",
    endDate: "2024-03-10",
  });
});

test("calendar week preset uses the previous Monday through Sunday", () => {
  assert.deepEqual(getPresetDateRange("last-week", new Date(2024, 2, 10)), {
    startDate: "2024-02-26",
    endDate: "2024-03-03",
  });
  assert.deepEqual(getPresetDateRange("last-week", new Date(2024, 2, 11)), {
    startDate: "2024-03-04",
    endDate: "2024-03-10",
  });
});

test("month presets handle month and year boundaries using local dates", () => {
  assert.deepEqual(getPresetDateRange("this-month", new Date(2024, 2, 1, 23, 59)), {
    startDate: "2024-03-01",
    endDate: "2024-03-01",
  });
  assert.deepEqual(getPresetDateRange("last-month", new Date(2024, 2, 10)), {
    startDate: "2024-02-01",
    endDate: "2024-02-29",
  });
  assert.deepEqual(getPresetDateRange("last-month", new Date(2025, 0, 15)), {
    startDate: "2024-12-01",
    endDate: "2024-12-31",
  });
});
