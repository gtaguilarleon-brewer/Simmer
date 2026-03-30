"use client";
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useMealPlan() {
  const [planLoading, setPlanLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const fetchPlanForWeek = useCallback(async (weekStart) => {
    setPlanLoading(true);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: planData, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .single();

    let plan = planData || null;
    let entries = [];

    if (plan) {
      setEntriesLoading(true);
      const { data: entriesData, error: entriesError } = await supabase
        .from('meal_plan_entries')
        .select('*')
        .eq('meal_plan_id', plan.id)
        .order('section', { ascending: true })
        .order('created_at', { ascending: true });

      if (!entriesError) entries = entriesData || [];
      setEntriesLoading(false);
    }

    setPlanLoading(false);
    return { plan, entries, error: planError };
  }, []);

  const createPlan = useCallback(async (weekStart) => {
    const { data, error } = await supabase.from('meal_plans').insert([{
      week_start: weekStart.toISOString().split('T')[0],
      status: 'draft',
    }]).select().single();
    return { data, error };
  }, []);

  const updatePlanStatus = useCallback(async (planId, status) => {
    const { data, error } = await supabase.from('meal_plans').update({
      status,
    }).eq('id', planId).select().single();
    return { data, error };
  }, []);

  const saveDraftStep = useCallback(async (planId, step) => {
    const { data, error } = await supabase.from('meal_plans').update({
      draft_step: step,
    }).eq('id', planId).select().single();
    return { data, error };
  }, []);

  const addEntry = useCallback(async (planId, section, mealData) => {
    const { data, error } = await supabase.from('meal_plan_entries').insert([{
      meal_plan_id: planId,
      section,
      recipe_id: mealData.recipeId || null,
      recipe_name: mealData.recipeName || null,
      notes: mealData.notes || null,
      servings: mealData.servings || 1,
    }]).select().single();
    return { data, error };
  }, []);

  const updateEntry = useCallback(async (entryId, updates) => {
    const updateData = {};
    if (updates.section !== undefined) updateData.section = updates.section;
    if (updates.recipeId !== undefined) updateData.recipe_id = updates.recipeId;
    if (updates.recipeName !== undefined) updateData.recipe_name = updates.recipeName;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.servings !== undefined) updateData.servings = updates.servings;

    const { data, error } = await supabase.from('meal_plan_entries').update(updateData).eq('id', entryId).select().single();
    return { data, error };
  }, []);

  const removeEntry = useCallback(async (entryId) => {
    const { error } = await supabase.from('meal_plan_entries').delete().eq('id', entryId);
    return { error };
  }, []);

  const moveEntry = useCallback(async (entryId, newSection) => {
    const { data, error } = await supabase.from('meal_plan_entries').update({
      section: newSection,
    }).eq('id', entryId).select().single();
    return { data, error };
  }, []);

  const deletePlan = useCallback(async (planId) => {
    // Delete entries first, then the plan
    await supabase.from('meal_plan_entries').delete().eq('meal_plan_id', planId);
    const { error } = await supabase.from('meal_plans').delete().eq('id', planId);
    return { error };
  }, []);

  const updateNightContexts = useCallback(async (planId, contexts) => {
    const { data, error } = await supabase.from('meal_plans').update({
      night_contexts: contexts,
    }).eq('id', planId).select().single();
    return { data, error };
  }, []);

  const generateGroceryList = useCallback(async (planId) => {
    const { data: entries, error: entriesError } = await supabase
      .from('meal_plan_entries')
      .select('*')
      .eq('meal_plan_id', planId);

    if (entriesError) return { error: entriesError };

    const groceryItems = [];
    const ingredientMap = new Map();

    for (const entry of entries || []) {
      if (entry.recipe_id) {
        const { data: recipe } = await supabase
          .from('recipes')
          .select('ingredients')
          .eq('id', entry.recipe_id)
          .single();

        if (recipe && recipe.ingredients) {
          for (const ingredient of recipe.ingredients) {
            const key = `${ingredient.name}_${ingredient.category || 'Other'}`;
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key);
              existing.qty += ingredient.qty || 1;
            } else {
              ingredientMap.set(key, {
                name: ingredient.name,
                qty: ingredient.qty || 1,
                category: ingredient.category || 'Other',
                unit: ingredient.unit || null,
              });
            }
          }
        }
      }
    }

    for (const ingredient of ingredientMap.values()) {
      const { data, error } = await supabase.from('grocery_items').insert([{
        name: ingredient.name,
        quantity: ingredient.qty,
        unit: ingredient.unit,
        category: ingredient.category,
        checked: false,
        from_meal_plan: true,
      }]).select().single();

      if (!error && data) groceryItems.push(data);
    }

    return { groceryItems, error: null };
  }, []);

  return {
    planLoading,
    entriesLoading,
    fetchPlanForWeek,
    createPlan,
    updatePlanStatus,
    saveDraftStep,
    addEntry,
    updateEntry,
    removeEntry,
    moveEntry,
    deletePlan,
    updateNightContexts,
    generateGroceryList,
  };
}
