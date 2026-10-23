"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  align?: "start" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DateRangePresetId =
  | "today"
  | "yesterday"
  | "last-7-days"
  | "last-week"
  | "last-30-days"
  | "this-month"
  | "last-month"
  | "custom";

export const DATE_RANGE_PRESETS: { id: DateRangePresetId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last-7-days", label: "Last 7 Days" },
  { id: "last-week", label: "Last Week" },
  { id: "last-30-days", label: "Last 30 Days" },
  { id: "this-month", label: "This Month" },
  { id: "last-month", label: "Last Month" },
  { id: "custom", label: "Custom Range" },
];

export function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfMondayWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

export function getPresetDateRange(preset: Exclude<DateRangePresetId, "custom">, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date;

  switch (preset) {
    case "today":
      start = today;
      end = today;
      break;
    case "yesterday":
      start = addDays(today, -1);
      end = start;
      break;
    case "last-7-days":
      start = addDays(today, -6);
      end = today;
      break;
    case "last-week": {
      const thisWeekStart = startOfMondayWeek(today);
      start = addDays(thisWeekStart, -7);
      end = addDays(thisWeekStart, -1);
      break;
    }
    case "last-30-days":
      start = addDays(today, -29);
      end = today;
      break;
    case "this-month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
      break;
    case "last-month":
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
  }

  return { startDate: formatDateValue(start), endDate: formatDateValue(end) };
}

interface DateRangePresetsProps {
  activePreset: DateRangePresetId | null;
  onSelect: (preset: Exclude<DateRangePresetId, "custom">) => void;
  onCustomRange: () => void;
}

export function DateRangePresets({ activePreset, onSelect, onCustomRange }: DateRangePresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) closeMenu();
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  const openMenu = useCallback((focusLast = false) => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      const activeIndex = DATE_RANGE_PRESETS.findIndex(({ id }) => id === activePreset);
      const index = activeIndex >= 0 ? activeIndex : focusLast ? DATE_RANGE_PRESETS.length - 1 : 0;
      optionRefs.current[index]?.focus();
    });
  }, [activePreset]);

  const selectPreset = (preset: DateRangePresetId) => {
    closeMenu(true);
    if (preset === "custom") onCustomRange();
    else onSelect(preset);
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % DATE_RANGE_PRESETS.length;
    else if (event.key === "ArrowUp") nextIndex = (index - 1 + DATE_RANGE_PRESETS.length) % DATE_RANGE_PRESETS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = DATE_RANGE_PRESETS.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPreset(DATE_RANGE_PRESETS[index].id);
    }

    if (nextIndex !== null) {
      event.preventDefault();
      optionRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div ref={dropdownRef} className="relative min-w-0 flex-1 sm:flex-none">
      <label className="sr-only" htmlFor="date-range-preset">
        Date Filter
      </label>
      <button
        ref={triggerRef}
        type="button"
        id="date-range-preset"
        aria-label="Date Filter"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowUp");
          }
        }}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[8px] border border-[#F2EDE8] bg-[#FFFCFA] px-3 text-left font-body text-sm font-semibold text-text-dark transition-colors hover:border-brand-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:w-[220px]"
      >
        <span>{DATE_RANGE_PRESETS.find(({ id }) => id === activePreset)?.label ?? "Date Filter"}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Date filter presets"
          className="absolute left-0 top-full z-50 mt-2 max-h-[min(20rem,calc(100dvh-2rem))] w-[min(220px,calc(100vw-2rem))] overflow-y-auto rounded-[12px] border border-[#F2EDE8] bg-white p-1.5 shadow-[0px_12px_32px_0px_rgba(32,36,39,0.14)] animate-[date-picker-popover_150ms_ease-out] motion-reduce:animate-none"
        >
          {DATE_RANGE_PRESETS.map(({ id, label }, index) => (
            <button
              key={id}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={activePreset === id}
              tabIndex={-1}
              onClick={() => selectPreset(id)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              className={`flex min-h-10 w-full items-center rounded-[8px] px-3 text-left font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary ${activePreset === id ? "bg-[#FFF5F2] font-semibold text-brand-primary" : "text-text-dark hover:bg-[#FAF6F3]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function parseDateValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return formatDateValue(date) === value ? date : null;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addMonthsKeepingDay(date: Date, amount: number): Date {
  const targetMonth = addMonths(date, amount);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
}

export function getCalendarDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function isDateInRange(date: Date, minDate?: string, maxDate?: string): boolean {
  const value = formatDateValue(date);
  return (!minDate || value >= minDate) && (!maxDate || value <= maxDate);
}

function clampToBounds(date: Date, minDate?: string, maxDate?: string): Date {
  const min = minDate ? parseDateValue(minDate) : null;
  const max = maxDate ? parseDateValue(maxDate) : null;
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function displayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 ${direction === "previous" ? "rotate-180" : ""}`}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  align = "start",
  open: controlledOpen,
  onOpenChange,
}: DatePickerProps) {
  const generatedId = useId();
  const pickerId = `date-picker-${generatedId}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [internalOpen, setInternalOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));
  const [focusedDate, setFocusedDate] = useState(() => new Date());
  const selectedDate = parseDateValue(value);
  const calendarDays = getCalendarDays(visibleMonth);
  const todayValue = formatDateValue(new Date());
  const previousMonthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 0);
  const nextMonthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  const canShowPreviousMonth = !minDate || formatDateValue(previousMonthEnd) >= minDate;
  const canShowNextMonth = !maxDate || formatDateValue(nextMonthStart) <= maxDate;
  const selectedLabel = selectedDate ? displayDate(selectedDate) : "Select date";
  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const setOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;
    const key = formatDateValue(focusedDate);
    dayButtonRefs.current.get(key)?.focus();
  }, [focusedDate, isOpen, visibleMonth]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpen]);

  const openPicker = () => {
    const triggerBounds = triggerRef.current?.getBoundingClientRect();
    if (triggerBounds) {
      const roomBelow = window.innerHeight - triggerBounds.bottom;
      setOpenAbove(roomBelow < 430 && triggerBounds.top > roomBelow);
    }
    const initialDate = clampToBounds(selectedDate ?? new Date(), minDate, maxDate);
    setFocusedDate(initialDate);
    setVisibleMonth(monthStart(initialDate));
    setOpen(true);
  };

  const selectDate = (date: Date) => {
    if (!isDateInRange(date, minDate, maxDate)) return;
    onChange(formatDateValue(date));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const changeMonth = (amount: number) => {
    const nextMonth = addMonths(visibleMonth, amount);
    const nextFocus = clampToBounds(addMonthsKeepingDay(focusedDate, amount), minDate, maxDate);
    setVisibleMonth(nextMonth);
    setFocusedDate(nextFocus);
  };

  const moveFocus = (date: Date) => {
    const nextFocus = clampToBounds(date, minDate, maxDate);
    setFocusedDate(nextFocus);
    setVisibleMonth(monthStart(nextFocus));
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let nextDate: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
        break;
      case "ArrowRight":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        break;
      case "ArrowUp":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
        break;
      case "ArrowDown":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
        break;
      case "Home":
        nextDate = clampToBounds(
          new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay()),
          minDate,
          maxDate
        );
        break;
      case "End":
        nextDate = clampToBounds(
          new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay())),
          minDate,
          maxDate
        );
        break;
      case "PageUp":
        nextDate = addMonthsKeepingDay(date, -1);
        break;
      case "PageDown":
        nextDate = addMonthsKeepingDay(date, 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    moveFocus(nextDate);
  };

  const clearDate = () => {
    onChange("");
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <span id={`${pickerId}-label`} className="mb-2 block font-body text-sm font-semibold text-text-muted">
        {label}
      </span>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-labelledby={`${pickerId}-label`}
          aria-describedby={`${pickerId}-value`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={`${pickerId}-calendar`}
          onClick={() => (isOpen ? setOpen(false) : openPicker())}
          className="flex min-h-11 w-full items-center gap-3 rounded-[8px] border border-[#F2EDE8] bg-[#FFFCFA] py-2.5 pl-3 pr-3 text-left font-body text-sm text-text-dark transition-colors hover:border-brand-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <span className="text-brand-primary"><CalendarIcon /></span>
          <span id={`${pickerId}-value`} className={`min-w-0 flex-1 truncate pr-8 ${selectedDate ? "font-medium" : "text-text-muted"}`}>
            {selectedLabel}
          </span>
        </button>
        {selectedDate && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={clearDate}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-[#F2EDE8] hover:text-text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id={`${pickerId}-calendar`}
          role="dialog"
          aria-label={`${label} calendar`}
          className={`absolute ${align === "end" ? "right-0" : "left-0"} ${openAbove ? "bottom-full mb-2" : "top-full mt-2"} z-50 max-h-[calc(100dvh-1rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-[14px] border border-[#F2EDE8] bg-white p-4 shadow-[0px_12px_32px_0px_rgba(32,36,39,0.14)] animate-[date-picker-popover_150ms_ease-out] motion-reduce:animate-none`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
              disabled={!canShowPreviousMonth}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-[#F2EDE8] text-text-muted transition-colors hover:border-brand-primary/40 hover:bg-[#FFF5F2] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#F2EDE8] disabled:hover:bg-white disabled:hover:text-text-muted"
            >
              <ChevronIcon direction="previous" />
            </button>
            <h2 aria-live="polite" className="text-center font-heading text-base font-bold text-text-dark">
              {monthLabel}
            </h2>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
              disabled={!canShowNextMonth}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-[#F2EDE8] text-text-muted transition-colors hover:border-brand-primary/40 hover:bg-[#FFF5F2] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#F2EDE8] disabled:hover:bg-white disabled:hover:text-text-muted"
            >
              <ChevronIcon direction="next" />
            </button>
          </div>

          <div role="grid" aria-label={monthLabel}>
            <div role="row" className="mb-1 grid grid-cols-7">
              {WEEKDAYS.map((weekday) => (
                <span
                  key={weekday}
                  role="columnheader"
                  aria-label={weekday}
                  className="flex h-9 items-center justify-center font-body text-xs font-semibold text-text-muted"
                >
                  {weekday.slice(0, 1)}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, week) => (
              <div key={week} role="row" className="grid grid-cols-7">
                {calendarDays.slice(week * 7, week * 7 + 7).map((date) => {
                  const dateValue = formatDateValue(date);
                  const isSelected = dateValue === value;
                  const isToday = dateValue === todayValue;
                  const isInVisibleMonth = date.getMonth() === visibleMonth.getMonth();
                  const isEnabled = isDateInRange(date, minDate, maxDate);

                    return (
                      <div key={dateValue} role="gridcell" className="flex h-11 items-center justify-center">
                        <button
                          ref={(element) => {
                            if (element) dayButtonRefs.current.set(dateValue, element);
                            else dayButtonRefs.current.delete(dateValue);
                          }}
                          type="button"
                          aria-label={date.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                          aria-pressed={isSelected}
                          aria-current={isToday ? "date" : undefined}
                          disabled={!isEnabled}
                          tabIndex={dateValue === formatDateValue(focusedDate) && isEnabled ? 0 : -1}
                          onClick={() => selectDate(date)}
                          onKeyDown={(event) => handleDayKeyDown(event, date)}
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-full font-body text-sm transition-colors",
                            isSelected
                              ? "bg-gradient-to-br from-[#D94A1E] to-[#FF9A3D] font-bold text-white shadow-sm"
                              : isToday
                                ? "border border-brand-primary bg-[#FFF5F2] font-bold text-brand-primary"
                                : `${isInVisibleMonth ? "text-text-dark" : "text-text-muted/60"} hover:bg-[#FFF5F2] hover:text-brand-primary`,
                            isEnabled
                              ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                              : "cursor-not-allowed opacity-35",
                          ].join(" ")}
                        >
                          {date.getDate()}
                        </button>
                      </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#F2EDE8] pt-3">
            <button
              type="button"
              onClick={clearDate}
              disabled={!value}
              className="rounded-md px-2 py-1.5 font-body text-sm font-medium text-text-muted transition-colors hover:bg-[#FAF6F3] hover:text-text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              disabled={!isDateInRange(new Date(), minDate, maxDate)}
              className="rounded-md px-2 py-1.5 font-body text-sm font-semibold text-brand-primary transition-colors hover:bg-[#FFF5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
