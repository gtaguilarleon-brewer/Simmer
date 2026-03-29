"use client";
import { useState, useEffect } from 'react';
import { SearchIcon, CloseIcon } from './Icons';
import { t } from '../lib/theme';

export default function RecipePicker({ onSelect, onCancel, label = 'Select a recipe' }) {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/recipes');
        if (response.ok) {
          const data = await response.json();
          setRecipes(data);
          setFilteredRecipes(data);
        }
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(term) ||
        (recipe.description && recipe.description.toLowerCase().includes(term))
      );
      setFilteredRecipes(filtered);
    }
  }, [searchTerm, recipes]);

  const handleSelect = (recipe) => {
    setSelectedId(recipe.id);
    onSelect(recipe);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: t.background,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${t.border}`,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: t.text,
        }}>
          {label}
        </h2>
        <button
          onClick={onCancel}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '8px',
            cursor: 'pointer',
            color: t.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <SearchIcon size={18} style={{
            position: 'absolute',
            left: '12px',
            color: t.muted,
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: `1px solid ${t.border}`,
              fontSize: '14px',
              backgroundColor: t.dim,
              color: t.text,
              transition: 'border-color 150ms',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = t.accent;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = t.border;
            }}
          />
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: t.muted,
            fontSize: '14px',
          }}>
            Loading recipes...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: t.muted,
            fontSize: '14px',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <span>No recipes found</span>
            {searchTerm && <span style={{ fontSize: '12px' }}>Try a different search</span>}
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleSelect(recipe)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: selectedId === recipe.id ? t.dim : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = t.dim;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = selectedId === recipe.id ? t.dim : 'transparent';
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: t.text,
                marginBottom: '4px',
              }}>
                {recipe.name}
              </div>
              {recipe.description && (
                <div style={{
                  fontSize: '12px',
                  color: t.muted,
                  lineHeight: '1.4',
                }}>
                  {recipe.description}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
