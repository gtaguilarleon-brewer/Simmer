"use client";

import { useState } from "react";
import Nav from "../../components/Nav";
import { useRecipes } from "../../hooks/useRecipes";
import {
  SearchIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  LinkIcon,
  CameraIcon,
  SortIcon,
  ChevronDown,
  ChevronIcon,
  BookIcon,
} from "../../components/Icons";
import Tag from "../../components/Tag";
import { RecipeBookIllustration } from "../../components/Illustrations";
import { t, inputBase, labelBase, btnPrimary, btnSecondary, btnDanger, selectBase } from "../../lib/theme";

const PROTEIN_OPTIONS = [
  "Chicken",
  "Beef",
  "Pork",
  "Salmon",
  "Shrimp",
  "Tofu",
  "Lamb",
  "Turkey",
  "Vegetarian",
  "Other",
];
const CUISINE_OPTIONS = [
  "American",
  "Asian",
  "Chinese",
  "French",
  "Greek",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Thai",
  "Other",
];

// ─── Source Link ───
function SourceLink({ source }) {
  const isCookbook = source?.startsWith("cookbook:");
  const cookbookName = isCookbook ? source.replace("cookbook: ", "") : null;

  if (isCookbook) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          color: t.subtle,
        }}
      >
        <BookIcon /> {cookbookName}
      </span>
    );
  }

  if (!source) return null;

  const domain = source
    .replace(/^https?:\/\/(www\.)?/, "")
    .split("/")[0];
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        color: t.subtle,
        textDecoration: "underline",
        textDecorationColor: t.border,
        textUnderlineOffset: 2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
    >
      <span style={{ flexShrink: 0, color: t.dim }}>
        <LinkIcon />
      </span>
      {domain}
    </a>
  );
}

// ─── Ingredient Expand ───
function IngredientExpand({ ingredients, compact = false }) {
  const [open, setOpen] = useState(false);
  if (!ingredients || ingredients.length === 0) return null;

  return (
    <div style={{ marginTop: compact ? 6 : 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: 12,
          fontWeight: 500,
          color: t.accent,
          fontFamily: t.sans,
        }}
      >
        <span>
          {open ? "Hide" : "View"} ingredients ({ingredients.length})
        </span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            background: t.bg,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: "10px 14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px 16px",
          }}
        >
          {ingredients.map((ing, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 12,
                color: t.muted,
                fontFamily: t.sans,
                padding: "5px 0",
                borderBottom: `1px solid ${t.border}`,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ing}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recipe Card ───
function RecipeCard({ recipe, onEdit, onDelete }) {
  const freqLabel =
    recipe.times_made === 0
      ? null
      : recipe.times_made <= 2
        ? "tried"
        : recipe.times_made <= 5
          ? "regular"
          : "favorite";

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: t.radius,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <h3
              style={{
                fontFamily: t.serif,
                fontSize: 16,
                color: t.text,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {recipe.name}
            </h3>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {recipe.protein_type && (
              <Tag variant="accent">{recipe.protein_type}</Tag>
            )}
            {recipe.cuisine_style && (
              <Tag>{recipe.cuisine_style}</Tag>
            )}
            {recipe.cook_time && <Tag>{recipe.cook_time} min</Tag>}
            {recipe.times_made === 0 && (
              <Tag variant="new">never made</Tag>
            )}
            {freqLabel && (
              <Tag variant="frequency">made {recipe.times_made}x</Tag>
            )}
          </div>
          <SourceLink source={recipe.source} />
          <IngredientExpand ingredients={recipe.ingredients} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 2,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <button
            onClick={onEdit}
            style={{
              padding: 7,
              background: "none",
              border: "none",
              color: t.subtle,
              cursor: "pointer",
              borderRadius: 6,
            }}
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: 7,
              background: "none",
              border: "none",
              color: t.subtle,
              cursor: "pointer",
              borderRadius: 6,
            }}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Editable Ingredient List ───
function EditableIngredients({ ingredients }) {
  const [items, setItems] = useState(ingredients || []);
  const [newItem, setNewItem] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  function updateItem(idx, val) {
    const u = [...items];
    u[idx] = val;
    setItems(u);
  }

  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function addItem() {
    if (!newItem.trim()) return;
    setItems([...items, newItem.trim()]);
    setNewItem("");
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: 12,
          fontWeight: 500,
          color: t.accent,
          fontFamily: t.sans,
        }}
      >
        <span>{isOpen ? "Hide" : "Edit"} ingredients ({items.length})</span>
        <ChevronDown open={isOpen} />
      </button>
      {isOpen && (
        <div
          style={{
            marginTop: 8,
            background: t.bg,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <input
                style={{
                  ...inputBase,
                  border: "none",
                  background: "transparent",
                  padding: "5px 0",
                  fontSize: 13,
                  flex: 1,
                }}
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
              />
              <button
                onClick={() => removeItem(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: t.dim,
                  cursor: "pointer",
                  padding: 4,
                  flexShrink: 0,
                  fontSize: 15,
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
            }}
          >
            <input
              style={{
                ...inputBase,
                border: "none",
                background: "transparent",
                padding: "5px 0",
                fontSize: 13,
                flex: 1,
              }}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="+ Add ingredient"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Recipe Inline ───
function EditRecipeInline({ recipe, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: recipe.name,
    protein_type: recipe.protein_type || "",
    cuisine_style: recipe.cuisine_style || "",
    cook_time: recipe.cook_time?.toString() || "",
    source: recipe.source || "",
  });
  const isCookbook = form.source.startsWith("cookbook:");
  const proteinIsCustom =
    form.protein_type && !PROTEIN_OPTIONS.includes(form.protein_type);
  const cuisineIsCustom =
    form.cuisine_style && !CUISINE_OPTIONS.includes(form.cuisine_style);
  const [showCustomProtein, setShowCustomProtein] = useState(proteinIsCustom);
  const [showCustomCuisine, setShowCustomCuisine] = useState(cuisineIsCustom);

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.accent}`,
        borderRadius: t.radius,
        padding: "18px 20px",
      }}
    >
      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelBase}>Name</label>
        <input
          style={inputBase}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      {/* Metadata row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <label style={labelBase}>Protein</label>
          {showCustomProtein ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...inputBase, flex: 1 }}
                value={form.protein_type}
                onChange={(e) =>
                  setForm({ ...form, protein_type: e.target.value })
                }
                placeholder="Custom protein"
              />
              <button
                onClick={() => {
                  setShowCustomProtein(false);
                  setForm({ ...form, protein_type: "" });
                }}
                style={{
                  background: "none",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.subtle,
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: t.sans,
                  padding: "0 8px",
                  whiteSpace: "nowrap",
                }}
              >
                Use list
              </button>
            </div>
          ) : (
            <select
              style={{ ...selectBase, width: "100%" }}
              value={form.protein_type}
              onChange={(e) => {
                if (e.target.value === "__custom") {
                  setShowCustomProtein(true);
                  setForm({ ...form, protein_type: "" });
                } else {
                  setForm({ ...form, protein_type: e.target.value });
                }
              }}
            >
              <option value="">Select...</option>
              {PROTEIN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__custom">+ Custom</option>
            </select>
          )}
        </div>
        <div>
          <label style={labelBase}>Cuisine</label>
          {showCustomCuisine ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...inputBase, flex: 1 }}
                value={form.cuisine_style}
                onChange={(e) =>
                  setForm({ ...form, cuisine_style: e.target.value })
                }
                placeholder="Custom cuisine"
              />
              <button
                onClick={() => {
                  setShowCustomCuisine(false);
                  setForm({ ...form, cuisine_style: "" });
                }}
                style={{
                  background: "none",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.subtle,
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: t.sans,
                  padding: "0 8px",
                  whiteSpace: "nowrap",
                }}
              >
                Use list
              </button>
            </div>
          ) : (
            <select
              style={{ ...selectBase, width: "100%" }}
              value={form.cuisine_style}
              onChange={(e) => {
                if (e.target.value === "__custom") {
                  setShowCustomCuisine(true);
                  setForm({ ...form, cuisine_style: "" });
                } else {
                  setForm({ ...form, cuisine_style: e.target.value });
                }
              }}
            >
              <option value="">Select...</option>
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom">+ Custom</option>
            </select>
          )}
        </div>
        <div>
          <label style={labelBase}>Cook time (min)</label>
          <input
            style={inputBase}
            type="number"
            value={form.cook_time}
            onChange={(e) => setForm({ ...form, cook_time: e.target.value })}
            placeholder="e.g., 30"
          />
        </div>
      </div>
      {/* Source URL */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelBase}>
          Source {isCookbook ? "(cookbook)" : "(URL)"}
        </label>
        <input
          style={inputBase}
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
          placeholder={isCookbook ? "cookbook: Book Name" : "https://..."}
        />
      </div>
      {/* Editable ingredients */}
      <div style={{ marginBottom: 14 }}>
        <EditableIngredients ingredients={recipe.ingredients} />
      </div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={btnPrimary} onClick={() => onSave(form)}>
          Save
        </button>
        <button style={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Ingredient Review ───
function IngredientReview({ ingredients, onChange }) {
  const [items, setItems] = useState(ingredients);
  const [newItem, setNewItem] = useState("");

  function updateItem(idx, val) {
    const updated = [...items];
    updated[idx] = val;
    setItems(updated);
    onChange(updated);
  }

  function removeItem(idx) {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    onChange(updated);
  }

  function addItem() {
    if (!newItem.trim()) return;
    const updated = [...items, newItem.trim()];
    setItems(updated);
    setNewItem("");
    onChange(updated);
  }

  return (
    <div>
      <label style={{ ...labelBase, marginBottom: 8 }}>
        Ingredients ({items.length})
      </label>
      <div
        style={{
          background: t.bg,
          borderRadius: 8,
          border: `1px solid ${t.border}`,
          overflow: "hidden",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderBottom:
                idx < items.length - 1 ? `1px solid ${t.border}` : "none",
            }}
          >
            <input
              style={{
                ...inputBase,
                border: "none",
                background: "transparent",
                padding: "4px 0",
                fontSize: 13,
              }}
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
            />
            <button
              onClick={() => removeItem(idx)}
              style={{
                background: "none",
                border: "none",
                color: t.dim,
                cursor: "pointer",
                padding: 4,
                flexShrink: 0,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderTop: items.length > 0 ? `1px solid ${t.border}` : "none",
          }}
        >
          <input
            style={{
              ...inputBase,
              border: "none",
              background: "transparent",
              padding: "4px 0",
              fontSize: 13,
            }}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="+ Add ingredient"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Add Recipe Modal ───
function AddRecipeModal({ onClose }) {
  const [mode, setMode] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(null);
  const [formProtein, setFormProtein] = useState("");
  const [formCuisine, setFormCuisine] = useState("");
  const [showCustomProtein, setShowCustomProtein] = useState(false);
  const [showCustomCuisine, setShowCustomCuisine] = useState(false);
  const [ingredients, setIngredients] = useState([]);

  function simulateFetch() {
    setLoading(true);
    setTimeout(() => {
      const mockIngredients = [
        "1 can chickpeas, drained",
        "1/4 cup fresh parsley",
        "1/4 cup fresh cilantro",
        "1/2 onion, quartered",
        "3 cloves garlic",
        "1 tsp cumin",
        "1 tsp coriander",
        "3 tbsp flour",
        "olive oil for frying",
        "pita bread",
        "tahini sauce",
      ];
      setFetched({
        name: "Crispy Baked Falafel",
        protein_type: "Vegetarian",
        cuisine_style: "Middle Eastern",
        cook_time: 35,
        source: url,
      });
      setFormProtein("Vegetarian");
      setFormCuisine("Middle Eastern");
      setIngredients(mockIngredients);
      setLoading(false);
    }, 1500);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          maxWidth: 520,
          width: "100%",
          padding: 28,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              fontFamily: t.serif,
              fontSize: 22,
              color: t.text,
              margin: 0,
            }}
          >
            Add Recipe
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: t.subtle,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Mode selection */}
        {!mode && !fetched && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => setMode("url")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: t.accentDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: t.accent,
                  flexShrink: 0,
                }}
              >
                <LinkIcon />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: t.text,
                    fontFamily: t.sans,
                    marginBottom: 3,
                  }}
                >
                  Paste a URL
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: t.subtle,
                    fontFamily: t.sans,
                  }}
                >
                  From any recipe website
                </div>
              </div>
            </button>
            <button
              onClick={() => setMode("photo")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: t.accentDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: t.accent,
                  flexShrink: 0,
                }}
              >
                <CameraIcon />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: t.text,
                    fontFamily: t.sans,
                    marginBottom: 3,
                  }}
                >
                  Cookbook photo
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: t.subtle,
                    fontFamily: t.sans,
                  }}
                >
                  Snap a page from a physical cookbook
                </div>
              </div>
            </button>
          </div>
        )}

        {/* URL input */}
        {mode === "url" && !fetched && (
          <div>
            <label style={labelBase}>Recipe URL</label>
            <input
              style={{ ...inputBase, marginBottom: 14 }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px 0",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${t.border}`,
                    borderTop: `2px solid ${t.accent}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: t.subtle,
                    fontFamily: t.sans,
                  }}
                >
                  Fetching recipe...
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    ...btnPrimary,
                    flex: 1,
                    opacity: url ? 1 : 0.4,
                    cursor: url ? "pointer" : "not-allowed",
                  }}
                  onClick={simulateFetch}
                  disabled={!url}
                >
                  Fetch Recipe
                </button>
                <button
                  style={btnSecondary}
                  onClick={() => setMode(null)}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* Photo upload */}
        {mode === "photo" && !fetched && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelBase}>Cookbook name</label>
              <input
                style={inputBase}
                placeholder="e.g. Salt Fat Acid Heat, Joy of Cooking"
              />
              <div
                style={{
                  fontSize: 11,
                  color: t.dim,
                  fontFamily: t.sans,
                  marginTop: 4,
                }}
              >
                Helps you find this recipe later by source
              </div>
            </div>
            <div
              style={{
                border: `2px dashed ${t.border}`,
                borderRadius: 12,
                padding: "40px 20px",
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              <div style={{ color: t.subtle, marginBottom: 8 }}>
                <CameraIcon />
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: t.muted,
                  margin: "0 0 4px",
                  fontFamily: t.sans,
                }}
              >
                Drag a photo or tap to upload
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: t.dim,
                  margin: 0,
                  fontFamily: t.sans,
                }}
              >
                We'll extract the recipe using AI vision
              </p>
            </div>
            <button style={btnSecondary} onClick={() => setMode(null)}>
              Back
            </button>
          </div>
        )}

        {/* Review fetched recipe */}
        {fetched && (
          <div>
            <div
              style={{
                background: t.bg,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: "#81c784",
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: t.muted,
                  fontFamily: t.sans,
                }}
              >
                Recipe found. Review details and ingredients before adding.
              </span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelBase}>Name</label>
              <input style={inputBase} defaultValue={fetched.name} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={labelBase}>Protein</label>
                {showCustomProtein ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={{ ...inputBase, flex: 1 }}
                      value={formProtein}
                      onChange={(e) => setFormProtein(e.target.value)}
                      placeholder="Custom protein"
                    />
                    <button
                      onClick={() => {
                        setShowCustomProtein(false);
                        setFormProtein("");
                      }}
                      style={{
                        background: "none",
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        color: t.subtle,
                        cursor: "pointer",
                        fontSize: 11,
                        fontFamily: t.sans,
                        padding: "0 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Use list
                    </button>
                  </div>
                ) : (
                  <select
                    style={{ ...selectBase, width: "100%" }}
                    value={formProtein}
                    onChange={(e) => {
                      if (e.target.value === "__custom") {
                        setShowCustomProtein(true);
                        setFormProtein("");
                      } else {
                        setFormProtein(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select...</option>
                    {PROTEIN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="__custom">+ Custom</option>
                  </select>
                )}
              </div>
              <div>
                <label style={labelBase}>Cuisine</label>
                {showCustomCuisine ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={{ ...inputBase, flex: 1 }}
                      value={formCuisine}
                      onChange={(e) => setFormCuisine(e.target.value)}
                      placeholder="Custom cuisine"
                    />
                    <button
                      onClick={() => {
                        setShowCustomCuisine(false);
                        setFormCuisine("");
                      }}
                      style={{
                        background: "none",
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        color: t.subtle,
                        cursor: "pointer",
                        fontSize: 11,
                        fontFamily: t.sans,
                        padding: "0 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Use list
                    </button>
                  </div>
                ) : (
                  <select
                    style={{ ...selectBase, width: "100%" }}
                    value={formCuisine}
                    onChange={(e) => {
                      if (e.target.value === "__custom") {
                        setShowCustomCuisine(true);
                        setFormCuisine("");
                      } else {
                        setFormCuisine(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select...</option>
                    {CUISINE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom">+ Custom</option>
                  </select>
                )}
              </div>
              <div>
                <label style={labelBase}>Cook time (min)</label>
                <input
                  style={inputBase}
                  type="number"
                  defaultValue={fetched.cook_time}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <IngredientReview
                ingredients={ingredients}
                onChange={setIngredients}
              />
              <p
                style={{
                  fontSize: 11,
                  color: t.dim,
                  margin: "6px 0 0",
                  fontFamily: t.sans,
                }}
              >
                AI-extracted. Edit quantities, remove duplicates, or add missing
                items.
              </p>
            </div>

            <a
              href={fetched.source}
              style={{
                display: "block",
                fontSize: 12,
                color: t.dim,
                textDecoration: "none",
                marginBottom: 16,
                wordBreak: "break-all",
                fontFamily: t.sans,
              }}
            >
              {fetched.source}
            </a>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ ...btnPrimary, flex: 1 }}
                onClick={onClose}
              >
                Add to Library
              </button>
              <button style={btnSecondary} onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Import Banner ───
function ImportBanner({ count, onReview }) {
  return (
    <div
      style={{
        background: t.accentDim,
        border: `1px solid rgba(212,147,90,0.2)`,
        borderRadius: t.radius,
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: t.accent,
            fontFamily: t.sans,
          }}
        >
          {count} recipes pending review
        </span>
        <span style={{ fontSize: 13, color: t.muted, fontFamily: t.sans, marginLeft: 8 }}>
          from your CSV import
        </span>
      </div>
      <button
        style={{
          ...btnPrimary,
          padding: "8px 16px",
          fontSize: 13,
        }}
        onClick={onReview}
      >
        Review batch
      </button>
    </div>
  );
}

// ─── Delete Confirmation ───
function DeleteConfirm({ recipe, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          maxWidth: 380,
          width: "100%",
          padding: 28,
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontFamily: t.serif,
            fontSize: 18,
            color: t.text,
            margin: "0 0 10px",
          }}
        >
          Delete recipe?
        </h3>
        <p
          style={{
            fontSize: 14,
            color: t.subtle,
            margin: "0 0 20px",
            fontFamily: t.sans,
            lineHeight: 1.5,
          }}
        >
          "{recipe.name}" will be permanently removed from your library.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            style={{ ...btnDanger, padding: "10px 20px" }}
            onClick={onConfirm}
          >
            Delete
          </button>
          <button style={btnSecondary} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───
function EmptyLibrary({ onImport, onAdd }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <RecipeBookIllustration />
      </div>
      <h2
        style={{
          fontFamily: t.serif,
          fontSize: 22,
          color: t.text,
          margin: "0 0 8px",
        }}
      >
        Your library is empty
      </h2>
      <p
        style={{
          fontSize: 14,
          color: t.subtle,
          margin: "0 0 28px",
          maxWidth: 320,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
          fontFamily: t.sans,
        }}
      >
        Import your recipe collection from a CSV, or add recipes one at a time
        by URL or cookbook photo.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button style={btnPrimary} onClick={onImport}>
          Import CSV
        </button>
        <button style={btnSecondary} onClick={onAdd}>
          Add a recipe
        </button>
      </div>
    </div>
  );
}

// ─── No Results ───
function NoResults({ query, onClear }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <p style={{ fontSize: 15, color: t.subtle, margin: "0 0 4px", fontFamily: t.sans }}>
        No recipes match "{query}"
      </p>
      <p style={{ fontSize: 13, color: t.dim, margin: "0 0 20px", fontFamily: t.sans }}>
        Try adjusting your search or filters
      </p>
      <button style={btnSecondary} onClick={onClear}>
        Clear search
      </button>
    </div>
  );
}

// ─── Main Page ───
export default function RecipesPage() {
  const { recipes, loading, pendingCount } = useRecipes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState("");
  const [protein, setProtein] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxCookTime, setMaxCookTime] = useState("");
  const [sortKey, setSortKey] = useState("name-asc");
  const [showEmpty, setShowEmpty] = useState(false);

  const filtered = (recipes || [])
    .filter((r) => {
      if (
        query &&
        !r.name.toLowerCase().includes(query.toLowerCase()) &&
        !(
          r.source &&
          r.source.toLowerCase().includes(query.toLowerCase())
        )
      )
        return false;
      if (protein && r.protein_type !== protein) return false;
      if (cuisine && r.cuisine_style !== cuisine) return false;
      if (maxCookTime && r.cook_time > parseInt(maxCookTime)) return false;
      return true;
    })
    .sort((a, b) => {
      const [field, dir] = sortKey.split("-");
      const mult = dir === "asc" ? 1 : -1;
      if (field === "name") return mult * a.name.localeCompare(b.name);
      if (field === "timesMade")
        return mult * ((a.times_made || 0) - (b.times_made || 0));
      if (field === "cookTime")
        return mult * ((a.cook_time || 999) - (b.cook_time || 999));
      return 0;
    });

  const hasActiveFilters = query || protein || cuisine || maxCookTime;

  function clearFilters() {
    setQuery("");
    setProtein("");
    setCuisine("");
    setMaxCookTime("");
  }

  if (loading) {
    return (
      <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.sans }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');
          * { box-sizing: border-box; margin: 0; }
        `}</style>
        <Nav activeTab="library" onNavigate={() => {}} />
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
          <div
            style={{
              padding: "36px 0 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: `2px solid ${t.border}`,
                  borderTop: `2px solid ${t.accent}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ fontSize: 14, color: t.subtle, fontFamily: t.sans }}>
                Loading recipes...
              </p>
            </div>
          </div>
        </main>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: t.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; }
        input::placeholder, select { color: ${t.dim}; }
        input:focus, select:focus { border-color: ${t.accent} !important; }
        button:hover { opacity: 0.9; }
        a:hover { color: ${t.muted} !important; text-decoration-color: ${t.subtle} !important; }
      `}</style>

      <Nav activeTab="library" onNavigate={() => {}} />

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ padding: "36px 0 40px" }}>
          {showEmpty || recipes.length === 0 ? (
            <EmptyLibrary
              onImport={() => {}}
              onAdd={() => setShowAddModal(true)}
            />
          ) : (
            <>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h1
                    style={{
                      fontFamily: t.serif,
                      fontSize: 24,
                      color: t.text,
                      margin: 0,
                    }}
                  >
                    Recipe Library
                  </h1>
                  <p
                    style={{
                      fontSize: 14,
                      color: t.subtle,
                      margin: "4px 0 0",
                    }}
                  >
                    {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
                    {hasActiveFilters ? " found" : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={btnPrimary}
                    onClick={() => setShowAddModal(true)}
                  >
                    + Add
                  </button>
                  <button style={btnSecondary}>Import CSV</button>
                </div>
              </div>

              {/* Pending banner */}
              {pendingCount > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <ImportBanner
                    count={pendingCount}
                    onReview={() => {}}
                  />
                </div>
              )}

              {/* Search */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <SearchIcon />
                </div>
                <input
                  style={{ ...inputBase, paddingLeft: 36 }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search recipes..."
                />
              </div>

              {/* Filters row + Sort */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <select
                    style={selectBase}
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  >
                    <option value="">All proteins</option>
                    {PROTEIN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <select
                    style={selectBase}
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                  >
                    <option value="">All cuisines</option>
                    {CUISINE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    style={selectBase}
                    value={maxCookTime}
                    onChange={(e) => setMaxCookTime(e.target.value)}
                  >
                    <option value="">Any cook time</option>
                    <option value="15">Under 15 min</option>
                    <option value="30">Under 30 min</option>
                    <option value="45">Under 45 min</option>
                    <option value="60">Under 1 hour</option>
                  </select>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "transparent",
                        color: t.accent,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: t.sans,
                        fontWeight: 500,
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color: t.dim,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <SortIcon />
                  </span>
                  <select
                    style={{
                      ...selectBase,
                      background: "transparent",
                      border: "none",
                      color: t.subtle,
                      fontWeight: 500,
                      paddingLeft: 0,
                      paddingRight: 4,
                    }}
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                  >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="timesMade-desc">Most made</option>
                    <option value="timesMade-asc">Least made</option>
                    <option value="cookTime-asc">Quickest</option>
                    <option value="cookTime-desc">Longest</option>
                  </select>
                </div>
              </div>

              {/* Recipe list */}
              {filtered.length === 0 ? (
                <NoResults
                  query={query || "current filters"}
                  onClear={clearFilters}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {filtered.map((recipe) =>
                    editingId === recipe.id ? (
                      <EditRecipeInline
                        key={recipe.id}
                        recipe={recipe}
                        onSave={() => setEditingId(null)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onEdit={() => setEditingId(recipe.id)}
                        onDelete={() => setDeleteTarget(recipe)}
                      />
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showAddModal && <AddRecipeModal onClose={() => setShowAddModal(false)} />}
      {deleteTarget && (
        <DeleteConfirm
          recipe={deleteTarget}
          onConfirm={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
