"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Normalize items from Supabase so the UI always sees { id, name, defaultQty }
// Handles legacy rows where the name column contains JSON like '{"name":"x","defaultQty":"1 qt"}'
function normalizeItem(item) {
  if (!item) return item;
  let name = item.name;
  let defaultQty = item.default_qty || '';

  // Fix legacy: name column contains a JSON string
  if (typeof name === 'string' && name.startsWith('{')) {
    try {
      const parsed = JSON.parse(name);
      name = parsed.name || name;
      defaultQty = defaultQty || parsed.defaultQty || '';
    } catch (e) {
      // not JSON, use as-is
    }
  }
  // Fix legacy: name column contains a plain object (shouldn't happen but just in case)
  if (typeof name === 'object' && name !== null) {
    defaultQty = defaultQty || name.defaultQty || '';
    name = name.name || '';
  }

  return { ...item, name, defaultQty };
}

function useSettingsTable(tableName) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setItems((data || []).map(normalizeItem));
    setLoading(false);
  }, [tableName]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addItem(input) {
    // Accept either a string or { name, defaultQty, ingredients } object
    const name = typeof input === 'string' ? input : input.name;
    const defaultQty = typeof input === 'object' ? (input.defaultQty || '') : '';
    const ingredients = typeof input === 'object' ? (input.ingredients || undefined) : undefined;

    const row = { name, default_qty: defaultQty };
    if (ingredients !== undefined) row.ingredients = ingredients;

    const { data, error } = await supabase.from(tableName).insert([row]).select().single();
    if (!error && data) setItems(prev => [normalizeItem(data), ...prev]);
    return { data, error };
  }

  async function updateItem(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.defaultQty !== undefined) payload.default_qty = updates.defaultQty;
    if (updates.ingredients !== undefined) payload.ingredients = updates.ingredients;

    const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
    if (!error && data) setItems(prev => prev.map(item => item.id === id ? normalizeItem(data) : item));
    return { data, error };
  }

  async function deleteItem(id) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(item => item.id !== id));
    return { error };
  }

  return { items, loading, addItem, updateItem, deleteItem };
}

export function useEssentials() {
  return useSettingsTable('essentials');
}

export function useNiceToHaves() {
  return useSettingsTable('nice_to_haves');
}

export function useEasyMeals() {
  return useSettingsTable('easy_meals');
}

export function usePantryStaples() {
  return useSettingsTable('pantry_staples');
}
