"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });
    if (!error) setRecipes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  async function addRecipe(recipe) {
    const { data, error } = await supabase.from('recipes').insert([{
      name: recipe.name,
      source: recipe.source || null,
      protein_type: recipe.protein_type || recipe.proteinType || null,
      cuisine_style: recipe.cuisine_style || recipe.cuisineStyle || null,
      meal_type: recipe.meal_type || recipe.mealType || null,
      cook_time: recipe.cook_time || recipe.cookTime || null,
      ingredients: recipe.ingredients || [],
      times_made: recipe.times_made || recipe.timesMade || 0,
    }]).select().single();
    if (!error && data) setRecipes(prev => [data, ...prev]);
    return { data, error };
  }

  async function updateRecipe(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.source !== undefined) payload.source = updates.source || null;
    payload.protein_type = updates.protein_type || updates.proteinType || null;
    payload.cuisine_style = updates.cuisine_style || updates.cuisineStyle || null;
    payload.meal_type = updates.meal_type || updates.mealType || null;
    payload.cook_time = updates.cook_time || updates.cookTime || null;
    if (updates.ingredients !== undefined) payload.ingredients = updates.ingredients || [];
    if (updates.times_made !== undefined || updates.timesMade !== undefined) {
      payload.times_made = updates.times_made ?? updates.timesMade;
    }
    const { data, error } = await supabase.from('recipes').update(payload).eq('id', id).select().single();
    if (!error && data) setRecipes(prev => prev.map(r => r.id === id ? data : r));
    return { data, error };
  }

  async function deleteRecipe(id) {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (!error) setRecipes(prev => prev.filter(r => r.id !== id));
    return { error };
  }

  async function searchRecipes(query) {
    if (!query || query.length < 2) return [];
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .eq('status', 'ACTIVE')
      .ilike('name', `%${query}%`)
      .limit(10);
    return data || [];
  }

  return { recipes, loading, fetchRecipes, addRecipe, updateRecipe, deleteRecipe, searchRecipes };
}
