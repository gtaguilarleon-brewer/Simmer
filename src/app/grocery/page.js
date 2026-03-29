"use client";

import { useState } from "react";
import Nav from "../../components/Nav";
import { useGroceryList } from "../../hooks/useGroceryList";
import { GroceryBagIllustration, AllDoneIllustration } from "../../components/Illustrations";
import { CheckIcon, ChevronDown, PlusIcon, UndoIcon } from "../../components/Icons";
import { t, inputBase, labelBase, btnPrimary } from "../../lib/theme";
import { CATEGORY_ORDER, detectCategory } from "../../lib/categories";

export default function GroceryPage() {
  const { items, loading, addItem, updateItem, toggleCheck, removeItem, clearChecked, clearAll, uncheckAll } = useGroceryList();
  const [collapsedCats, setCollapsedCats] = useState({});
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [detectedCat, setDetectedCat] = useState("Other");
  const [catOverride, setCatOverride] = useState(null);
  const [editingQty, setEditingQty] = useState(null);
  const [showSources, setShowSources] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const activeCat = catOverride || detectedCat;

  // Separate active and done items
  const activeItems = items.filter((i) => !i.checked);
  const doneItems = items.filter((i) => i.checked);
  const totalCount = items.length;
  const doneCount = doneItems.length;

  // Group active items by category in store order
  const groupedActive = {};
  CATEGORY_ORDER.forEach((cat) => {
    groupedActive[cat] = [];
  });
  activeItems.forEach((item) => {
    const cat = item.category || "Other";
    if (!groupedActive[cat]) groupedActive[cat] = [];
    groupedActive[cat].push(item);
  });

  // Progress percentage
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  function handleItemChange(val) {
    setNewItem(val);
    if (val.trim()) {
      setDetectedCat(detectCategory(val.trim()));
      if (!catOverride) setCatOverride(null);
    } else {
      setDetectedCat("Other");
    }
  }

  function handleAddItem() {
    if (!newItem.trim()) return;
    const cat = activeCat;
    const qty = newQty.trim() || "1";
    addItem(newItem.trim(), qty, cat, [{ from: "Added manually", qty }]);
    setNewItem("");
    setNewQty("");
    setDetectedCat("Other");
    setCatOverride(null);
  }

  function toggleCollapse(cat) {
    setCollapsedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function handleRemoveItem(id) {
    removeItem(id);
  }

  function handleToggleCheck(id) {
    toggleCheck(id);
  }

  function handleUpdateQty(id, qty) {
    updateItem(id, { qty });
  }

  function handleClearChecked() {
    clearChecked();
  }

  function handleClearAll() {
    clearAll();
    setConfirmClearAll(false);
  }

  function handleUncheckAll() {
    uncheckAll();
  }

  if (loading) {
    return (
      <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.sans }}>
        <Nav />
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>
          <p style={{ color: t.text, textAlign: "center" }}>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: ${t.dim}; }
        input:focus { border-color: ${t.accent} !important; }
        select { color: ${t.text}; }
        option { background: ${t.surface}; color: ${t.text}; }
      `}</style>
      <Nav />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>
        {/* Header with progress */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: t.serif, fontSize: 24, color: t.text, margin: "0 0 4px" }}>Grocery List</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.border, overflow: "hidden" }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 2,
                  background: progress === 100 ? t.green : t.accent,
                  transition: "width 0.3s",
                }}
              />
            </div>
            {!confirmClearAll ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 12, color: progress === 100 ? t.green : t.muted, fontFamily: t.sans, fontWeight: 500 }}>
                  {doneCount} of {totalCount} done
                </span>
                {totalCount > 0 && (
                  <>
                    <span style={{ color: t.border }}>|</span>
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        color: t.subtle,
                        fontFamily: t.sans,
                        padding: 0,
                      }}
                    >
                      Clear list
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 12, color: t.muted, fontFamily: t.sans }}>Remove all?</span>
                <button
                  onClick={() => {
                    handleClearAll();
                  }}
                  style={{
                    background: t.dangerDim,
                    border: `1px solid rgba(192,86,75,0.25)`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    color: t.danger,
                    fontFamily: t.sans,
                    padding: "3px 8px",
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  style={{
                    background: "none",
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    color: t.subtle,
                    fontFamily: t.sans,
                    padding: "3px 8px",
                  }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick add */}
        <div style={{ background: t.surface, borderRadius: 10, padding: "14px 16px", border: `1px solid ${t.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.text }}>
                  <PlusIcon size={14} />
                </div>
                <input
                  style={{ ...inputBase, paddingLeft: 32, fontSize: 14 }}
                  value={newItem}
                  onChange={(e) => handleItemChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  placeholder="Add an item..."
                />
              </div>
            </div>
            <div style={{ width: 90 }}>
              <input
                style={{ ...inputBase, textAlign: "right", fontSize: 14 }}
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                placeholder="Qty"
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              style={{ ...btnPrimary, padding: "9px 14px", fontSize: 13, opacity: newItem.trim() ? 1 : 0.4, flexShrink: 0 }}
            >
              Add
            </button>
          </div>
          {newItem.trim() && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: t.subtle, fontFamily: t.sans }}>Category:</span>
              <select
                style={{ ...inputBase, width: "auto", padding: "3px 8px", fontSize: 12 }}
                value={activeCat}
                onChange={(e) => setCatOverride(e.target.value)}
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {!catOverride && detectedCat !== "Other" && (
                <span style={{ fontSize: 11, color: t.accent, fontFamily: t.sans }}>auto-detected</span>
              )}
            </div>
          )}
        </div>

        {/* Active items by store zone */}
        {CATEGORY_ORDER.map((cat) => {
          const catItems = groupedActive[cat] || [];
          if (catItems.length === 0) return null;
          const isCollapsed = collapsedCats[cat];

          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              {/* Category header */}
              <button
                onClick={() => toggleCollapse(cat)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <div style={{ color: t.text }}>
                  <ChevronDown open={!isCollapsed} size={14} />
                </div>
                <span style={{ ...labelBase, margin: 0, fontSize: 12 }}>{cat}</span>
                <span style={{ fontSize: 11, color: t.dim, fontFamily: t.sans }}>({catItems.length})</span>
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {catItems.map((item) => {
                    const isEditingQty = editingQty === item.id;
                    const isShowingSources = showSources === item.id;
                    const qty = item.quantity || item.qty || "1";

                    return (
                      <div key={item.id} style={{ background: t.surface, borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleCheck(item.id)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: `2px solid ${t.border}`,
                              background: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              padding: 0,
                            }}
                          />
                          {/* Name */}
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              color: t.text,
                              fontFamily: t.sans,
                              fontWeight: 500,
                              minWidth: 0,
                              cursor: "pointer",
                            }}
                            onClick={() => setShowSources(isShowingSources ? null : item.id)}
                          >
                            {item.name}
                          </span>
                          {/* Qty */}
                          {isEditingQty ? (
                            <input
                              autoFocus
                              style={{ ...inputBase, width: 80, padding: "4px 8px", fontSize: 12, textAlign: "right" }}
                              value={qty}
                              onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                              onBlur={() => setEditingQty(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditingQty(null)}
                            />
                          ) : (
                            <span
                              onClick={() => setEditingQty(item.id)}
                              style={{
                                fontSize: 13,
                                color: t.muted,
                                fontFamily: t.sans,
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: t.bg,
                                border: `1px solid transparent`,
                                minWidth: 50,
                                textAlign: "right",
                              }}
                            >
                              {qty}
                            </span>
                          )}
                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: t.dim,
                              cursor: "pointer",
                              padding: 2,
                              fontSize: 16,
                              lineHeight: 1,
                              flexShrink: 0,
                            }}
                          >
                            &times;
                          </button>
                        </div>
                        {/* Source tags (expanded) */}
                        {isShowingSources && item.sources && item.sources.length > 0 && (
                          <div style={{ marginTop: 8, marginLeft: 32, display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {item.sources.map((s, si) => (
                              <span
                                key={si}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(212,147,90,0.1)",
                                  color: t.muted,
                                  fontFamily: t.sans,
                                }}
                              >
                                {s.qty} <span style={{ color: t.subtle }}>{s.from}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Done section */}
        {doneItems.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ ...labelBase, margin: 0, color: t.dim }}>Done ({doneItems.length})</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  onClick={handleClearChecked}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: t.subtle,
                    fontFamily: t.sans,
                    padding: "4px 0",
                  }}
                >
                  Clear checked
                </button>
                <span style={{ color: t.border }}>|</span>
                <button
                  onClick={handleUncheckAll}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: t.subtle,
                    fontFamily: t.sans,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 0",
                  }}
                >
                  <div style={{ display: "flex", color: t.subtle }}>
                    <UndoIcon size={14} />
                  </div>
                  Uncheck all
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, opacity: 0.5 }}>
              {doneItems.map((item) => {
                const qty = item.quantity || item.qty || "1";
                return (
                  <div key={item.id} style={{ background: t.surface, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Checked checkbox */}
                      <button
                        onClick={() => handleToggleCheck(item.id)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `2px solid ${t.accent}`,
                          background: t.accentDim,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          padding: 0,
                          color: t.accent,
                        }}
                      >
                        <CheckIcon size={14} />
                      </button>
                      {/* Name (struck through) */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: t.dim,
                          fontFamily: t.sans,
                          fontWeight: 500,
                          textDecoration: "line-through",
                        }}
                      >
                        {item.name}
                      </span>
                      {/* Qty */}
                      <span style={{ fontSize: 13, color: t.dim, fontFamily: t.sans }}>{qty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalCount === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ marginBottom: 12 }}>
              <GroceryBagIllustration />
            </div>
            <p style={{ fontFamily: t.serif, fontSize: 18, color: t.muted, margin: "0 0 6px" }}>Your list is empty</p>
            <p style={{ fontSize: 13, color: t.dim, fontFamily: t.sans, margin: 0 }}>
              Items will show up here after you plan your week, or you can add them anytime.
            </p>
          </div>
        )}

        {/* All done state */}
        {totalCount > 0 && activeItems.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: t.greenDim,
              borderRadius: 12,
              marginTop: 8,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <AllDoneIllustration />
            </div>
            <p style={{ fontFamily: t.serif, fontSize: 18, color: t.green, margin: "0 0 4px" }}>All done!</p>
            <p style={{ fontSize: 13, color: t.muted, fontFamily: t.sans, margin: 0 }}>
              {doneCount} items checked off this week.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
