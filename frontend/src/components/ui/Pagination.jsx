"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

/**
 * Pagination — reusable numbered pagination bar.
 *
 * Props:
 *   page        {number}   — current page (1-based)
 *   pages       {number}   — total pages
 *   total       {number}   — total items (shown as "X résultats")
 *   limit       {number}   — items per page (optional, for display)
 *   onPageChange {fn}      — called with the new page number
 *   onLimitChange {fn}     — called with new limit (optional)
 *   limitOptions {number[]} — e.g. [12, 24, 48] (optional)
 *   className   {string}
 *
 * Shows up to 7 page buttons; collapses to ellipsis on larger ranges.
 * On mobile (< sm): shows only prev/next + current/total.
 */
export default function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions,
  className = "",
}) {
  if (!pages || pages <= 1) return null;

  // Build the page number array with ellipsis markers
  const buildPages = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

    const result = [];
    const SIBLINGS = 1; // pages shown either side of current

    const left  = Math.max(2,     page - SIBLINGS);
    const right = Math.min(pages - 1, page + SIBLINGS);

    result.push(1);
    if (left > 2) result.push("...");
    for (let i = left; i <= right; i++) result.push(i);
    if (right < pages - 1) result.push("...");
    result.push(pages);

    return result;
  };

  const pageItems = buildPages();

  const btn = (
    label,
    onClick,
    { disabled = false, active = false } = {}
  ) => {
    // Prev / Next — auto width to fit text + icon
    const isNavBtn = typeof label !== "number";
    return (
      <button
        key={String(label)}
        onClick={onClick}
        disabled={disabled}
        aria-current={active ? "page" : undefined}
        aria-label={typeof label === "number" ? `Page ${label}` : undefined}
        className={[
          "inline-flex items-center justify-center gap-1 rounded-lg text-[13px] font-[600] transition-all duration-150",
          "disabled:opacity-40 disabled:pointer-events-none",
          isNavBtn ? "h-9 px-3" : "w-9 h-9",
        ].join(" ")}
        style={{
          background: active ? "#4f8ef7" : "transparent",
          color:      active ? "#fff" : disabled ? "#6b7494" : "#b8bdd0",
          border:     active
            ? "1px solid #4f8ef7"
            : "1px solid rgba(255,255,255,0.08)",
        }}
        onMouseEnter={(e) => {
          if (!active && !disabled) {
            e.currentTarget.style.background = "rgba(79,142,247,0.10)";
            e.currentTarget.style.color = "#f0f2f8";
          }
        }}
        onMouseLeave={(e) => {
          if (!active && !disabled) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#b8bdd0";
          }
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>

      {/* ── Main pagination row ─────────────────────────── */}
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">

        {/* Prev */}
        {btn(
          <><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Précédent</span></>,
          () => onPageChange(page - 1),
          { disabled: page === 1 }
        )}

        {/* Page numbers — hidden on mobile, shown sm+ */}
        <div className="hidden sm:flex items-center gap-1">
          {pageItems.map((item, idx) =>
            item === "..."
              ? <span key={`e${idx}`} className="flex items-center justify-center w-9 h-9" style={{ color: "#6b7494" }} aria-hidden>
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              : btn(item, () => onPageChange(item), { active: item === page })
          )}
        </div>

        {/* Mobile: current / total */}
        <span
          className="sm:hidden flex items-center justify-center px-4 h-9 rounded-lg text-[13px] font-[600]"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#b8bdd0",
          }}
        >
          {page} / {pages}
        </span>

        {/* Next */}
        {btn(
          <><span className="hidden sm:inline">Suivant</span><ChevronRight className="h-4 w-4" /></>,
          () => onPageChange(page + 1),
          { disabled: page === pages }
        )}
      </div>

      {/* ── Footer: total count + per-page selector ──────── */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {total != null && (
          <p className="text-[12px]" style={{ color: "#6b7494" }}>
            {total} résultat{total !== 1 ? "s" : ""}
            {limit && pages > 1 && (
              <span> · page {page} sur {pages}</span>
            )}
          </p>
        )}
        {onLimitChange && limitOptions && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="Résultats par page"
            className="h-8 rounded-lg px-2 text-[12px]"
            style={{
              background: "#161921",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#b8bdd0",
              outline: "none",
            }}
          >
            {limitOptions.map((o) => (
              <option key={o} value={o}>{o} par page</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
