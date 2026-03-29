"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useGroceryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addItem(name, qty, category, sources) {
    const { data, error } = await supabase.from('grocery_items').insert([{
      name,
      quantity: qty || 1,
      category: category || 'Other',
      sources: sources || [],
      checked: false,
    }]).select().single();
    if (!error && data) {
      setItems(prev => [...prev, data].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      }));
    }
    return { data, error };
  }

  async function updateItem(id, updates) {
    const updateData = {};
    if (updates.qty !== undefined) updateData.quantity = updates.qty;
    if (updates.checked !== undefined) updateData.checked = updates.checked;
    if (updates.category !== undefined) updateData.category = updates.category;

    const { data, error } = await supabase.from('grocery_items').update(updateData).eq('id', id).select().single();
    if (!error && data) {
      setItems(prev => prev.map(item => item.id === id ? data : item).sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      }));
    }
    return { data, error };
  }

  async function toggleCheck(id) {
    const item = items.find(i => i.id === id);
    if (!item) return { error: new Error('Item not found') };
    return updateItem(id, { checked: !item.checked });
  }

  async function removeItem(id) {
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(item => item.id !== id));
    return { error };
  }

  async function clearChecked() {
    const checkedIds = items.filter(item => item.checked).map(item => item.id);
    if (checkedIds.length === 0) return { error: null };

    const { error } = await supabase.from('grocery_items').delete().in('id', checkedIds);
    if (!error) setItems(prev => prev.filter(item => !item.checked));
    return { error };
  }

  async function clearAll() {
    const { error } = await supabase.from('grocery_items').delete().neq('id', 'null');
    if (!error) setItems([]);
    return { error };
  }

  async function uncheckAll() {
    const itemIds = items.map(item => item.id);
    if (itemIds.length === 0) return { error: null };

    const { error } = await supabase.from('grocery_items').update({ checked: false }).in('id', itemIds);
    if (!error) setItems(prev => prev.map(item => ({ ...item, checked: false })));
    return { error };
  }

  return {
    items,
    loading,
    fetchItems,
    addItem,
    updateItem,
    toggleCheck,
    removeItem,
    clearChecked,
    clearAll,
    uncheckAll,
  };
}
