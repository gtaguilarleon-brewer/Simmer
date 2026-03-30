"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "../components/Nav";
import { useMealPlan } from "../hooks/useMealPlan";
import { useGroceryList } from "../hooks/useGroceryList";
import { useRecipes } from "../hooks/useRecipes";
import { useEssentials, useNiceToHaves, useEasyMeals, usePantryStaples } from "../hooks/useSettings";
import { t, inputBase, labelBase, btnPrimary, btnSecondary, selectBase } from "../lib/theme";
import { CATEGORY_KEYWORDS, detectCategory } from "../lib/categories";
import { supabase } from "../lib/supabase";

// ─── Constants ───
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ALL_SECTIONS = [...ALL_DAYS, "Batch Breakfast", "Toddler Snacks"];
const PROTEIN_OPTIONS = ["Chicken", "Beef", "Pork", "Salmon", "Shrimp", "Tofu", "Lamb", "Turkey", "Vegetarian", "Other"];
const CUISINE_OPTIONS = ["American", "Asian", "Chinese", "French", "Greek", "Indian", "Italian", "Japanese", "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Thai", "Other"];
const MEAL_TYPE_OPTIONS = ["Breakfast", "Dinner", "Dessert", "Snack/Side", "Drink"];

// Helper to capitalize first letter of each word for display
function capitalize(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Safe domain extraction from URL
function getDomain(url) {
  if (!url) return '';
  try { return new URL(url).hostname; } catch { return url.split('/')[2] || url; }
}

const CONTEXT_LABELS = {
  "busy": { label: "Quick night", color: t.accent, bg: t.accentDim },
  "just-me-out": { label: "Only one parent home", color: t.accent, bg: t.accentDim },
  "not-home": { label: "Not home", color: t.accent, bg: t.accentDim },
};



// ─── Icons ───
function ChevronIcon({ dir }) {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke={t.subtle} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.5" fill={t.subtle} />
      <circle cx="12" cy="12" r="1.5" fill={t.subtle} />
      <circle cx="12" cy="19" r="1.5" fill={t.subtle} />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16">
      <circle cx="2.5" cy="2" r="1.5" fill={t.dim} />
      <circle cx="7.5" cy="2" r="1.5" fill={t.dim} />
      <circle cx="2.5" cy="8" r="1.5" fill={t.dim} />
      <circle cx="7.5" cy="8" r="1.5" fill={t.dim} />
      <circle cx="2.5" cy="14" r="1.5" fill={t.dim} />
      <circle cx="7.5" cy="14" r="1.5" fill={t.dim} />
    </svg>
  );
}

// ─── Protein Icons ───
const PROTEIN_COLORS = {
  Chicken: "#f0c040", Beef: "#c0564b", Pork: "#d4935a", Salmon: "#e88070", Shrimp: "#f4845f",
  Tofu: "#81c784", Vegetarian: "#81c784", Eggs: "#f0c040", Turkey: "#d4935a",
};

function IconChicken({ size = 24 }) {
  const c = "#f0c040";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 6c-2 0-3.5 1-4 3-1 4 1 6 3 8l-3 7h2l2-5c1 1 3 1 4 0l2 5h2l-3-7c2-2 4-4 3-8-.5-2-2-3-4-3z" fill={`${c}18`} stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 24h8" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14.5" cy="9.5" r="0.8" fill={c} />
    </svg>
  );
}

function IconBeef({ size = 24 }) {
  const c = "#c0564b";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 14c0-3 2-6 5-7 2-0.5 4.5-0.5 6.5 0 3 1 5 4 5 7 0 4-3 8-8.5 8S8 18 8 14z" fill={`${c}15`} stroke={c} strokeWidth="1.5" />
      <path d="M12 13c1-1 3-1.5 5-1" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M11 16c1.5 1 4 1.5 6.5 0.5" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M22 10l2-3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconFish({ size = 24 }) {
  const c = "#e88070";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M6 16c3-5 8-7 14-6 2 0.5 4 2 5 4-1 2-3 3.5-5 4-6 1-11-1-14-6z" fill={`${c}15`} stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 12l3 4-3 4" fill={`${c}15`} stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="22" cy="14" r="1" fill={c} />
      <path d="M12 14v4M15 13v5" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function IconShrimp({ size = 24 }) {
  const c = "#f4845f";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M22 8c-2-1-5-1-7 1-3 3-3 7-1 10l4 4" fill={`${c}15`} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 23c1 1 3 1 4-1l2-4" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 8c1-1 2-1 3 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="10" r="0.8" fill={c} />
    </svg>
  );
}

function IconTofu({ size = 24 }) {
  const c = "#81c784";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="7" y="10" width="18" height="14" rx="2" fill={`${c}15`} stroke={c} strokeWidth="1.5" />
      <line x1="7" y1="17" x2="25" y2="17" stroke={c} strokeWidth="1" opacity="0.35" />
      <line x1="16" y1="10" x2="16" y2="24" stroke={c} strokeWidth="1" opacity="0.35" />
      <path d="M10 7c1 1 2 2 2 3M20 7c-1 1-2 2-2 3" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function IconPlate({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="20" rx="12" ry="5" fill={t.accentDim} stroke={t.accent} strokeWidth="1.5" />
      <path d="M6 18c1-5 5-9 10-9s9 4 10 9" fill={t.accentDim} stroke={t.accent} strokeWidth="1.5" />
      <path d="M14 14c0-2 1-3 2-4" stroke={t.accent} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M17 13c0-1.5 0.5-2.5 1.5-3.5" stroke={t.accent} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function IconBreakfast({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="14" height="10" rx="2" stroke={t.muted} strokeWidth="1.5" />
      <path d="M17 12c2 0 4 1 4 3s-2 3-4 3" stroke={t.muted} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="10" cy="15" rx="3" ry="2" fill={t.accentDim} />
      <path d="M8 7c0-2 1-3 2-4" stroke={t.accent} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M11 8c0-1.5 0.5-2.5 1-3" stroke={t.accent} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function IconSnack({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="7" stroke={t.muted} strokeWidth="1.5" />
      <circle cx="9.5" cy="12" r="1.2" fill={t.accentDim} stroke={t.accent} strokeWidth="0.8" />
      <circle cx="14" cy="11" r="1" fill={t.accentDim} stroke={t.accent} strokeWidth="0.8" />
      <circle cx="12" cy="15.5" r="1" fill={t.accentDim} stroke={t.accent} strokeWidth="0.8" />
      <path d="M8 8l-1-2M16 8l1-2" stroke={t.muted} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

const PROTEIN_ICONS = {
  Chicken: IconChicken, Beef: IconBeef, Salmon: IconFish, Shrimp: IconShrimp,
  Tofu: IconTofu, Vegetarian: IconTofu, Eggs: IconChicken, Pork: IconChicken, Turkey: IconChicken,
};

const SECTION_ICONS = {
  "Batch Breakfast": IconBreakfast,
  "Toddler Snacks": IconSnack,
};

// ─── Illustrations ───
function EmptyBowlIllustration({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="22" ry="7" stroke={t.dim} strokeWidth="1.5" />
      <path d="M12 38c2-10 10-18 20-18s18 8 20 18" stroke={t.dim} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 38h44" stroke={t.dim} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 38c1-3 4-5 8-5s7 2 8 5" fill={t.accentDim} stroke={t.accent} strokeWidth="1" strokeLinecap="round" />
      <path d="M26 28l-1-6" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M32 26v-7" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M38 28l1-6" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function CookingPotIllustration({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <ellipse cx="40" cy="64" rx="24" ry="5" stroke={t.dim} strokeWidth="1" opacity="0.3" />
      <rect x="16" y="36" width="48" height="26" rx="6" stroke={t.muted} strokeWidth="1.5" />
      <rect x="14" y="33" width="52" height="6" rx="3" stroke={t.muted} strokeWidth="1.5" />
      <circle cx="40" cy="49" r="5" fill={t.accentDim} stroke={t.accent} strokeWidth="1" />
      <path d="M10 36h4M66 36h4" stroke={t.muted} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 24c0-3 1-6 0-9" stroke={t.muted} strokeWidth="1.2" strokeLinecap="round" opacity="0.35">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M40 22c0-3 1-6 0-9" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
      </path>
      <path d="M50 24c0-3 1-6 0-9" stroke={t.muted} strokeWidth="1.2" strokeLinecap="round" opacity="0.3">
        <animate attributeName="opacity" values="0.15;0.45;0.15" dur="3.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

// ─── Shared Components ───
function StepProgress({ currentStep, totalSteps, stepLabels }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: t.accent, fontFamily: t.sans, textTransform: "uppercase", letterSpacing: "0.08em" }}>Step {currentStep + 1} of {totalSteps + 1}</span>
        <span style={{ fontSize: 12, color: t.dim, fontFamily: t.sans }}>{stepLabels[currentStep]}</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: totalSteps + 1 }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= currentStep ? t.accent : t.border, transition: "background 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: t.serif, fontSize: 22, color: t.text, margin: "0 0 4px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: t.subtle, margin: 0, fontFamily: t.sans, lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

function StepNav({ onBack, onNext, onSaveExit, nextLabel = "Continue", nextDisabled = false, showBack = true }) {
  return (
    <div style={{ display: "flex", justifyContent: showBack ? "space-between" : "flex-end", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
      {showBack && (
        <button onClick={onBack} style={{ ...btnSecondary, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronIcon dir="left" /> Back
        </button>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onSaveExit && (
          <button onClick={onSaveExit} style={{ ...btnSecondary, padding: "10px 16px", fontSize: 14 }}>Save & exit</button>
        )}
        <button onClick={onNext} disabled={nextDisabled} style={{ ...btnPrimary, padding: "10px 24px", opacity: nextDisabled ? 0.4 : 1, cursor: nextDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {nextLabel} <ChevronIcon dir="right" />
        </button>
      </div>
    </div>
  );
}

function RecipePicker({ onSelect, onCancel, label, recipes }) {
  const [query, setQuery] = useState("");
  const results = query.length >= 2 ? (recipes || []).filter(r => r.name.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <div>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: t.sans, marginBottom: 10 }}>{label}</div>}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><SearchIcon /></div>
        <input style={{ ...inputBase, paddingLeft: 34, fontSize: 13 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your library..." autoFocus />
      </div>
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10, maxHeight: 200, overflowY: "auto" }}>
          {results.map(r => (
            <button key={r.id} onClick={() => onSelect(r)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: t.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${t.border}`, cursor: "pointer", width: "100%", textAlign: "left" }}>
              <span style={{ fontSize: 13, color: t.text, fontFamily: t.sans }}>{r.name}</span>
              <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                {r.protein_type && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: t.accentDim, color: t.accent }}>{capitalize(r.protein_type)}</span>}
                {r.cuisine_style && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: t.border, color: t.muted }}>{capitalize(r.cuisine_style)}</span>}
                {r.meal_type && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: t.border, color: t.muted }}>{capitalize(r.meal_type)}</span>}
                {r.cook_time && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: t.border, color: t.muted }}>{r.cook_time}m</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && <p style={{ fontSize: 12, color: t.dim, fontFamily: t.sans, textAlign: "center", padding: "8px 0" }}>No matches</p>}
      <button onClick={onCancel} style={{ padding: "6px 12px", background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.muted, fontSize: 12, cursor: "pointer", fontFamily: t.sans }}>Cancel</button>
    </div>
  );
}

// ─── Step 0: Grocery Review ───
function Step0({ groceryItems, onRemoveItem, onUpdateItem, onClearAll, loading }) {
  const uncheckedItems = (groceryItems || []).filter(i => !i.checked);
  return (
    <div>
      <StepHeader title="Review Grocery List" subtitle="You have items left from last week. Keep what you still need, update quantities, or clear for a fresh start." />
      {loading ? (
        <div style={{ background: t.surface, borderRadius: 10, padding: "32px 20px", textAlign: "center", border: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 14, color: t.subtle, fontFamily: t.sans, margin: 0 }}>Loading grocery list...</p>
        </div>
      ) : uncheckedItems.length > 0 ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: t.subtle, fontFamily: t.sans }}>{uncheckedItems.length} items</span>
            <button onClick={onClearAll} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.sans, fontWeight: 500 }}>Clear all</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {uncheckedItems.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface, borderRadius: 8, padding: "10px 16px" }}>
                <span style={{ flex: 1, fontSize: 14, color: t.text, fontFamily: t.sans }}>{item.name}</span>
                <input style={{ ...inputBase, width: 80, padding: "4px 8px", fontSize: 12, textAlign: "right" }} value={item.quantity || ""} onChange={e => onUpdateItem(item.id, { qty: e.target.value })} />
                <button onClick={() => onRemoveItem(item.id)} style={{ background: "none", border: "none", color: t.dim, cursor: "pointer", padding: 4, fontSize: 16, lineHeight: 1 }}>&times;</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ background: t.surface, borderRadius: 10, padding: "32px 20px", textAlign: "center", border: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 14, color: t.subtle, fontFamily: t.sans, margin: 0 }}>Grocery list is clear. Starting fresh.</p>
        </div>
      )}
    </div>
  );
}

// ─── Stock Check (Steps 1 & 2) ───
function StockCheck({ title, subtitle, initialItems, loading, onDecisionsChange, savedDecisions }) {
  const [items, setItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Update items when initialItems loads from Supabase, hydrating from saved decisions if available
  if (!initialized && !loading && initialItems.length > 0) {
    const savedMap = new Map((savedDecisions || []).map(d => [d.id, d]));
    setItems(initialItems.map(i => {
      const saved = savedMap.get(i.id);
      return {
        ...i,
        status: saved ? saved.status : null,
        weekQty: saved ? saved.weekQty : (i.defaultQty || ""),
      };
    }));
    setInitialized(true);
  }

  const decided = items.filter(i => i.status !== null).length;
  function updateAndNotify(updated) {
    setItems(updated);
    if (onDecisionsChange) {
      onDecisionsChange(updated.map(i => ({ id: i.id, name: i.name, status: i.status, weekQty: i.weekQty })));
    }
  }
  function setStatus(id, s) { updateAndNotify(items.map(i => i.id === id ? { ...i, status: s } : i)); }
  function setQty(id, q) { updateAndNotify(items.map(i => i.id === id ? { ...i, weekQty: q } : i)); }
  return (
    <div>
      <StepHeader title={title} subtitle={subtitle} />
      {loading ? (
        <div style={{ background: t.surface, borderRadius: 10, padding: "32px 20px", textAlign: "center", border: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 14, color: t.subtle, fontFamily: t.sans, margin: 0 }}>Loading your list...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: t.surface, borderRadius: 10, padding: "32px 20px", textAlign: "center", border: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 14, color: t.subtle, fontFamily: t.sans, margin: 0 }}>No items yet. Add some in Settings to see them here.</p>
        </div>
      ) : (
      <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: t.subtle, fontFamily: t.sans }}>{decided}/{items.length} checked</span>
        <button onClick={() => updateAndNotify(items.map(i => ({ ...i, status: "have" })))} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, fontFamily: t.sans, fontWeight: 500 }}>Mark all "have it"</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: t.surface, borderRadius: 8, padding: "12px 16px", border: `1px solid ${item.status === "need" ? "rgba(212,147,90,0.25)" : item.status === "have" ? "rgba(129,199,132,0.15)" : "transparent"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><span style={{ fontSize: 15, color: t.text, fontFamily: t.sans, fontWeight: 500 }}>{item.name}</span><span style={{ fontSize: 13, color: t.dim, fontFamily: t.sans, marginLeft: 10 }}>{item.defaultQty}</span></div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setStatus(item.id, "have")} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: t.sans, background: item.status === "have" ? t.greenDim : "transparent", color: item.status === "have" ? t.green : t.subtle, border: `1px solid ${item.status === "have" ? "rgba(129,199,132,0.3)" : t.border}` }}>Have it</button>
                <button onClick={() => setStatus(item.id, "need")} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: t.sans, background: item.status === "need" ? t.accentDim : "transparent", color: item.status === "need" ? t.accent : t.subtle, border: `1px solid ${item.status === "need" ? "rgba(212,147,90,0.3)" : t.border}` }}>Need it</button>
              </div>
            </div>
            {item.status === "need" && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, color: t.subtle, fontFamily: t.sans, flexShrink: 0 }}>Qty this week:</label>
                <input style={{ ...inputBase, width: 140, padding: "6px 10px", fontSize: 13 }} value={item.weekQty} onChange={e => setQty(item.id, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}

// ─── Step 3 helper: MealRow ───
function MealRow({ item, onSetDecision }) {
  return (
    <div style={{ background: t.surface, borderRadius: 8, padding: "14px 16px", border: `1px solid ${item.decision ? "transparent" : t.border}`, opacity: item.decision ? 0.7 : 1, transition: "all 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: t.text, fontFamily: t.sans, fontWeight: 500 }}>{item.name}</span>
            {item.day && <span style={{ fontSize: 12, color: t.dim, fontFamily: t.sans }}>{item.day}</span>}
          </div>
          {item.carryCount >= 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11, color: item.carryCount >= 2 ? t.accent : t.subtle, fontFamily: t.sans }}>
              {item.carryCount >= 2 && <AlertIcon />}
              <span>Carried forward {item.carryCount} {item.carryCount === 1 ? "time" : "times"}</span>
            </div>
          )}
        </div>
        {item.decision ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 500, fontFamily: t.sans, color: item.decision === "made" ? t.green : item.decision === "carry" ? t.accent : t.muted }}>{item.decision === "made" ? "Made it" : item.decision === "carry" ? "Move to this week" : "Dropped"}</span>
            <button onClick={() => onSetDecision(item.id, null)} style={{ background: "none", border: "none", color: t.subtle, cursor: "pointer", fontSize: 12, fontFamily: t.sans, textDecoration: "underline", textDecorationColor: t.border }}>undo</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onSetDecision(item.id, "made")} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: t.sans, background: t.greenDim, color: t.green, border: `1px solid rgba(129,199,132,0.2)` }}>Made it</button>
            <button onClick={() => onSetDecision(item.id, "carry")} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: t.sans, background: t.accentDim, color: t.accent, border: `1px solid rgba(212,147,90,0.2)` }}>Move to this week</button>
            <button onClick={() => onSetDecision(item.id, "drop")} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: t.sans, background: t.dangerDim, color: t.danger, border: `1px solid rgba(192,86,75,0.2)` }}>Drop</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Last Week's Meals ───
function Step3({ onNext, onBack, onSaveExit, priorEntries, onCarryForward, savedDecisions, onDecisionsChange }) {
  const [items, setItems] = useState(() => {
    // Build items from prior week's meal plan entries
    const savedMap = new Map((savedDecisions || []).map(d => [d.id, d.decision]));
    return (priorEntries || []).map(entry => ({
      id: entry.id,
      name: entry.recipe_name || "Unnamed",
      recipeId: entry.recipe_id || null,
      day: entry.section || "",
      type: (entry.meal_type || "dinner").toLowerCase().includes("dinner") ? "dinner" : "other",
      protein: entry.protein_type || null,
      cuisine: entry.cuisine_style || null,
      time: entry.cook_time || null,
      mealType: entry.meal_type || null,
      url: entry.source || null,
      carryCount: entry.carry_count || 0,
      isCarryForward: entry.is_carry_forward || false,
      decision: savedMap.get(entry.id) || null,
    }));
  });
  const [showUnreviewedWarning, setShowUnreviewedWarning] = useState(false);
  const decided = items.filter(i => i.decision).length;
  const unreviewed = items.length - decided;
  function setDecision(id, d) {
    const updated = items.map(i => i.id === id ? { ...i, decision: d } : i);
    setItems(updated);
    setShowUnreviewedWarning(false);
    // Persist decisions to parent for navigation resilience
    if (onDecisionsChange) {
      onDecisionsChange(updated.map(i => ({ id: i.id, decision: i.decision })));
    }
    // Feed carry-forward recipes back to parent whenever decisions change
    if (onCarryForward) {
      const carries = updated.filter(i => i.decision === "carry").map(i => ({
        id: i.id,
        name: i.name,
        recipeId: i.recipeId,
        protein: i.protein,
        cuisine: i.cuisine,
        time: i.time,
        mealType: i.mealType,
        url: i.url,
        carryCount: (i.carryCount || 0) + 1,
      }));
      onCarryForward(carries);
    }
  }
  const dinners = items.filter(i => i.type === "dinner");
  const others = items.filter(i => i.type !== "dinner");
  function handleNext() {
    if (unreviewed > 0 && !showUnreviewedWarning) { setShowUnreviewedWarning(true); return; }
    onNext();
  }

  return (
    <div>
      <StepHeader title="Last Week's Meals" subtitle="What did you end up making? Carry forward what you didn't get to, or drop it." />
      <span style={{ fontSize: 13, color: t.subtle, fontFamily: t.sans, display: "block", marginBottom: 12 }}>{decided}/{items.length} reviewed</span>
      <div style={{ marginBottom: 16 }}><label style={{ ...labelBase, marginBottom: 8 }}>Dinners</label><div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{dinners.map(i => <MealRow key={i.id} item={i} onSetDecision={setDecision} />)}</div></div>
      <div><label style={{ ...labelBase, marginBottom: 8 }}>Breakfast & Snacks</label><div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{others.map(i => <MealRow key={i.id} item={i} onSetDecision={setDecision} />)}</div></div>
      {showUnreviewedWarning && (
        <div style={{ marginTop: 16, padding: "14px 16px", background: t.accentDim, border: `1px solid rgba(212,147,90,0.25)`, borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: t.accent, flexShrink: 0, marginTop: 1 }}><AlertIcon /></span>
            <div>
              <div style={{ fontSize: 13, color: t.text, fontFamily: t.sans, lineHeight: 1.5 }}>You have {unreviewed} unreviewed {unreviewed === 1 ? "meal" : "meals"}. Skipped meals won't count toward times made and won't carry into this week.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={onNext} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13 }}>Proceed anyway</button>
                <button onClick={() => setShowUnreviewedWarning(false)} style={{ ...btnSecondary, padding: "8px 16px", fontSize: 13 }}>Continue reviewing</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!showUnreviewedWarning && <StepNav onBack={onBack} onNext={handleNext} onSaveExit={onSaveExit} showBack={true} />}
    </div>
  );
}

// ─── Step 4: Pick Recipes ───
function Step4({ recipes, onNext, onBack, onSaveExit, pickedRecipes, setPickedRecipes }) {
  const [activePanel, setActivePanel] = useState(null);
  const [cookbookName, setCookbookName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [reviewing, setReviewing] = useState(null);
  const [reviewIngredients, setReviewIngredients] = useState([]);
  const [showCustomProtein, setShowCustomProtein] = useState(false);
  const [showCustomCuisine, setShowCustomCuisine] = useState(false);
  const [showCustomMealType, setShowCustomMealType] = useState(false);
  const [assigningNight, setAssigningNight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const results = searchQuery.length >= 2 ? (recipes || []).filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  function closePanel() { setActivePanel(null); setSearchQuery(""); setUrlValue(""); setCookbookName(""); setPhotoFile(null); setError(null); }
  function resetAll() { closePanel(); setReviewing(null); setReviewIngredients([]); setAssigningNight(null); setShowCustomProtein(false); setShowCustomCuisine(false); setShowCustomMealType(false); }
  function selectFromLibrary(r) { setAssigningNight({ ...r, protein: r.protein_type, cuisine: r.cuisine_style, time: r.cook_time, mealType: r.meal_type, night: "" }); closePanel(); }
  async function handleUrlSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scrape-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlValue }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewing({
          name: data.recipe.name,
          protein_type: data.recipe.protein_type || '',
          cuisine_style: data.recipe.cuisine_style || '',
          cook_time: data.recipe.cook_time || 0,
          meal_type: data.recipe.meal_type || '',
          source: urlValue,
          sourceType: 'url',
        });
        setReviewIngredients(data.recipe.ingredients || []);
        setShowCustomProtein(false);
        setShowCustomCuisine(false);
        setShowCustomMealType(false);
      } else {
        setError(data.error || 'Failed to extract recipe');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setActivePanel(null);
    }
  }
  async function handleCookbookPhoto() {
    if (!cookbookName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (photoFile) formData.append('image', photoFile);
      formData.append('cookbookName', cookbookName);

      const res = await fetch('/api/extract-recipe-photo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setReviewing({
          name: data.recipe.name || '',
          protein_type: data.recipe.protein_type || '',
          cuisine_style: data.recipe.cuisine_style || '',
          cook_time: data.recipe.cook_time || 0,
          meal_type: data.recipe.meal_type || '',
          source: `cookbook: ${cookbookName}`,
          sourceType: 'cookbook',
        });
        setReviewIngredients(data.recipe.ingredients || []);
        setShowCustomProtein(false);
        setShowCustomCuisine(false);
        setShowCustomMealType(false);
      } else {
        setError(data.error || 'Failed to process image');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setActivePanel(null);
      setCookbookName('');
      setPhotoFile(null);
    }
  }
  function confirmReview() { setAssigningNight({ ...reviewing, protein: reviewing.protein_type, cuisine: reviewing.cuisine_style, time: reviewing.cook_time, mealType: reviewing.meal_type, ingredients: reviewIngredients, night: "" }); setReviewing(null); setReviewIngredients([]); }
  function updateReview(field, val) { setReviewing({ ...reviewing, [field]: val }); }
  function confirmNight() { setPickedRecipes([...pickedRecipes, { ...assigningNight }]); setAssigningNight(null); }

  const phase = reviewing ? "review" : assigningNight ? "night" : activePanel ? "input" : "idle";

  return (
    <div>
      <StepHeader title="Pick Your Recipes" subtitle="Add recipes you want to make this week. These get priority in the plan." />
      {pickedRecipes.length > 0 && (
        <div style={{ marginBottom: 16 }}><label style={{ ...labelBase, marginBottom: 8 }}>Your picks ({pickedRecipes.length})</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pickedRecipes.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: t.surface, borderRadius: 8, padding: "12px 16px", border: `1px solid rgba(212,147,90,0.2)` }}>
                <div>
                  <span style={{ fontSize: 14, color: t.text, fontFamily: t.sans, fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: item.night ? t.accent : t.dim, fontFamily: t.sans, marginLeft: 10 }}>{item.night || "Any night"}</span>
                </div>
                <button onClick={() => setPickedRecipes(pickedRecipes.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: t.dim, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "review" && (
        <div style={{ background: t.surface, border: `1px solid ${t.accent}`, borderRadius: 10, padding: "20px", marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelBase}>Recipe name</label>
            <input style={inputBase} value={reviewing.name} onChange={e => updateReview("name", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelBase}>Protein</label>
              {showCustomProtein ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inputBase, flex: 1 }} value={reviewing.protein_type || ""} onChange={e => updateReview("protein_type", e.target.value)} placeholder="Custom" autoFocus />
                  <button onClick={() => { setShowCustomProtein(false); updateReview("protein_type", ""); }} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, cursor: "pointer", fontSize: 11, fontFamily: t.sans, padding: "0 8px", whiteSpace: "nowrap" }}>Use list</button>
                </div>
              ) : (
                <select style={selectBase} value={PROTEIN_OPTIONS.includes(reviewing.protein_type) ? reviewing.protein_type : ""} onChange={e => { if (e.target.value === "__custom") setShowCustomProtein(true); else updateReview("protein_type", e.target.value); }}>
                  <option value="">Select...</option>
                  {PROTEIN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom">+ Custom</option>
                </select>
              )}
            </div>
            <div>
              <label style={labelBase}>Cuisine</label>
              {showCustomCuisine ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inputBase, flex: 1 }} value={reviewing.cuisine_style || ""} onChange={e => updateReview("cuisine_style", e.target.value)} placeholder="Custom" autoFocus />
                  <button onClick={() => { setShowCustomCuisine(false); updateReview("cuisine_style", ""); }} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, cursor: "pointer", fontSize: 11, fontFamily: t.sans, padding: "0 8px", whiteSpace: "nowrap" }}>Use list</button>
                </div>
              ) : (
                <select style={selectBase} value={CUISINE_OPTIONS.includes(reviewing.cuisine_style) ? reviewing.cuisine_style : ""} onChange={e => { if (e.target.value === "__custom") setShowCustomCuisine(true); else updateReview("cuisine_style", e.target.value); }}>
                  <option value="">Select...</option>
                  {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom">+ Custom</option>
                </select>
              )}
            </div>
            <div>
              <label style={labelBase}>Cook time (min)</label>
              <input style={inputBase} type="number" value={reviewing.cook_time || 0} onChange={e => updateReview("cook_time", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={labelBase}>Meal type</label>
              {showCustomMealType ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inputBase, flex: 1 }} value={reviewing.meal_type || ""} onChange={e => updateReview("meal_type", e.target.value)} placeholder="Custom" autoFocus />
                  <button onClick={() => { setShowCustomMealType(false); updateReview("meal_type", ""); }} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, cursor: "pointer", fontSize: 11, fontFamily: t.sans, padding: "0 8px", whiteSpace: "nowrap" }}>Use list</button>
                </div>
              ) : (
                <select style={selectBase} value={MEAL_TYPE_OPTIONS.includes(reviewing.meal_type) ? reviewing.meal_type : ""} onChange={e => { if (e.target.value === "__custom") setShowCustomMealType(true); else updateReview("meal_type", e.target.value); }}>
                  <option value="">Select...</option>
                  {MEAL_TYPE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="__custom">+ Custom</option>
                </select>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <ReviewIngredients ingredients={reviewIngredients} onChange={setReviewIngredients} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmReview} disabled={!reviewing.name.trim()} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 14, opacity: reviewing.name.trim() ? 1 : 0.4, cursor: reviewing.name.trim() ? "pointer" : "not-allowed" }}>Looks good</button>
            <button onClick={resetAll} style={{ ...btnSecondary, padding: "10px 16px", fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      {phase === "night" && (
        <div style={{ background: t.surface, border: `1px solid ${t.accent}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: t.text, fontFamily: t.sans, fontWeight: 500, marginBottom: 12 }}>Which night for "{assigningNight.name}"?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <button onClick={() => setAssigningNight({ ...assigningNight, night: "" })} style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontFamily: t.sans, cursor: "pointer", border: `1px solid ${!assigningNight.night ? t.accent : t.border}`, background: !assigningNight.night ? t.accentDim : "transparent", color: !assigningNight.night ? t.accent : t.subtle }}>Any night</button>
            {ALL_DAYS.map(d => <button key={d} onClick={() => setAssigningNight({ ...assigningNight, night: d })} style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontFamily: t.sans, cursor: "pointer", border: `1px solid ${assigningNight.night === d ? t.accent : t.border}`, background: assigningNight.night === d ? t.accentDim : "transparent", color: assigningNight.night === d ? t.accent : t.subtle }}>{d.slice(0, 3)}</button>)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmNight} style={{ ...btnPrimary, padding: "9px 18px", fontSize: 14 }}>Confirm</button>
            <button onClick={resetAll} style={{ ...btnSecondary, padding: "9px 14px", fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      {phase === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setActivePanel("search")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}>
            <span style={{ color: t.accent, display: "flex" }}><SearchIcon /></span>
            <div><div style={{ fontSize: 14, fontWeight: 500, color: t.text, fontFamily: t.sans }}>Search library</div><div style={{ fontSize: 12, color: t.subtle, fontFamily: t.sans }}>Find a recipe you already have</div></div>
          </button>
          <button onClick={() => setActivePanel("url")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}>
            <span style={{ color: t.accent, display: "flex" }}>Link</span>
            <div><div style={{ fontSize: 14, fontWeight: 500, color: t.text, fontFamily: t.sans }}>Paste a URL</div><div style={{ fontSize: 12, color: t.subtle, fontFamily: t.sans }}>Add a new recipe from the web</div></div>
          </button>
          <button onClick={() => setActivePanel("cookbook")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}>
            <span style={{ color: t.accent, display: "flex" }}>Cam</span>
            <div><div style={{ fontSize: 14, fontWeight: 500, color: t.text, fontFamily: t.sans }}>Cookbook photo</div><div style={{ fontSize: 12, color: t.subtle, fontFamily: t.sans }}>Snap a page from a cookbook</div></div>
          </button>
        </div>
      )}

      {phase === "input" && activePanel === "search" && (
        <div>
          <div style={{ position: "relative", marginBottom: 12 }}><div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><SearchIcon /></div><input style={{ ...inputBase, paddingLeft: 36 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search your library..." autoFocus /></div>
          {results.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>{results.map(r => (
            <button key={r.id} onClick={() => selectFromLibrary(r)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: t.surface, borderRadius: 8, padding: "12px 16px", border: `1px solid ${t.border}`, cursor: "pointer", width: "100%", textAlign: "left" }}>
              <div><span style={{ fontSize: 14, color: t.text, fontFamily: t.sans }}>{r.name}</span><div style={{ display: "flex", gap: 6, marginTop: 4 }}>{r.protein_type && <span style={{ fontSize: 12, padding: "1px 7px", borderRadius: 4, background: t.accentDim, color: t.accent }}>{capitalize(r.protein_type)}</span>}{r.cuisine_style && <span style={{ fontSize: 12, padding: "1px 7px", borderRadius: 4, background: t.border, color: t.muted }}>{capitalize(r.cuisine_style)}</span>}{r.cook_time && <span style={{ fontSize: 12, padding: "1px 7px", borderRadius: 4, background: t.border, color: t.muted }}>{r.cook_time}m</span>}{r.meal_type && <span style={{ fontSize: 12, padding: "1px 7px", borderRadius: 4, background: t.accentDim, color: t.accent }}>{capitalize(r.meal_type)}</span>}</div></div>
            </button>
          ))}</div>}
          {searchQuery.length >= 2 && results.length === 0 && <p style={{ fontSize: 13, color: t.dim, fontFamily: t.sans, textAlign: "center", padding: "16px 0" }}>No matches</p>}
          <button onClick={closePanel} style={{ ...btnSecondary, padding: "8px 14px", fontSize: 13 }}>Cancel</button>
        </div>
      )}

      {phase === "input" && activePanel === "url" && (
        <div>
          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: 8, padding: "12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#dc2626", fontFamily: t.sans }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, padding: 0 }}>&times;</button>
            </div>
          )}
          <div style={{ position: "relative", marginBottom: 12 }}><div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>Link</div><input style={{ ...inputBase, paddingLeft: 36 }} value={urlValue} onChange={e => setUrlValue(e.target.value)} placeholder="Paste a recipe URL..." autoFocus disabled={loading} /></div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", marginBottom: 12, gap: 8 }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${t.border}`, borderTop: `2px solid ${t.accent}`, borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
              <span style={{ fontSize: 13, color: t.muted, fontFamily: t.sans }}>Extracting recipe...</span>
            </div>
          )}
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleUrlSubmit} disabled={urlValue.length < 6 || loading} style={{ ...btnPrimary, padding: "9px 16px", fontSize: 13, opacity: urlValue.length >= 6 && !loading ? 1 : 0.4, cursor: urlValue.length >= 6 && !loading ? "pointer" : "not-allowed" }}>{loading ? "Extracting..." : "Extract recipe"}</button>
            <button onClick={closePanel} disabled={loading} style={{ ...btnSecondary, padding: "9px 14px", fontSize: 13, opacity: loading ? 0.4 : 1, cursor: loading ? "not-allowed" : "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {phase === "input" && activePanel === "cookbook" && (
        <div>
          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: 8, padding: "12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#dc2626", fontFamily: t.sans }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, padding: 0 }}>&times;</button>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={labelBase}>Cookbook name</label>
            <input style={inputBase} value={cookbookName} onChange={e => setCookbookName(e.target.value)} placeholder="e.g. Salt Fat Acid Heat" autoFocus disabled={loading} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelBase}>Photo</label>
            <label style={{ display: "block", border: `1.5px dashed ${t.border}`, borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, background: photoFile ? t.accentDim : "transparent" }}>
              <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} style={{ display: "none" }} disabled={loading} />
              <div style={{ color: t.accent, marginBottom: 6, display: "flex", justifyContent: "center" }}>Cam</div>
              {photoFile ? (
                <>
                  <div style={{ fontSize: 13, color: t.accent, fontFamily: t.sans, fontWeight: 500 }}>{photoFile.name}</div>
                  <div style={{ fontSize: 11, color: t.muted, fontFamily: t.sans, marginTop: 2 }}>Ready to extract</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: t.muted, fontFamily: t.sans }}>Tap to select a photo</div>
                  <div style={{ fontSize: 11, color: t.dim, fontFamily: t.sans, marginTop: 2 }}>We'll extract the recipe</div>
                </>
              )}
            </label>
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", marginBottom: 12, gap: 8 }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${t.border}`, borderTop: `2px solid ${t.accent}`, borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
              <span style={{ fontSize: 13, color: t.muted, fontFamily: t.sans }}>Processing image...</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCookbookPhoto} disabled={!cookbookName.trim() || !photoFile || loading} style={{ ...btnPrimary, padding: "9px 16px", fontSize: 13, opacity: cookbookName.trim() && photoFile && !loading ? 1 : 0.4, cursor: cookbookName.trim() && photoFile && !loading ? "pointer" : "not-allowed" }}>{loading ? "Processing..." : "Extract recipe"}</button>
            <button onClick={closePanel} disabled={loading} style={{ ...btnSecondary, padding: "9px 16px", fontSize: 13, opacity: loading ? 0.4 : 1, cursor: loading ? "not-allowed" : "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      <StepNav onBack={onBack} onNext={onNext} onSaveExit={onSaveExit} nextLabel="Continue" showBack={true} />
    </div>
  );
}

function ReviewIngredients({ ingredients, onChange }) {
  const [items, setItems] = useState(ingredients);
  const [newItem, setNewItem] = useState("");
  function sync(updated) { setItems(updated); onChange(updated); }
  function updateItem(idx, val) { const u = [...items]; u[idx] = val; sync(u); }
  function removeItem(idx) { sync(items.filter((_, i) => i !== idx)); }
  function addItem() { if (!newItem.trim()) return; sync([...items, newItem.trim()]); setNewItem(""); }
  return (
    <div>
      <label style={{ ...labelBase, marginBottom: 8 }}>Ingredients ({items.length})</label>
      <div style={{ background: t.bg, borderRadius: 8, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: idx < items.length - 1 ? `1px solid ${t.border}` : "none" }}>
            <input style={{ ...inputBase, border: "none", background: "transparent", padding: "4px 0", fontSize: 13 }} value={item} onChange={e => updateItem(idx, e.target.value)} />
            <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: t.dim, cursor: "pointer", padding: 4, flexShrink: 0, fontSize: 16, lineHeight: 1 }}>&times;</button>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderTop: items.length > 0 ? `1px solid ${t.border}` : "none" }}>
          <input style={{ ...inputBase, border: "none", background: "transparent", padding: "4px 0", fontSize: 13 }} value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="+ Add ingredient" />
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Calendar Review ───
function Step5({ nights, setNights }) {
  const options = [
    { id: "normal", label: "Normal" },
    { id: "not-home", label: "Not home" },
    { id: "just-me-out", label: "Only one parent home" },
    { id: "busy", label: "Quick night" },
  ];
  return (
    <div>
      <StepHeader title="This Week's Calendar" subtitle="What does the week look like? This helps pick the right meals." />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ALL_DAYS.map(d => (
          <div key={d} style={{ background: t.surface, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text, fontFamily: t.sans, marginBottom: 10 }}>{d}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {options.map(o => {
                const sel = nights[d] === o.id;
                return <button key={o.id} onClick={() => setNights({ ...nights, [d]: o.id })} style={{ padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: t.sans, background: sel ? t.accentDim : "transparent", color: sel ? t.accent : t.subtle, border: `1px solid ${sel ? "rgba(212,147,90,0.3)" : t.border}` }}>{o.label}</button>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 6: Meal Plan Review ───
function StepMealPlan({ onNext, onBack, onSaveExit, meals, setMeals, nights, setNights, recipes, onRegenerateSlot }) {
  const [dragOverDay, setDragOverDay] = useState(null);
  const [replacing, setReplacing] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regenerating, setRegenerating] = useState(null);
  const [confirmingRemove, setConfirmingRemove] = useState(null);

  const results = searchQuery.length >= 2 ? (recipes || []).filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  function handleDrop(toDay, data) {
    try {
      const { fromDay, recipeIndex } = JSON.parse(data);
      if (fromDay === toDay) return;
      setMeals(prev => {
        const updated = {};
        ALL_SECTIONS.forEach(d => { updated[d] = [...(prev[d] || [])]; });
        const [recipe] = updated[fromDay].splice(recipeIndex, 1);
        if (recipe) updated[toDay].push(recipe);
        return updated;
      });
    } catch (e) {}
    setDragOverDay(null);
  }

  function closeAll() { setReplacing(null); setSearchQuery(""); setConfirmingRemove(null); }

  function startReplace(day, idx) {
    closeAll();
    setReplacing(`${day}-${idx}`);
  }

  function replaceWith(day, idx, recipe) {
    setMeals(prev => {
      const updated = { ...prev, [day]: [...prev[day]] };
      updated[day][idx] = { id: `swap-${Date.now()}`, name: recipe.name, protein: recipe.protein_type, cuisine: recipe.cuisine_style, time: recipe.cook_time, mealType: recipe.meal_type, url: recipe.url, yourPick: false, reason: "Your swap" };
      return updated;
    });
    closeAll();
  }

  async function regenerate(day, idx) {
    closeAll();
    setRegenerating(`${day}-${idx}`);
    if (onRegenerateSlot) {
      const newMeal = await onRegenerateSlot(day, idx);
      if (newMeal) {
        setMeals(prev => {
          const updated = { ...prev, [day]: [...prev[day]] };
          updated[day][idx] = {
            id: `regen-${Date.now()}`,
            name: newMeal.name,
            recipeId: newMeal.recipeId,
            protein: newMeal.protein,
            cuisine: newMeal.cuisine,
            time: newMeal.time,
            mealType: newMeal.mealType,
            isEasyMeal: newMeal.isEasyMeal,
            easyMealIngredients: newMeal.easyMealIngredients,
            url: newMeal.url || null,
            isUserPick: false,
            isCarryForward: false,
            reason: newMeal.reason || "Regenerated",
          };
          return updated;
        });
      }
    }
    setRegenerating(null);
  }

  function startRemove(day, idx) {
    closeAll();
    setConfirmingRemove(`${day}-${idx}`);
  }

  function removeRecipe(day, idx) {
    setMeals(prev => {
      const updated = { ...prev, [day]: prev[day].filter((_, i) => i !== idx) };
      return updated;
    });
    closeAll();
  }

  return (
    <div>
      <StepHeader title="Review Your Meal Plan" subtitle="We've built your plan. Swap recipes, regenerate, or drag to rearrange." />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ALL_SECTIONS.map((day, sectionIdx) => {
          const dayMeals = meals[day] || [];
          const isExtra = day === "Batch Breakfast" || day === "Toddler Snacks";
          const SectionIcon = SECTION_ICONS[day] || IconPlate;
          const isOver = dragOverDay === day;

          return (
            <div key={day} onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }} onDragLeave={() => setDragOverDay(null)} onDrop={(e) => { e.preventDefault(); handleDrop(day, e.dataTransfer.getData("text/plain")); }} style={{ borderRadius: 10, padding: "0 0 8px", borderLeft: `3px solid ${isOver ? t.accent : "transparent"}`, transition: "all 0.2s", background: isOver ? "rgba(212,147,90,0.04)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: 6, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SectionIcon size={20} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.muted, fontFamily: t.sans }}>{day}</span>
                </div>
              </div>

              <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {dayMeals.map((meal, idx) => {
                  const ProteinIcon = meal.protein ? (PROTEIN_ICONS[meal.protein] || IconPlate) : null;
                  const proteinColor = meal.protein ? (PROTEIN_COLORS[meal.protein] || t.accent) : t.accent;
                  const menuKey = `${day}-${idx}`;

                  return (
                    <div key={meal.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ fromDay: day, recipeIndex: idx })); }} style={{ background: t.bg, padding: "14px 16px", border: `1px solid ${t.border}`, borderLeft: `3px solid ${proteinColor}50`, cursor: "grab", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        {ProteinIcon ? <ProteinIcon size={24} /> : <IconPlate size={24} />}
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: t.text, fontFamily: t.sans }}>{meal.name}</span>
                      </div>
                      {meal.url && <a href={meal.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: 12, color: t.accent, fontFamily: t.sans, textDecoration: "underline", marginLeft: 34, marginBottom: 8 }}>{getDomain(meal.url)}</a>}
                      <div style={{ marginLeft: 34, display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {meal.protein && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: `${proteinColor}18`, color: proteinColor, fontFamily: t.sans }}>{capitalize(meal.protein)}</span>}
                        {meal.cuisine && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.border, color: t.muted, fontFamily: t.sans }}>{capitalize(meal.cuisine)}</span>}
                        {meal.time && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.border, color: t.muted, fontFamily: t.sans }}>{meal.time}m</span>}
                        {meal.mealType && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.accentDim, color: t.accent, fontFamily: t.sans }}>{capitalize(meal.mealType)}</span>}
                        {meal.reason && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.accentDim, color: t.accent, fontFamily: t.sans }}>{meal.reason}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginLeft: 34 }}>
                        <button onClick={() => startReplace(day, idx)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, cursor: "pointer", fontFamily: t.sans }}>Replace</button>
                        <button onClick={() => regenerate(day, idx)} disabled={regenerating === menuKey} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, cursor: regenerating === menuKey ? "not-allowed" : "pointer", fontFamily: t.sans, opacity: regenerating === menuKey ? 0.5 : 1 }}>Regenerate</button>
                        <button onClick={() => startRemove(day, idx)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.danger, cursor: "pointer", fontFamily: t.sans }}>Remove</button>
                      </div>

                      {replacing === menuKey && (
                        <div style={{ marginTop: 10, padding: "12px", background: t.bg, border: `1px solid ${t.accent}`, borderRadius: 8 }}>
                          <div style={{ position: "relative", marginBottom: 10 }}><div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><SearchIcon /></div><input style={{ ...inputBase, paddingLeft: 36 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search library..." autoFocus /></div>
                          {results.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>{results.slice(0, 4).map(r => (
                            <button key={r.id} onClick={() => replaceWith(day, idx, r)} style={{ display: "flex", justifyContent: "space-between", background: t.surface, borderRadius: 6, padding: "8px 10px", border: `1px solid ${t.border}`, cursor: "pointer", width: "100%", textAlign: "left", fontSize: 12, color: t.text, fontFamily: t.sans }}>
                              <span>{r.name}</span>
                              <span style={{ color: t.accent }}>{r.cook_time}m</span>
                            </button>
                          ))}</div>}
                          <button onClick={closeAll} style={{ padding: "4px 10px", fontSize: 11, background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, cursor: "pointer", fontFamily: t.sans }}>Cancel</button>
                        </div>
                      )}

                      {confirmingRemove === menuKey && (
                        <div style={{ marginTop: 10, padding: "10px 12px", background: t.dangerDim, border: `1px solid rgba(192,86,75,0.2)`, borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: t.muted, fontFamily: t.sans, marginBottom: 8 }}>Remove this recipe?</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => removeRecipe(day, idx)} style={{ flex: 1, padding: "6px 10px", background: t.danger, border: "none", borderRadius: 6, color: t.accentText, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: t.sans }}>Remove</button>
                            <button onClick={closeAll} style={{ flex: 1, padding: "6px 10px", background: "none", border: `1px solid ${t.border}`, borderRadius: 6, color: t.subtle, fontSize: 11, cursor: "pointer", fontFamily: t.sans }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayMeals.length === 0 && (
                  <div style={{ padding: "20px 16px", borderRadius: 10, border: `1.5px dashed ${isOver ? t.accent : t.border}`, textAlign: "center", color: isOver ? t.accent : t.dim, fontSize: 12, fontFamily: t.sans, background: isOver ? t.accentDim : "rgba(36,32,25,0.4)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {!isOver && <EmptyBowlIllustration size={32} />}
                    <span>{isOver ? "Drop here" : isExtra ? "None yet" : "No meal planned"}</span>
                  </div>
                )}

                {dayMeals.length > 0 && isOver && (
                  <div style={{ padding: "10px", borderRadius: 8, border: `1.5px dashed ${t.accent}`, background: t.accentDim, textAlign: "center", fontSize: 12, color: t.accent, fontFamily: t.sans, fontWeight: 500 }}>Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <StepNav onBack={onBack} onNext={onNext} onSaveExit={onSaveExit} nextLabel="Review groceries" showBack={true} />
    </div>
  );
}

// ─── Step 7: Grocery List ───
function StepGroceryList({ onNext, onBack, onSaveExit, meals, recipes, stockDecisions, pantryStaples }) {
  const [categories, setCategories] = useState(() => {
    const cats = {
      "Produce": [],
      "Meat & Seafood": [],
      "Dairy & Refrigerated": [],
      "Dry Goods & Pasta": [],
      "Oils, Sauces & Condiments": [],
      "Essentials & Nice-to-Haves": [],
      "Other": [],
    };

    // Build pantry staple set for filtering (case-insensitive)
    const pantrySet = new Set((pantryStaples || []).map(p => (p.name || "").toLowerCase().trim()));
    function isPantryStaple(ingredientName) {
      const lower = (ingredientName || "").toLowerCase().trim();
      for (const staple of pantrySet) {
        if (lower.includes(staple) || staple.includes(lower)) return true;
      }
      return false;
    }

    // Collect ingredients from all planned meals
    const allMeals = Object.values(meals || {}).flat();
    allMeals.forEach(meal => {
      if (!meal || !meal.name) return;

      // Skip carry-forward meals (ingredients already purchased last week)
      if (meal.isCarryForward) return;

      // Handle easy meals: use easyMealIngredients instead of recipe library
      if (meal.isEasyMeal && meal.easyMealIngredients) {
        const ingText = typeof meal.easyMealIngredients === 'string' ? meal.easyMealIngredients : '';
        if (ingText.trim()) {
          // Easy meal ingredients might be comma-separated or a single item
          const parts = ingText.includes(',') ? ingText.split(',') : [ingText];
          parts.forEach((part, idx) => {
            const trimmed = part.trim();
            if (!trimmed || isPantryStaple(trimmed)) return;
            const detected = detectCategory(trimmed);
            const catKey = Object.keys(cats).includes(detected) ? detected : "Other";
            cats[catKey].push({
              id: `easy-${meal.name}-${idx}`,
              name: trimmed,
              qty: "",
              sources: [{ from: meal.name, qty: "" }],
            });
          });
        }
        return;
      }

      // Regular recipe: look up in library
      const recipe = (recipes || []).find(r => r.name.toLowerCase() === meal.name.toLowerCase());
      if (recipe && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach((ing, idx) => {
          if (!ing) return;
          if (isPantryStaple(ing)) return;
          const detected = detectCategory(ing);
          const catKey = Object.keys(cats).includes(detected) ? detected : "Other";
          cats[catKey].push({
            id: `ing-${meal.name}-${idx}`,
            name: ing,
            qty: "",
            sources: [{ from: meal.name, qty: "" }],
          });
        });
      }
    });

    // Add "need" items from essentials and nice-to-haves stock decisions
    const needItems = [
      ...((stockDecisions?.essentials || []).filter(d => d.status === "need")),
      ...((stockDecisions?.niceToHaves || []).filter(d => d.status === "need")),
    ];
    needItems.forEach(item => {
      if (isPantryStaple(item.name)) return;
      cats["Essentials & Nice-to-Haves"].push({
        id: `stock-${item.id}`,
        name: item.name,
        qty: item.weekQty || "",
        sources: [{ from: "Stock check", qty: item.weekQty || "" }],
      });
    });

    return cats;
  });
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [detectedCat, setDetectedCat] = useState("Other");
  const [catOverride, setCatOverride] = useState(null);

  const activeCat = catOverride || detectedCat;
  const totalCount = Object.values(categories).flat().filter(Boolean).length;

  function handleItemChange(val) {
    setNewItem(val);
    if (val.trim()) {
      const detected = detectCategory(val.trim());
      setDetectedCat(detected);
      if (!catOverride) setCatOverride(null);
    } else {
      setDetectedCat("Other");
    }
  }

  function removeItem(cat, id) {
    setCategories(prev => ({
      ...prev,
      [cat]: prev[cat].filter(i => i.id !== id),
    }));
  }

  function addItem() {
    if (!newItem.trim()) return;
    const cat = activeCat;
    setCategories(prev => ({
      ...prev,
      [cat]: [...(prev[cat] || []), { id: `custom-${Date.now()}`, name: newItem.trim(), qty: newQty.trim() || "1", sources: [{ from: "Added manually", qty: newQty.trim() || "1" }] }],
    }));
    setNewItem("");
    setNewQty("");
    setDetectedCat("Other");
    setCatOverride(null);
  }

  function editQty(cat, id, qty) {
    setCategories(prev => ({
      ...prev,
      [cat]: prev[cat].map(i => i.id === id ? { ...i, qty } : i),
    }));
  }

  return (
    <div>
      <StepHeader title="Grocery List" subtitle="Everything you need for the week. Edit, remove, or add anything we missed." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: t.subtle, fontFamily: t.sans }}>{totalCount} items</span>
      </div>

      {Object.entries(categories).map(([cat, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <label style={{ ...labelBase, marginBottom: 6 }}>{cat} ({items.length})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: t.surface, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, fontSize: 14, color: t.text, fontFamily: t.sans, fontWeight: 500, minWidth: 0 }}>{item.name}</span>
                    <input style={{ ...inputBase, width: 80, padding: "4px 8px", fontSize: 12, textAlign: "right" }} value={item.qty} onChange={e => editQty(cat, item.id, e.target.value)} />
                    <button onClick={() => removeItem(cat, item.id)} style={{ background: "none", border: "none", color: t.subtle, cursor: "pointer", padding: 2, fontSize: 16, lineHeight: 1 }}>&times;</button>
                  </div>
                  {item.sources && item.sources.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {item.sources.map((s, si) => (
                        <span key={si} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(212,147,90,0.1)", color: t.muted, fontFamily: t.sans }}>{s.qty} {s.from}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 16, background: t.surface, borderRadius: 10, padding: "14px 16px", border: `1px solid ${t.border}` }}>
        <label style={{ ...labelBase, marginBottom: 10 }}>Add an item</label>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: t.subtle, fontFamily: t.sans, marginBottom: 4, display: "block" }}>Item</span>
            <input style={inputBase} value={newItem} onChange={e => handleItemChange(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="e.g. paper towels" />
          </div>
          <div style={{ width: 90 }}>
            <span style={{ fontSize: 11, color: t.subtle, fontFamily: t.sans, marginBottom: 4, display: "block" }}>Qty</span>
            <input style={{ ...inputBase, textAlign: "right" }} value={newQty} onChange={e => setNewQty(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="1 bag" />
          </div>
          <button onClick={addItem} disabled={!newItem.trim()} style={{ ...btnPrimary, padding: "9px 14px", fontSize: 13, opacity: newItem.trim() ? 1 : 0.4, flexShrink: 0 }}>Add</button>
        </div>
        {newItem.trim() && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: t.subtle, fontFamily: t.sans }}>Category:</span>
            <select style={{ ...inputBase, width: "auto", padding: "3px 8px", fontSize: 12 }} value={activeCat} onChange={e => setCatOverride(e.target.value)}>
              {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {!catOverride && detectedCat !== "Other" && (
              <span style={{ fontSize: 11, color: t.accent, fontFamily: t.sans }}>auto-detected</span>
            )}
          </div>
        )}
      </div>
      <StepNav onBack={onBack} onNext={onNext} onSaveExit={onSaveExit} nextLabel="Launch plan" showBack={true} />
    </div>
  );
}

// ─── Weekly Plan Landing ───
function WeeklyPlanLanding({ onStartPlan, onResumeDraft, onDeleteDraft, hasDraft, planStatus: parentPlanStatus, recipes, weekOffset, setWeekOffset, planMeals, nights }) {
  const meals = planMeals || ALL_SECTIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {});
  const [dragOverDay, setDragOverDay] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [addingDay, setAddingDay] = useState(null);
  const [swapping, setSwapping] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(false);

  const isCurrentWeek = weekOffset === 0;
  const hasMeals = Object.values(meals).some(arr => arr.length > 0);
  const planStatus = hasDraft ? "draft" : (parentPlanStatus === "active" ? "live" : (hasMeals ? "live" : "none"));

  function getWeekLabel(offset) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(d)} – ${fmt(end)}`;
  }

  function handleDrop(toDay, data) {
    try {
      const { fromDay, recipeIndex } = JSON.parse(data);
      if (fromDay === toDay) return;
      setMeals(prev => {
        const updated = {};
        ALL_SECTIONS.forEach(d => { updated[d] = [...(prev[d] || [])]; });
        const [recipe] = updated[fromDay].splice(recipeIndex, 1);
        if (recipe) updated[toDay].push(recipe);
        return updated;
      });
    } catch (e) {}
    setDragOverDay(null);
  }

  function removeRecipe(day, index) {
    setMeals(prev => {
      const updated = { ...prev };
      updated[day] = prev[day].filter((_, i) => i !== index);
      return updated;
    });
    closeAll();
  }

  function addRecipe(day, recipe) {
    setMeals(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: `new-${Date.now()}`, name: recipe.name, protein: recipe.protein_type, cuisine: recipe.cuisine_style, time: recipe.cook_time, mealType: recipe.meal_type, url: recipe.url }],
    }));
    setAddingDay(null);
  }

  function swapRecipe(day, index, recipe) {
    setMeals(prev => {
      const updated = { ...prev };
      updated[day] = [...prev[day]];
      updated[day][index] = { id: `swap-${Date.now()}`, name: recipe.name, protein: recipe.protein_type, cuisine: recipe.cuisine_style, time: recipe.cook_time, mealType: recipe.meal_type, url: recipe.url };
      return updated;
    });
    setSwapping(null);
  }

  function closeAll() { setOpenMenu(null); setAddingDay(null); setSwapping(null); setConfirmRemove(null); }

  return (
    <div style={{ padding: "28px 0 40px" }}>
      <h1 style={{ fontFamily: t.serif, fontSize: 22, color: t.text, margin: "0 0 12px" }}>Weekly Plan</h1>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={() => { setWeekOffset(weekOffset - 1); closeAll(); }} style={{ width: 28, height: 28, borderRadius: 6, background: t.surface, border: `1px solid ${t.border}`, color: t.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronIcon dir="left" /></button>
          <div style={{ padding: "4px 12px", fontSize: 13, fontWeight: 600, color: t.text, fontFamily: t.sans, whiteSpace: "nowrap" }}>
            {getWeekLabel(weekOffset)}{isCurrentWeek && <span style={{ color: t.accent, marginLeft: 6, fontWeight: 500, fontSize: 11 }}>This week</span>}
          </div>
          <button onClick={() => { setWeekOffset(weekOffset + 1); closeAll(); }} style={{ width: 28, height: 28, borderRadius: 6, background: t.surface, border: `1px solid ${t.border}`, color: t.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronIcon dir="right" /></button>
        </div>
        {planStatus === "draft" && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10, background: t.accentDim, color: t.accent, fontFamily: t.sans }}>Draft</span>
        )}
      </div>

      {planStatus === "live" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ALL_SECTIONS.map((day, sectionIdx) => {
            const dayMeals = meals[day] || [];
            const isExtra = day === "Batch Breakfast" || day === "Toddler Snacks";
            const SectionIcon = SECTION_ICONS[day] || IconPlate;
            const isOver = dragOverDay === day;
            const showDivider = sectionIdx === ALL_DAYS.length - 1;

            return (
              <div key={day} onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }} onDragLeave={() => setDragOverDay(null)} onDrop={(e) => { e.preventDefault(); handleDrop(day, e.dataTransfer.getData("text/plain")); }} style={{ borderRadius: 10, padding: "0 0 8px", borderLeft: `3px solid ${isOver ? t.accent : "transparent"}`, transition: "all 0.2s", background: isOver ? "rgba(212,147,90,0.04)" : "transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: 6, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionIcon size={20} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.muted, fontFamily: t.sans }}>{day}</span>
                  </div>
                  {!isExtra && (
                    <button onClick={() => { closeAll(); setAddingDay(addingDay === day ? null : day); }} style={{ padding: "3px 10px", background: "none", border: "none", color: t.subtle, cursor: "pointer", fontSize: 12, fontFamily: t.sans, display: "flex", alignItems: "center", gap: 4, borderRadius: 6 }}>
                      <PlusIcon /> <span style={{ fontSize: 11 }}>Add</span>
                    </button>
                  )}
                </div>

                <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {dayMeals.map((meal, idx) => {
                    const menuKey = `${day}-${idx}`;
                    const isMenuOpen = openMenu === menuKey;
                    const isConfirming = confirmRemove === menuKey;
                    const isSwappingThis = swapping && swapping.day === day && swapping.index === idx;
                    const ProteinIcon = meal.protein ? (PROTEIN_ICONS[meal.protein] || IconPlate) : null;
                    const proteinColor = meal.protein ? (PROTEIN_COLORS[meal.protein] || t.accent) : t.accent;

                    return (
                      <div key={meal.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ fromDay: day, recipeIndex: idx })); }} style={{ background: t.bg, borderRadius: 8, padding: "14px 16px", border: `1px solid ${t.border}`, borderLeft: `3px solid ${proteinColor}50`, cursor: "grab", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                            {ProteinIcon ? <ProteinIcon size={24} /> : <IconPlate size={24} />}
                          </span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: t.text, fontFamily: t.sans }}>{meal.name}</span>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <button onClick={(e) => { e.stopPropagation(); closeAll(); setOpenMenu(isMenuOpen ? null : menuKey); }} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", display: "flex", color: t.subtle, borderRadius: 6 }}><MoreIcon /></button>
                            {isMenuOpen && (
                              <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 6, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                                <button onClick={() => { setOpenMenu(null); setSwapping({ day, index: idx }); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", color: t.text, fontSize: 13, fontFamily: t.sans, cursor: "pointer", textAlign: "left", borderRadius: 6 }}>Swap recipe</button>
                                <button onClick={() => { setOpenMenu(null); setConfirmRemove(menuKey); }} style={{ display: "block", width: "100%", padding: "9px 12px", background: "none", border: "none", color: t.danger, fontSize: 13, fontFamily: t.sans, cursor: "pointer", textAlign: "left", borderRadius: 6 }}>Remove</button>
                              </div>
                            )}
                          </div>
                        </div>

                        {meal.url && (
                          <a href={meal.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: 12, color: t.accent, fontFamily: t.sans, textDecoration: "underline", margin: "6px 0 0 34px", marginBottom: 8 }}>
                            {getDomain(meal.url)}
                          </a>
                        )}

                        <div style={{ margin: "0 0 0 34px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {meal.protein && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: `${proteinColor}18`, color: proteinColor, fontFamily: t.sans }}>{capitalize(meal.protein)}</span>}
                          {meal.cuisine && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.border, color: t.muted, fontFamily: t.sans }}>{capitalize(meal.cuisine)}</span>}
                          {meal.time && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.border, color: t.muted, fontFamily: t.sans }}>{meal.time}m</span>}
                          {meal.mealType && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: t.accentDim, color: t.accent, fontFamily: t.sans }}>{capitalize(meal.mealType)}</span>}
                        </div>

                        {isConfirming && (
                          <div style={{ marginTop: 10, padding: "12px 14px", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8 }}>
                            <div style={{ fontSize: 12, color: t.muted, fontFamily: t.sans, marginBottom: 10 }}>Remove this recipe?</div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => removeRecipe(day, idx)} style={{ flex: 1, padding: "8px 10px", background: t.dangerDim, border: `1px solid rgba(192,86,75,0.2)`, borderRadius: 8, color: t.danger, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: t.sans }}>Remove</button>
                              <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, padding: "8px 10px", background: "none", border: `1px solid ${t.border}`, borderRadius: 8, color: t.dim, fontSize: 12, cursor: "pointer", fontFamily: t.sans }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {isSwappingThis && (
                          <div style={{ marginTop: 10, padding: "12px", background: t.bg, border: `1px solid ${t.accent}`, borderRadius: 8 }}>
                            <RecipePicker label={`Replace "${meal.name}" with...`} onSelect={(r) => swapRecipe(day, idx, r)} onCancel={() => setSwapping(null)} recipes={recipes} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {dayMeals.length === 0 && (
                    <div style={{ padding: "20px 16px", borderRadius: 10, border: `1.5px dashed ${isOver ? t.accent : t.border}`, textAlign: "center", color: isOver ? t.accent : t.dim, fontSize: 12, fontFamily: t.sans, background: isOver ? t.accentDim : "rgba(36,32,25,0.4)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      {!isOver && <EmptyBowlIllustration size={32} />}
                      <span>{isOver ? "Drop here" : isExtra ? "None yet" : "No meal planned"}</span>
                    </div>
                  )}

                  {dayMeals.length > 0 && isOver && (
                    <div style={{ padding: "10px", borderRadius: 8, border: `1.5px dashed ${t.accent}`, background: t.accentDim, textAlign: "center", fontSize: 12, color: t.accent, fontFamily: t.sans, fontWeight: 500 }}>Drop here</div>
                  )}
                </div>

                {addingDay === day && (
                  <div style={{ margin: "8px 12px 0", padding: "14px", background: t.bg, border: `1px solid ${t.green}`, borderRadius: 10, boxShadow: "0 2px 8px rgba(129,199,132,0.1)" }}>
                    <RecipePicker label={`Add recipe to ${day}`} onSelect={(r) => addRecipe(day, r)} onCancel={() => setAddingDay(null)} recipes={recipes} />
                  </div>
                )}

                {showDivider ? (
                  <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${t.border}, transparent)`, margin: "16px 0 8px" }} />
                ) : (
                  <div style={{ height: 1, background: t.border, margin: "8px 12px 0", opacity: 0.35 }} />
                )}
              </div>
            );
          })}
        </div>
      ) : planStatus === "draft" ? (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "48px 28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <EmptyBowlIllustration size={48} />
          <p style={{ fontSize: 16, color: t.muted, margin: "16px 0 6px", fontFamily: t.serif }}>You have a draft for this week</p>
          <p style={{ fontSize: 13, color: t.dim, margin: "0 0 20px", fontFamily: t.sans }}>Pick up where you left off, or start over.</p>
          {confirmDeleteDraft ? (
            <div style={{ background: t.bg, border: `1px solid ${t.danger}40`, borderRadius: 10, padding: "16px 20px", width: "100%", maxWidth: 320 }}>
              <p style={{ fontSize: 14, color: t.text, fontFamily: t.sans, margin: "0 0 4px", fontWeight: 600 }}>Delete this draft?</p>
              <p style={{ fontSize: 13, color: t.muted, fontFamily: t.sans, margin: "0 0 14px", lineHeight: 1.5 }}>This will remove all progress on this week's plan.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => { onDeleteDraft(); setConfirmDeleteDraft(false); }} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 14, background: t.danger }}>Delete Draft</button>
                <button onClick={() => setConfirmDeleteDraft(false)} style={{ ...btnSecondary, padding: "10px 20px", fontSize: 14 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onResumeDraft} style={{ ...btnPrimary, padding: "12px 24px", fontSize: 15, background: `linear-gradient(135deg, ${t.accent}, #c07a3a)`, boxShadow: "0 2px 8px rgba(212,147,90,0.3)" }}>Continue Planning</button>
              <button onClick={() => setConfirmDeleteDraft(true)} style={{ ...btnSecondary, padding: "12px 20px", fontSize: 14, color: t.danger, borderColor: "rgba(192,86,75,0.25)" }}>Delete Draft</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "48px 28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CookingPotIllustration />
          <p style={{ fontSize: 16, color: t.muted, margin: "16px 0 6px", fontFamily: t.serif }}>No plan for {getWeekLabel(weekOffset)}</p>
          <p style={{ fontSize: 13, color: t.dim, margin: "0 0 20px", fontFamily: t.sans }}>Start planning to fill this week with great meals</p>
          <button onClick={onStartPlan} style={{ ...btnPrimary, padding: "12px 24px", fontSize: 15, background: `linear-gradient(135deg, ${t.accent}, #c07a3a)`, boxShadow: "0 2px 8px rgba(212,147,90,0.3)" }}>Plan This Week</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
// ─── Helper: get Monday of the current week ───
function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekStart(offset) {
  const base = getCurrentWeekStart();
  base.setDate(base.getDate() + offset * 7);
  return base;
}

export default function WeeklyPlanPage() {
  const { recipes } = useRecipes();
  const { items: essentialItems, loading: essentialsLoading } = useEssentials();
  const { items: niceToHaveItems, loading: niceToHavesLoading } = useNiceToHaves();
  const { items: easyMealItems } = useEasyMeals();
  const { items: pantryStapleItems } = usePantryStaples();
  const mealPlan = useMealPlan();
  const groceryList = useGroceryList();

  // ─── View state ───
  const [view, setView] = useState("landing");
  const [weekOffset, setWeekOffset] = useState(0);

  // ─── Plan state (persisted to Supabase) ───
  const [planId, setPlanId] = useState(null);
  const [planStatus, setPlanStatus] = useState(null); // null | "draft" | "active"
  const [step, setStep] = useState(0);

  // ─── Flow data (accumulated across steps, lives in parent) ───
  const [pickedRecipes, setPickedRecipes] = useState([]);
  const [carryForwardRecipes, setCarryForwardRecipes] = useState([]);
  const [nights, setNights] = useState({
    ...ALL_DAYS.reduce((acc, d) => ({ ...acc, [d]: "normal" }), {}),
    Sunday: "not-home",
  });
  const [planMeals, setPlanMeals] = useState(ALL_SECTIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}));
  const [stockDecisions, setStockDecisions] = useState({ essentials: [], niceToHaves: [] });
  const [lastWeekDecisions, setLastWeekDecisions] = useState([]);

  // ─── Conditions for dynamic step sequencing ───
  const [hasGroceryItems, setHasGroceryItems] = useState(false);
  const [hasPriorPlan, setHasPriorPlan] = useState(false);
  const [priorPlanEntries, setPriorPlanEntries] = useState([]);

  // ─── Fetch current week's plan on mount and when weekOffset changes ───
  useEffect(() => {
    async function loadWeek() {
      const weekStart = getWeekStart(weekOffset);
      const { plan, entries } = await mealPlan.fetchPlanForWeek(weekStart);

      if (plan) {
        setPlanId(plan.id);
        setPlanStatus(plan.status);
        if (plan.night_contexts) setNights(plan.night_contexts);
        if (plan.draft_step !== null && plan.draft_step !== undefined) setStep(plan.draft_step);
        if (plan.stock_decisions) setStockDecisions(plan.stock_decisions);
        if (plan.picked_recipes) setPickedRecipes(plan.picked_recipes);
        if (plan.carry_forward_recipes) setCarryForwardRecipes(plan.carry_forward_recipes);
        if (plan.last_week_decisions) setLastWeekDecisions(plan.last_week_decisions);

        // Rebuild planMeals from entries
        const meals = ALL_SECTIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {});
        for (const entry of entries) {
          if (meals[entry.section]) {
            meals[entry.section].push({
              id: entry.id,
              name: entry.recipe_name,
              recipeId: entry.recipe_id,
              reason: entry.reason || "",
              isUserPick: entry.is_user_pick || false,
              isCarryForward: entry.is_carry_forward || false,
              isEasyMeal: entry.is_easy_meal || false,
              protein: entry.protein_type || "",
              cuisine: entry.cuisine_style || "",
              mealType: entry.meal_type || "",
              time: entry.cook_time || null,
              url: entry.source || "",
            });
          }
        }
        setPlanMeals(meals);
      } else {
        setPlanId(null);
        setPlanStatus(null);
        setPlanMeals(ALL_SECTIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}));
      }

      // Check for prior week's plan (for "Last Week's Meals" step)
      const priorWeekStart = getWeekStart(weekOffset - 1);
      const { plan: priorPlan, entries: priorEntries } = await mealPlan.fetchPlanForWeek(priorWeekStart);
      if (priorPlan && priorPlan.status === "active") {
        setHasPriorPlan(true);
        setPriorPlanEntries(priorEntries || []);
      } else {
        setHasPriorPlan(false);
        setPriorPlanEntries([]);
      }

      // Check for leftover grocery items
      const { data: uncheckedItems } = await groceryList.getUncheckedCount();
      setHasGroceryItems(uncheckedItems > 0);
    }
    loadWeek();
  }, [weekOffset]);

  // ─── Dynamic step sequence ───
  const stepSequence = [
    ...(hasGroceryItems ? [{ id: "grocery", label: "Grocery list review" }] : []),
    { id: "essentials", label: "Essentials check" },
    { id: "nicetohaves", label: "Nice-to-haves check" },
    ...(hasPriorPlan ? [{ id: "lastweek", label: "Last week's meals" }] : []),
    { id: "pick", label: "Pick your recipes" },
    { id: "calendar", label: "Calendar review" },
    { id: "mealplan", label: "Review meal plan" },
    { id: "grocerylist", label: "Grocery list" },
  ];

  const totalSteps = stepSequence.length - 1;
  const currentStepId = stepSequence[step]?.id;
  const stepLabels = Object.fromEntries(stepSequence.map((s, i) => [i, s.label]));

  // ─── Navigation ───
  function nextStep() { if (step < totalSteps) setStep(step + 1); }
  function prevStep() { if (step <= 0) { setView("landing"); return; } setStep(step - 1); }

  async function saveAndExit() {
    if (planId) {
      await mealPlan.saveDraftStep(planId, step);
      await mealPlan.updateNightContexts(planId, nights);
      // Save stock decisions, picked recipes, and carry-forwards separately
      // so one column failure doesn't block the others
      await supabase.from('meal_plans').update({ stock_decisions: stockDecisions }).eq('id', planId);
      await supabase.from('meal_plans').update({ picked_recipes: pickedRecipes }).eq('id', planId);
      await supabase.from('meal_plans').update({ carry_forward_recipes: carryForwardRecipes }).eq('id', planId);
      await supabase.from('meal_plans').update({ last_week_decisions: lastWeekDecisions }).eq('id', planId);

      // Save generated meal plan entries (clear old ones first, then re-insert)
      const hasMeals = Object.values(planMeals).some(arr => arr.length > 0);
      if (hasMeals) {
        await supabase.from('meal_plan_entries').delete().eq('meal_plan_id', planId);
        const entries = [];
        for (const [section, meals] of Object.entries(planMeals)) {
          for (const meal of meals) {
            entries.push({
              meal_plan_id: planId,
              section,
              recipe_id: meal.recipeId || null,
              recipe_name: meal.name,
              protein_type: meal.protein || null,
              cuisine_style: meal.cuisine || null,
              meal_type: meal.mealType || null,
              cook_time: meal.time || null,
              source: meal.url || null,
              reason: meal.reason || null,
              is_user_pick: meal.isUserPick || false,
              is_carry_forward: meal.isCarryForward || false,
              is_easy_meal: meal.isEasyMeal || false,
              easy_meal_ingredients: meal.easyMealIngredients || null,
            });
          }
        }
        if (entries.length > 0) {
          await supabase.from('meal_plan_entries').insert(entries);
        }
      }
    }
    setView("landing");
  }

  async function startFresh() {
    const weekStart = getWeekStart(weekOffset);
    const { data: newPlan } = await mealPlan.createPlan(weekStart);
    if (newPlan) {
      setPlanId(newPlan.id);
      setPlanStatus("draft");
    }
    setStep(0);
    setPickedRecipes([]);
    setCarryForwardRecipes([]);
    setNights({
      ...ALL_DAYS.reduce((acc, d) => ({ ...acc, [d]: "normal" }), {}),
      Sunday: "not-home",
    });
    setPlanMeals(ALL_SECTIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}));
    setStockDecisions({ essentials: [], niceToHaves: [] });
    setLastWeekDecisions([]);
    setView("flow");
  }

  function resumeDraft() {
    setView("flow");
    // step is already loaded from Supabase via loadWeek
  }

  async function deleteDraft() {
    if (planId) {
      await mealPlan.deletePlan(planId);
    }
    setPlanId(null);
    setPlanStatus(null);
    setStep(0);
    setPickedRecipes([]);
    setCarryForwardRecipes([]);
    setNights({
      ...ALL_DAYS.reduce((acc, d) => ({ ...acc, [d]: "normal" }), {}),
      Sunday: "not-home",
    });
    setPlanMeals(ALL_SECTIONS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}));
    setStockDecisions({ essentials: [], niceToHaves: [] });
    setLastWeekDecisions([]);
    setLastGenerationInputs(null);
  }

  // ─── Generation state ───
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [lastGenerationInputs, setLastGenerationInputs] = useState(null);

  function getGenerationInputsSnapshot() {
    return JSON.stringify({
      nights,
      pickedRecipes: pickedRecipes.map(r => r.id || r.name),
      carryForwardRecipes: carryForwardRecipes.map(r => r.id || r.name),
    });
  }

  async function generateMealPlan() {
    // If inputs haven't changed and we already have a plan, just advance
    const currentInputs = getGenerationInputsSnapshot();
    const hasPlanAlready = Object.values(planMeals).some(meals => meals.length > 0);
    if (hasPlanAlready && lastGenerationInputs === currentInputs) {
      nextStep();
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nights,
          pickedRecipes,
          carryForwardRecipes,
          easyMeals: easyMealItems,
          recipes,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setGenerationError(data.error || "Failed to generate plan");
        setGenerating(false);
        return;
      }
      // Enrich plan entries with recipe URLs from library
      const recipeMap = new Map((recipes || []).map(r => [r.id, r]));
      const enrichedPlan = {};
      for (const [section, entries] of Object.entries(data.plan)) {
        enrichedPlan[section] = (entries || []).map(entry => {
          const libraryMatch = entry.recipeId ? recipeMap.get(entry.recipeId) : null;
          return {
            ...entry,
            id: entry.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: libraryMatch?.source || null,
          };
        });
      }
      setPlanMeals(enrichedPlan);
      setLastGenerationInputs(currentInputs);
      nextStep(); // advance to meal plan review
    } catch (err) {
      setGenerationError(err.message || "Network error");
    }
    setGenerating(false);
  }

  async function regenerateSlot(section, mealIndex) {
    const currentMeal = (planMeals[section] || [])[mealIndex];
    const nightContext = nights[section] || "normal";
    try {
      const res = await fetch("/api/regenerate-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          currentMealName: currentMeal?.name || "",
          nightContext,
          currentPlan: planMeals,
          recipes,
          easyMeals: easyMealItems,
        }),
      });
      const data = await res.json();
      if (data.success && data.meal) {
        // Enrich with URL from recipe library
        const libraryMatch = data.meal.recipeId
          ? (recipes || []).find(r => r.id === data.meal.recipeId)
          : null;
        return { ...data.meal, url: libraryMatch?.source || null };
      }
      return null;
    } catch (err) {
      console.error("Regenerate slot error:", err);
      return null;
    }
  }

  async function launchPlan() {
    if (planId) {
      await mealPlan.updatePlanStatus(planId, "active");
      setPlanStatus("active");
    }
    setView("landing");
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: ${t.dim}; }
        input:focus { border-color: ${t.accent} !important; }
        button:hover { opacity: 0.9; }
        a:hover { opacity: 0.85; }
        [draggable="true"] { user-select: none; -webkit-user-select: none; }
      `}</style>
      <Nav />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
        {view === "landing" && (
          <WeeklyPlanLanding
            onStartPlan={startFresh}
            onResumeDraft={resumeDraft}
            onDeleteDraft={deleteDraft}
            hasDraft={planStatus === "draft"}
            planStatus={planStatus}
            recipes={recipes}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            planMeals={planMeals}
            nights={nights}
          />
        )}
        {view === "flow" && (
          <div style={{ padding: "24px 0 40px" }}>
            <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={stepLabels} />
            {currentStepId === "grocery" && (
              <Step0
                groceryItems={groceryList.items}
                loading={groceryList.loading}
                onRemoveItem={groceryList.removeItem}
                onUpdateItem={groceryList.updateItem}
                onClearAll={groceryList.clearAll}
              />
            )}
            {currentStepId === "essentials" && (
              <StockCheck
                title="Essentials Check"
                subtitle="Go through your staples. What do you need this week?"
                initialItems={(essentialItems || []).map(i => ({ id: i.id, name: i.name, defaultQty: i.defaultQty || "" }))}
                loading={essentialsLoading}
                savedDecisions={stockDecisions.essentials}
                onDecisionsChange={(decisions) => setStockDecisions(prev => ({ ...prev, essentials: decisions }))}
              />
            )}
            {currentStepId === "nicetohaves" && (
              <StockCheck
                title="Nice-to-Haves"
                subtitle="Anything extra you want to pick up this week?"
                initialItems={(niceToHaveItems || []).map(i => ({ id: i.id, name: i.name, defaultQty: i.defaultQty || "" }))}
                loading={niceToHavesLoading}
                savedDecisions={stockDecisions.niceToHaves}
                onDecisionsChange={(decisions) => setStockDecisions(prev => ({ ...prev, niceToHaves: decisions }))}
              />
            )}
            {currentStepId === "lastweek" && (
              <Step3
                onNext={nextStep}
                onBack={prevStep}
                onSaveExit={saveAndExit}
                priorEntries={priorPlanEntries}
                onCarryForward={setCarryForwardRecipes}
                savedDecisions={lastWeekDecisions}
                onDecisionsChange={setLastWeekDecisions}
              />
            )}
            {currentStepId === "pick" && <Step4 recipes={recipes} onNext={nextStep} onBack={prevStep} onSaveExit={saveAndExit} pickedRecipes={pickedRecipes} setPickedRecipes={setPickedRecipes} />}
            {currentStepId === "calendar" && <Step5 nights={nights} setNights={setNights} />}
            {currentStepId === "mealplan" && <StepMealPlan onNext={nextStep} onBack={prevStep} onSaveExit={saveAndExit} meals={planMeals} setMeals={setPlanMeals} nights={nights} setNights={setNights} recipes={recipes} onRegenerateSlot={regenerateSlot} />}
            {currentStepId === "grocerylist" && <StepGroceryList onNext={launchPlan} onBack={prevStep} onSaveExit={saveAndExit} meals={planMeals} recipes={recipes} stockDecisions={stockDecisions} pantryStaples={pantryStapleItems} />}
            {!["lastweek", "mealplan", "grocerylist", "pick"].includes(currentStepId) && (
              <StepNav
                onBack={prevStep}
                onNext={currentStepId === "calendar" ? generateMealPlan : nextStep}
                onSaveExit={saveAndExit}
                nextLabel={currentStepId === "calendar" ? (generating ? "Generating..." : "Generate meal plan") : "Continue"}
                showBack={true}
                nextDisabled={currentStepId === "calendar" && generating}
              />
            )}
            {currentStepId === "calendar" && generationError && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: t.dangerDim, border: `1px solid rgba(192,86,75,0.2)`, borderRadius: 8, fontSize: 13, color: t.danger, fontFamily: t.sans }}>
                {generationError}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
