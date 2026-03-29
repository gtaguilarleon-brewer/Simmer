"use client";
import { useState, useEffect } from 'react';
import { SearchIcon, CloseIcon } from './Icons';
import { t } from '../lib/theme';
import { supabase } from '../lib/supabase';

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
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('name', { ascending: true });
        if (!error && data) {
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
        (recipe.protein_type && recipe.protein_type.toLowerCase().includes(term)) ||
        (recipe.cuisine_style && recipe.cuisine_style.toLowerCase().includes(term)) ||
        (recipe.meal_type && recipe.meal_type.toLowerCase().includes(term))
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
      maxHeight: 360,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
      }}>
        <span style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: t.text,
          fontFamily: t.sans,
        }}>
          {label}
        </span>
        <button
          onClick={onCancel}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '4px',
            cursor: 'pointer',
            color: t.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            borderRadius: '8px',
            border: `1px solid ${t.border}`,
            fontSize: '13px',
            backgroundColor: t.bg,
            color: t.text,
            outline: 'none',
            fontFamily: t.sans,
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = t.accent; }}
          onBlur={(e) => { e.target.style.borderColor = t.border; }}
        />
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: 260,
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0',
            color: t.muted,
            fontSize: '13px',
            fontFamily: t.sans,
          }}>
            Loading recipes...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0',
            color: t.muted,
            fontSize: '13px',
            fontFamily: t.sans,
            flexDirection: 'column',
            gap: '4px',
          }}>
            <span>No recipes found</span>
            {searchTerm && <span style={{ fontSize: '12px', color: t.dim }}>Try a different search</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${selectedId === recipe.id ? t.accent : t.border}`,
                  background: selectedId === recipe.id ? t.accentDim : t.surface,
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 8,
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== recipe.id) e.currentTarget.style.borderColor = t.dim;
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== recipe.id) e.currentTarget.style.borderColor = t.border;
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: t.text,
                  fontFamily: t.sans,
                  marginBottom: 4,
                }}>
                  {recipe.name}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {recipe.protein_type && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: t.accentDim, color: t.accent, fontFamily: t.sans }}>{recipe.protein_type}</span>
                  )}
                  {recipe.cuisine_style && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: t.border, color: t.muted, fontFamily: t.sans }}>{recipe.cuisine_style}</span>
                  )}
                  {recipe.meal_type && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: t.border, color: t.muted, fontFamily: t.sans }}>{recipe.meal_type}</span>
                  )}
                  {recipe.cook_time && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: t.border, color: t.muted, fontFamily: t.sans }}>{recipe.cook_time}m</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
