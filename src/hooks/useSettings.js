"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function useSettingsTable(tableName) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }, [tableName]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addItem(name) {
    const { data, error } = await supabase.from(tableName).insert([{
      name,
    }]).select().single();
    if (!error && data) setItems(prev => [data, ...prev]);
    return { data, error };
  }

  async function updateItem(id, updates) {
    const { data, error } = await supabase.from(tableName).update({
      name: updates.name,
    }).eq('id', id).select().single();
    if (!error && data) setItems(prev => prev.map(item => item.id === id ? data : item));
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
