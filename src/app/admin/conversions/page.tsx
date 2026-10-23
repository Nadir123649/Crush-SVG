"use client";

import { Button } from "@/components/ui/Button";
import { ExportButton } from "@/components/ui/ExportButton";
import { LocalTime } from "@/components/utils/LocalTime";
import { apiFetch, apiBlob, ApiError } from "@/lib/client/http";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/client/auth-context";
import { showToast } from "@/lib/client/toast-bridge";
import { getAdminCached, setAdminCached, getAdminInFlight, setAdminInFlight } from "@/lib/client/admin-cache";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { LatestRequestSequence } from "@/lib/client/latest-request";
import { clearConversionDateFilters } from "@/lib/client/conversion-date-filters";
import {
  DatePicker,
  DateRangePresets,
  getPresetDateRange,
  type DateRangePresetId,
} from "@/components/admin/DatePicker";

const CONVERSIONS_PAGE_SIZE = 15;
const DEFAULT_CONVERSIONS_CACHE_KEY = "admin_conversions_page=1&limit=15";

const SvgCheck = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const SvgError = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
const SvgArrowForward = (p: any) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default function ConversionsPage() {
  const { status: authStatus } = useAuth();
  const initialCached = getAdminCached<{
    data: any[];
    meta: { total: number; page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
  }>(DEFAULT_CONVERSIONS_CACHE_KEY, 120_000);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDatePreset, setActiveDatePreset] = useState<DateRangePresetId | null>(null);
  const [isCustomStartDateOpen, setIsCustomStartDateOpen] = useState(false);
  const [conversions, setConversions] = useState<any[]>(() => initialCached?.data || []);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(() => initialCached?.meta?.total_pages || 1);
  const [totalItems, setTotalItems] = useState<number>(() => initialCached?.meta?.total || 0);
  const [exporting, setExporting] = useState(false);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Record<string, true>>({});
  const requestSequence = useRef(new LatestRequestSequence());

  const buildQueryParams = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", targetPage.toString());
    params.set("limit", CONVERSIONS_PAGE_SIZE.toString());
    if (status !== "all") params.set("status", status);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return params.toString();
  };

  const loadConversions = async (targetPage = page, isCancelled?: () => boolean) => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showToast("warning", "Start date must be before end date.");
      return;
    }
    const requestId = requestSequence.current.begin();
    const queryParams = buildQueryParams(targetPage);
    const cacheKey = `admin_conversions_${queryParams}`;
    const cached = getAdminCached<{
      data: any[];
      meta: { total: number; page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
    }>(cacheKey, 120_000);

    if (cached && requestSequence.current.isCurrent(requestId)) {
      setConversions(cached.data);
      if (cached.meta) {
        setPage(cached.meta.page);
        setTotalPages(cached.meta.total_pages || 1);
        setTotalItems(cached.meta.total || 0);
      }
      setLoading(false);
    } else if (!cached) {
      setLoading(true);
    }
    if (requestSequence.current.isCurrent(requestId)) {
      setError(null);
    }

    try {
      let fetchPromise = getAdminInFlight<{
        data: any[];
        meta: { total: number; page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
      }>(cacheKey);

      if (!fetchPromise) {
        fetchPromise = apiFetch<{
          data: any[];
          meta: { total: number; page: number; per_page: number; total_pages: number; has_next: boolean; has_prev: boolean };
        }>(`/api/v1/admin/conversions?${queryParams}`);
        setAdminInFlight(cacheKey, fetchPromise);
      }

      const response = await fetchPromise;

      if (isCancelled?.() || !requestSequence.current.isCurrent(requestId)) return;
      if (response?.data) {
        const { data, meta } = response;
        setConversions(data);
        setAdminCached(cacheKey, response);
        if (meta) {
          setPage(meta.page);
          setTotalPages(meta.total_pages || 1);
          setTotalItems(meta.total || 0);
        }
      } else if (!cached) {
        setError("Failed to load conversions");
      }
    } catch (err) {
      if (isCancelled?.() || !requestSequence.current.isCurrent(requestId)) return;
      if (err instanceof ApiError && err.status === 400) {
        showToast("error", "Invalid date range.");
      }
      if (!cached && !error) setError("Failed to load conversions");
    } finally {
      if (!isCancelled?.() && requestSequence.current.isCurrent(requestId)) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const currentRequestSequence = requestSequence.current;
    if (authStatus === "authed") {
      loadConversions(page, () => cancelled);
    }
    return () => {
      cancelled = true;
      currentRequestSequence.invalidate();
    };
  }, [authStatus, status, startDate, endDate]);

  const handlePageChange = (targetPage: number) => {
    requestSequence.current.invalidate();
    setPage(targetPage);
    loadConversions(targetPage);
  };

  const handleStartDateChange = (value: string) => {
    if (value && endDate && value > endDate) {
      showToast("warning", "Start date must be on or before the end date.");
      return;
    }
    if (value !== startDate) requestSequence.current.invalidate();
    setStartDate(value);
    setActiveDatePreset("custom");
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    if (value && startDate && value < startDate) {
      showToast("warning", "End date must be on or after the start date.");
      return;
    }
    if (value !== endDate) requestSequence.current.invalidate();
    setEndDate(value);
    setActiveDatePreset("custom");
    setPage(1);
  };

  const handleDatePresetSelect = (preset: Exclude<DateRangePresetId, "custom">) => {
    const range = getPresetDateRange(preset, new Date());
    if (range.startDate !== startDate || range.endDate !== endDate) {
      requestSequence.current.invalidate();
    }
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setActiveDatePreset(preset);
    setIsCustomStartDateOpen(false);
    setPage(1);
  };

  const openCustomDateRange = () => {
    setActiveDatePreset("custom");
    setIsCustomStartDateOpen(true);
  };

  const handleClearDateFilter = () => {
    requestSequence.current.invalidate();
    const clearedFilters = clearConversionDateFilters({ status, startDate, endDate });
    setStartDate(clearedFilters.startDate);
    setEndDate(clearedFilters.endDate);
    setPage(clearedFilters.page);
    setActiveDatePreset(null);
    setIsCustomStartDateOpen(false);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const queryParams = new URLSearchParams();
      if (status !== "all") queryParams.set("status", status);
      if (startDate) queryParams.set("startDate", startDate);
      if (endDate) queryParams.set("endDate", endDate);

      const blob = await apiBlob(`/api/v1/admin/conversions/export?${queryParams.toString()}`);
      const filename = `conversions-export-${new Date().toISOString().split('T')[0]}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("success", "Conversions report exported successfully!", { id: "export-conversions" });
    } catch (err: any) {
      const msg = err?.message || "Failed to export conversions";
      setError(msg);
      showToast("error", msg, { id: "export-conversions" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-dark mb-2">Conversion Logs</h2>
          <p className="font-body text-text-muted">Review and manage all file processing activity across the platform.</p>
        </div>
        {/* Primary Action */}
        <ExportButton onClick={handleExportCSV} disabled={loading || exporting} className="w-[130px]" />
      </div>

      {/* Interactive Filters Area (Client-side controlled) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-20">
        {/* Date Range Filter */}
        <div className="md:col-span-8 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <DateRangePresets
              activePreset={activeDatePreset}
              onSelect={handleDatePresetSelect}
              onCustomRange={openCustomDateRange}
            />
            <button
              type="button"
              onClick={handleClearDateFilter}
              disabled={!startDate && !endDate}
              className="min-h-9 shrink-0 whitespace-nowrap rounded-lg border border-[#F2EDE8] bg-[#FFFCFA] px-3 font-body text-xs font-semibold text-text-muted transition-colors hover:border-brand-primary/40 hover:bg-[#FFF5F2] hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#F2EDE8] disabled:hover:bg-[#FFFCFA] disabled:hover:text-text-muted"
            >
              Clear
            </button>
          </div>
          <div className="flex w-full flex-col items-start gap-4 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                maxDate={endDate || undefined}
                open={isCustomStartDateOpen}
                onOpenChange={setIsCustomStartDateOpen}
              />
            </div>
            <div className="w-full sm:w-1/2">
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                minDate={startDate || undefined}
                align="end"
              />
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-4 bg-white border border-[#F2EDE8] rounded-[12px] p-6 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] flex flex-col justify-end gap-2">
          <label className="font-body font-semibold text-sm text-text-muted">Status</label>
          <div className="flex gap-3">
            <select 
              value={status}
              onChange={(e) => {
                if (e.target.value !== status) requestSequence.current.invalidate();
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full pl-3 pr-8 py-2.5 bg-[#FFFCFA] border border-[#F2EDE8] rounded-[8px] focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 font-body text-text-dark transition-all outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23353A3E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem top 50%', backgroundSize: '0.65rem auto' }}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <section className="bg-white border border-[#F2EDE8] rounded-[12px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
        {loading && (
          <AdminLoader message="Loading conversions..." className="min-h-[350px]" />
        )}

        {error && (
          <div className="p-8 text-center">
            <SvgError className="w-12 h-12 mb-3 mx-auto text-red-500" />
            <span className="font-body text-text-dark">{error}</span>
            <Button variant="outline" onClick={() => loadConversions(page)} className="mt-4">Retry</Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto brand-scrollbar">
              <table className="w-full text-left border-collapse">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-[#F2EDE8] bg-[#FFFCFA]">
                    <th scope="col" className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">File ID</th>
                    <th scope="col" className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">User</th>
                    <th scope="col" className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">Format</th>
                    <th scope="col" className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">File Size</th>
                    <th scope="col" className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap">Status</th>
                    <th scope="col" className="font-body font-semibold text-sm text-text-muted py-4 px-6 whitespace-nowrap text-right">Timestamp</th>
                  </tr>
                </thead>
                {/* Table Body */}
                <tbody className="divide-y divide-[#F2EDE8]">
                  {conversions.map((conv: any) => (
                    <tr key={conv._id.toString()} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 px-6 font-body text-sm text-text-dark font-medium truncate max-w-[150px]">
                        #{conv._id.toString().slice(-6).toUpperCase()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-sm text-brand-primary overflow-hidden border border-[#F2EDE8]">
                            {conv.userId?.photoURL && !failedPhotoUrls[conv.userId.photoURL] ? (
                              <img
                                src={conv.userId.photoURL}
                                alt="User"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={() => {
                                  const failed = conv.userId.photoURL as string;
                                  setFailedPhotoUrls((prev) => (prev[failed] ? prev : { ...prev, [failed]: true }));
                                }}
                              />
                            ) : (
                              (conv.userId?.displayName?.[0] || conv.userId?.email?.[0] || "G").toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-body text-sm text-text-dark font-medium">
                              {conv.userId?.displayName || 'Guest User'}
                            </span>
                            <span className="font-body text-[12px] text-text-muted">
                              {conv.userId?.email || conv.guestId || 'Anonymous'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-body text-sm text-text-dark">
                          <span className="bg-[#FFFCFA] border border-[#F2EDE8] px-2 py-1 rounded-[6px] text-text-muted font-mono text-[12px] uppercase">
                            {conv.inputFormat}
                          </span>
                          <SvgArrowForward className="w-4 h-4 text-gray-400" />
                          <span className="bg-[#FFFCFA] border border-[#F2EDE8] px-2 py-1 rounded-[6px] text-text-muted font-mono text-[12px] uppercase">
                            {conv.outputFormat}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-body text-sm text-text-muted">
                        {conv.originalSize != null ? `${(conv.originalSize / 1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="py-4 px-6">
                        {conv.success ? (
                          <div className="inline-flex items-center gap-1.5 bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#059669]/20">
                            <SvgCheck className="w-3.5 h-3.5 text-[#059669]" />
                            <span className="font-body font-semibold text-xs text-[#059669]">Success</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            <SvgError className="w-3.5 h-3.5 text-red-600" />
                            <span className="font-body font-semibold text-xs text-red-600">Failed</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-body text-sm text-text-muted">
                        <LocalTime date={conv.createdAt} format="long" />
                      </td>
                    </tr>
                  ))}
                  {conversions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                        No conversions found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalItems > 0 && (
              <div className="bg-[#FFFCFA] border-t border-[#F2EDE8] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-body text-sm text-text-muted">
                  Showing {((page - 1) * CONVERSIONS_PAGE_SIZE) + 1} to {Math.min(page * CONVERSIONS_PAGE_SIZE, totalItems)} of {totalItems} entries
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  
                  {/* Current page display */}
                  <div className="flex items-center px-2 font-body font-bold text-brand-primary text-sm">
                    {page} / {totalPages}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className={`px-3 py-1.5 border border-[#F2EDE8] rounded-[6px] hover:bg-gradient-to-r hover:from-[#D94A1E] hover:to-[#FF9A3D] hover:text-white transition-all duration-300 text-text-dark font-body font-medium text-sm ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
