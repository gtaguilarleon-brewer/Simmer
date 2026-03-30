'use client';

import { useState } from 'react';
import Nav from '../../components/Nav';
import { useEssentials, useNiceToHaves, useEasyMeals, usePantryStaples } from '../../hooks/useSettings';
import { t, inputBase, labelBase, btnPrimary, btnSecondary, btnSmall } from '../../lib/theme';
import {
  IconEssentials,
  IconNiceToHaves,
  IconEasyMeals,
  IconPantry,
} from '../../components/Illustrations';

// ─── Icons ───
function ChevronIcon({ dir }) {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s',
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ─── Delete Confirmation Modal ───
function DeleteConfirmationModal({ target, message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          maxWidth: 360,
          width: '100%',
          padding: 28,
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontFamily: t.serif,
            fontSize: 18,
            color: t.text,
            margin: '0 0 10px',
          }}
        >
          {message.title}
        </h3>
        {message.body && (
          <p
            style={{
              fontSize: 14,
              color: t.subtle,
              margin: '0 0 6px',
              fontFamily: t.sans,
            }}
          >
            {message.body}
          </p>
        )}
        {message.subtext && (
          <p
            style={{
              fontSize: 12,
              color: t.dim,
              margin: '0 0 20px',
              fontFamily: t.sans,
            }}
          >
            {message.subtext}
          </p>
        )}
        {!message.subtext && message.body && (
          <div style={{ height: 14 }} />
        )}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            marginTop: message.body ? 0 : 20,
          }}
        >
          <button
            style={{
              ...btnSmall,
              background: t.dangerDim,
              color: t.danger,
              padding: '10px 20px',
            }}
            onClick={onConfirm}
          >
            Remove
          </button>
          <button
            style={{
              ...btnSecondary,
              padding: '10px 20px',
              fontSize: 13,
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ESSENTIALS / NICE-TO-HAVES LIST VIEW
// ═══════════════════════════════════════
function QuantityListView({
  title,
  description,
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBack,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(item.defaultQty);
  }

  function saveEdit() {
    if (editName.trim()) {
      onUpdateItem(editingId, {
        name: editName.trim(),
        defaultQty: editQty.trim(),
      });
    }
    setEditingId(null);
  }

  function addItem() {
    if (!addName.trim()) return;
    onAddItem({
      name: addName.trim(),
      defaultQty: addQty.trim() || '1',
    });
    setAddName('');
    setAddQty('');
    setShowAdd(false);
  }

  function deleteItem() {
    onDeleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div style={{ padding: '24px 0 40px' }}>
      {/* Back + header */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: t.subtle,
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: t.sans,
          padding: '0 0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronIcon dir="left" /> Settings
      </button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: t.serif,
              fontSize: 24,
              color: t.text,
              margin: '0 0 4px',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: t.subtle,
              margin: 0,
              fontFamily: t.sans,
            }}
          >
            {description}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            ...btnPrimary,
            padding: '8px 14px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <PlusIcon /> Add
        </button>
      </div>

      {/* Info callout */}
      <div
        style={{
          background: t.accentDim,
          border: `1px solid rgba(212,147,90,0.15)`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 12,
          color: t.accent,
          fontFamily: t.sans,
        }}
      >
        Default quantities are used during the weekly planning flow. You can
        always adjust for a specific week without changing the default.
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.accent}`,
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={labelBase}>Item name</label>
              <input
                style={inputBase}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g., Almond milk"
                autoFocus
              />
            </div>
            <div>
              <label style={labelBase}>Default qty</label>
              <input
                style={inputBase}
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                placeholder="e.g., 1 carton"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                ...btnPrimary,
                padding: '8px 14px',
                fontSize: 13,
                opacity: addName.trim() ? 1 : 0.4,
                cursor: addName.trim() ? 'pointer' : 'not-allowed',
              }}
              onClick={addItem}
              disabled={!addName.trim()}
            >
              Add item
            </button>
            <button
              style={{
                ...btnSecondary,
                padding: '8px 14px',
                fontSize: 13,
              }}
              onClick={() => {
                setShowAdd(false);
                setAddName('');
                setAddQty('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p
            style={{
              fontSize: 14,
              color: t.subtle,
              fontFamily: t.sans,
              margin: '0 0 4px',
            }}
          >
            No items yet
          </p>
          <p
            style={{
              fontSize: 13,
              color: t.dim,
              fontFamily: t.sans,
              margin: 0,
            }}
          >
            Add your first item to get started
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.accent}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 140px',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <label style={labelBase}>Item name</label>
                      <input
                        style={inputBase}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Default qty</label>
                      <input
                        style={inputBase}
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        ...btnPrimary,
                        padding: '7px 14px',
                        fontSize: 13,
                      }}
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                    <button
                      style={{
                        ...btnSecondary,
                        padding: '7px 14px',
                        fontSize: 13,
                      }}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 18px',
                    background: t.surface,
                    borderRadius: 8,
                    border: `1px solid transparent`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        color: t.text,
                        fontFamily: t.sans,
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: t.dim,
                        fontFamily: t.sans,
                      }}
                    >
                      {item.defaultQty}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => startEdit(item)}
                      style={{
                        padding: 6,
                        background: 'none',
                        border: 'none',
                        color: t.subtle,
                        cursor: 'pointer',
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      style={{
                        padding: 6,
                        background: 'none',
                        border: 'none',
                        color: t.subtle,
                        cursor: 'pointer',
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmationModal
          target={deleteTarget}
          message={{
            title: 'Remove item?',
            body: `"${deleteTarget.name}" will be removed from this list.`,
          }}
          onConfirm={deleteItem}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// INLINE INGREDIENT EDITOR (shared)
// ═══════════════════════════════════════
function InlineIngredientEditor({ ingredients, onUpdate, onRemove, onAdd }) {
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ ...labelBase, marginBottom: 6 }}>
        Ingredients (for grocery list)
      </label>
      <div
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {(ingredients || []).map((ing, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <input
              style={{
                ...inputBase,
                border: 'none',
                background: 'transparent',
                padding: '5px 0',
                fontSize: 13,
                flex: 1,
              }}
              value={ing}
              onChange={(e) => onUpdate(idx, e.target.value)}
              placeholder="e.g., 1 frozen pizza"
            />
            <button
              onClick={() => onRemove(idx)}
              style={{
                background: 'none',
                border: 'none',
                color: t.dim,
                cursor: 'pointer',
                padding: 4,
                fontSize: 15,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'none',
            border: 'none',
            color: t.accent,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: t.sans,
            textAlign: 'left',
            fontWeight: 500,
          }}
        >
          + Add ingredient
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EASY MEALS LIST VIEW
// ═══════════════════════════════════════
function EasyMealsView({ items, onAddItem, onUpdateItem, onDeleteItem, onBack }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIngredients, setEditIngredients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addIngredients, setAddIngredients] = useState(['']);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditIngredients([...(item.ingredients || [])]);
    setExpandedId(null);
  }

  function saveEdit() {
    if (editName.trim()) {
      onUpdateItem(editingId, {
        name: editName.trim(),
        ingredients: editIngredients.filter((x) => x.trim()),
      });
    }
    setEditingId(null);
  }

  function addItem() {
    if (!addName.trim()) return;
    onAddItem({
      name: addName.trim(),
      ingredients: addIngredients.filter((x) => x.trim()),
    });
    setAddName('');
    setAddIngredients(['']);
    setShowAdd(false);
  }

  function deleteItem() {
    onDeleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  function updateEditIng(idx, val) {
    const u = [...editIngredients];
    u[idx] = val;
    setEditIngredients(u);
  }

  function removeEditIng(idx) {
    setEditIngredients(editIngredients.filter((_, i) => i !== idx));
  }

  function addEditIng() {
    setEditIngredients([...editIngredients, '']);
  }

  function updateAddIng(idx, val) {
    const u = [...addIngredients];
    u[idx] = val;
    setAddIngredients(u);
  }

  function removeAddIng(idx) {
    setAddIngredients(addIngredients.filter((_, i) => i !== idx));
  }

  function addAddIng() {
    setAddIngredients([...addIngredients, '']);
  }

  return (
    <div style={{ padding: '24px 0 40px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: t.subtle,
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: t.sans,
          padding: '0 0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronIcon dir="left" /> Settings
      </button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: t.serif,
              fontSize: 24,
              color: t.text,
              margin: '0 0 4px',
            }}
          >
            Easy Meals
          </h1>
          <p
            style={{
              fontSize: 13,
              color: t.subtle,
              margin: 0,
              fontFamily: t.sans,
            }}
          >
            Quick options for nights you&apos;re out.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            ...btnPrimary,
            padding: '8px 14px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <PlusIcon /> Add
        </button>
      </div>

      <div
        style={{
          background: t.accentDim,
          border: `1px solid rgba(212,147,90,0.15)`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 12,
          color: t.accent,
          fontFamily: t.sans,
        }}
      >
        These meals are suggested when a night is marked &quot;just me out&quot;
        during planning.
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.accent}`,
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 12,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <label style={labelBase}>Meal name</label>
            <input
              style={inputBase}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g., Quesadillas"
              autoFocus
            />
          </div>
          <InlineIngredientEditor
            ingredients={addIngredients}
            onUpdate={updateAddIng}
            onRemove={removeAddIng}
            onAdd={addAddIng}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              style={{
                ...btnPrimary,
                padding: '8px 14px',
                fontSize: 13,
                opacity: addName.trim() ? 1 : 0.4,
              }}
              onClick={addItem}
              disabled={!addName.trim()}
            >
              Add meal
            </button>
            <button
              style={{
                ...btnSecondary,
                padding: '8px 14px',
                fontSize: 13,
              }}
              onClick={() => {
                setShowAdd(false);
                setAddName('');
                setAddIngredients(['']);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.accent}`,
                  borderRadius: 10,
                  padding: '16px 18px',
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <label style={labelBase}>Meal name</label>
                  <input
                    style={inputBase}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <InlineIngredientEditor
                  ingredients={editIngredients}
                  onUpdate={updateEditIng}
                  onRemove={removeEditIng}
                  onAdd={addEditIng}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    style={{
                      ...btnPrimary,
                      padding: '7px 14px',
                      fontSize: 13,
                    }}
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                  <button
                    style={{
                      ...btnSecondary,
                      padding: '7px 14px',
                      fontSize: 13,
                    }}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: t.surface,
                  borderRadius: 10,
                  padding: '14px 18px',
                  border: `1px solid transparent`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 15,
                        color: t.text,
                        fontFamily: t.sans,
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === item.id ? null : item.id
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: t.accent,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: t.sans,
                        marginLeft: 10,
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {(item.ingredients || []).length} ingredient
                      {(item.ingredients || []).length !== 1 ? 's' : ''}{' '}
                      <ChevronDown open={expandedId === item.id} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => startEdit(item)}
                      style={{
                        padding: 6,
                        background: 'none',
                        border: 'none',
                        color: t.subtle,
                        cursor: 'pointer',
                      }}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      style={{
                        padding: 6,
                        background: 'none',
                        border: 'none',
                        color: t.subtle,
                        cursor: 'pointer',
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                {expandedId === item.id && (
                  <div
                    style={{
                      marginTop: 10,
                      background: t.bg,
                      borderRadius: 6,
                      padding: '8px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px 16px',
                    }}
                  >
                    {(item.ingredients || []).map((ing, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 12,
                          color: t.muted,
                          fontFamily: t.sans,
                          padding: '4px 0',
                          borderBottom: `1px solid ${t.border}`,
                        }}
                      >
                        {ing}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <DeleteConfirmationModal
          target={deleteTarget}
          message={{
            title: 'Remove meal?',
            body: `"${deleteTarget.name}" will be removed from easy meals.`,
          }}
          onConfirm={deleteItem}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// PANTRY STAPLES VIEW
// ═══════════════════════════════════════
function PantryView({ items, onAddItem, onUpdateItem, onDeleteItem, onBack }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [addValue, setAddValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function addItem() {
    if (!addValue.trim()) return;
    onAddItem({
      name: addValue.trim(),
    });
    setAddValue('');
    setShowAdd(false);
  }

  function saveEdit() {
    if (editName.trim()) {
      onUpdateItem(editingId, {
        name: editName.trim(),
      });
    }
    setEditingId(null);
  }

  function deleteItem() {
    onDeleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div style={{ padding: '24px 0 40px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: t.subtle,
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: t.sans,
          padding: '0 0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronIcon dir="left" /> Settings
      </button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: t.serif,
              fontSize: 24,
              color: t.text,
              margin: '0 0 4px',
            }}
          >
            Pantry Staples
          </h1>
          <p
            style={{
              fontSize: 13,
              color: t.subtle,
              margin: 0,
              fontFamily: t.sans,
            }}
          >
            Items you always have on hand.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            ...btnPrimary,
            padding: '8px 14px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <PlusIcon /> Add
        </button>
      </div>

      <div
        style={{
          background: t.accentDim,
          border: `1px solid rgba(212,147,90,0.15)`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 12,
          color: t.accent,
          fontFamily: t.sans,
        }}
      >
        When a recipe calls for one of these items, it won&apos;t appear on
        your grocery list.
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.accent}`,
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 12,
          }}
        >
          <label style={labelBase}>Item name</label>
          <input
            style={{ ...inputBase, marginBottom: 10 }}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="e.g., Cinnamon"
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                ...btnPrimary,
                padding: '8px 14px',
                fontSize: 13,
                opacity: addValue.trim() ? 1 : 0.4,
              }}
              onClick={addItem}
              disabled={!addValue.trim()}
            >
              Add item
            </button>
            <button
              style={{
                ...btnSecondary,
                padding: '8px 14px',
                fontSize: 13,
              }}
              onClick={() => {
                setShowAdd(false);
                setAddValue('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items as rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.accent}`,
                  borderRadius: 8,
                  padding: '12px 18px',
                }}
              >
                <label style={labelBase}>Item name</label>
                <input
                  style={{ ...inputBase, marginBottom: 10 }}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{
                      ...btnPrimary,
                      padding: '7px 14px',
                      fontSize: 13,
                    }}
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                  <button
                    style={{
                      ...btnSecondary,
                      padding: '7px 14px',
                      fontSize: 13,
                    }}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  background: t.surface,
                  borderRadius: 8,
                  border: '1px solid transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    color: t.text,
                    fontFamily: t.sans,
                    fontWeight: 500,
                  }}
                >
                  {item.name}
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                    }}
                    style={{
                      padding: 6,
                      background: 'none',
                      border: 'none',
                      color: t.subtle,
                      cursor: 'pointer',
                    }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    style={{
                      padding: 6,
                      background: 'none',
                      border: 'none',
                      color: t.subtle,
                      cursor: 'pointer',
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <DeleteConfirmationModal
          target={deleteTarget}
          message={{
            title: 'Remove staple?',
            body: `"${deleteTarget.name}" will be removed from pantry staples.`,
            subtext:
              'It will start showing up on your grocery list when recipes call for it.',
          }}
          onConfirm={deleteItem}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SETTINGS INDEX
// ═══════════════════════════════════════
function SettingsIndex({ onSelect, essentialsCounts, niceHavesCounts, easyMealsCounts, pantryCounts }) {
  const lists = [
    {
      id: 'essentials',
      name: 'Essentials',
      desc: 'Staples you need most weeks',
      count: essentialsCounts,
      icon: <IconEssentials />,
    },
    {
      id: 'nice-to-haves',
      name: 'Nice-to-haves',
      desc: 'Things you like to keep stocked but don\'t always need',
      count: niceHavesCounts,
      icon: <IconNiceToHaves />,
    },
    {
      id: 'easy-meals',
      name: 'Easy meals',
      desc: 'Quick options for nights you\'re out',
      count: easyMealsCounts,
      icon: <IconEasyMeals />,
    },
    {
      id: 'pantry',
      name: 'Pantry staples',
      desc: 'Items excluded from the grocery list by default',
      count: pantryCounts,
      icon: <IconPantry />,
    },
  ];

  return (
    <div style={{ padding: '36px 0 40px' }}>
      <h1
        style={{
          fontFamily: t.serif,
          fontSize: 24,
          color: t.text,
          margin: '0 0 4px',
        }}
      >
        Settings
      </h1>
      <p
        style={{
          fontSize: 14,
          color: t.subtle,
          margin: '0 0 28px',
          fontFamily: t.sans,
        }}
      >
        Manage your lists and preferences
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => onSelect(list.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: '18px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                }}
              >
                {list.icon}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: t.text,
                    fontFamily: t.sans,
                    marginBottom: 2,
                  }}
                >
                  {list.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: t.subtle,
                    fontFamily: t.sans,
                  }}
                >
                  {list.desc}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: t.dim,
                  fontFamily: t.sans,
                }}
              >
                {list.count} items
              </span>
              <span style={{ color: t.subtle }}>
                <ChevronIcon dir="right" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════
export default function SettingsPage() {
  const [view, setView] = useState('index');

  const essentials = useEssentials();
  const niceToHaves = useNiceToHaves();
  const easyMeals = useEasyMeals();
  const pantryStaples = usePantryStaples();

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.sans }}>
      <Nav />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>
        {view === 'index' && (
          <SettingsIndex
            onSelect={setView}
            essentialsCounts={essentials.items.length}
            niceHavesCounts={niceToHaves.items.length}
            easyMealsCounts={easyMeals.items.length}
            pantryCounts={pantryStaples.items.length}
          />
        )}

        {view === 'essentials' && (
          <QuantityListView
            title="Essentials"
            description="Staples you need most weeks. Mark 'have it' or 'need it' during planning."
            items={essentials.items}
            onAddItem={essentials.addItem}
            onUpdateItem={essentials.updateItem}
            onDeleteItem={essentials.deleteItem}
            onBack={() => setView('index')}
          />
        )}

        {view === 'nice-to-haves' && (
          <QuantityListView
            title="Nice-to-haves"
            description="Things you like to keep stocked but don't always need."
            items={niceToHaves.items}
            onAddItem={niceToHaves.addItem}
            onUpdateItem={niceToHaves.updateItem}
            onDeleteItem={niceToHaves.deleteItem}
            onBack={() => setView('index')}
          />
        )}

        {view === 'easy-meals' && (
          <EasyMealsView
            items={easyMeals.items}
            onAddItem={easyMeals.addItem}
            onUpdateItem={easyMeals.updateItem}
            onDeleteItem={easyMeals.deleteItem}
            onBack={() => setView('index')}
          />
        )}

        {view === 'pantry' && (
          <PantryView
            items={pantryStaples.items}
            onAddItem={pantryStaples.addItem}
            onUpdateItem={pantryStaples.updateItem}
            onDeleteItem={pantryStaples.deleteItem}
            onBack={() => setView('index')}
          />
        )}
      </main>
    </div>
  );
}
