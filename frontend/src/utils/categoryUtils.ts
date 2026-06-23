import { categoryApi } from '../api/client';
import type { Category } from '../api/types';

const COLORS = ['#3d5349', '#4a6356', '#5f7d6b', '#6d8f7d', '#8aab99', '#a8c4b8'];
const ICONS = ['fa-tag', 'fa-utensils', 'fa-car', 'fa-shopping-cart', 'fa-film', 'fa-home'];

export async function resolveCategoryId(
  name: string,
  categories: Category[],
  type: 'Income' | 'Expense' = 'Expense'
): Promise<{ id: number; categories: Category[] }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category is required');

  const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return { id: existing.categoryId, categories };

  const { data } = await categoryApi.create({
    name: trimmed,
    type,
    color: COLORS[categories.length % COLORS.length],
    icon: ICONS[categories.length % ICONS.length],
  });
  return { id: data.categoryId, categories: [...categories, data] };
}

export async function resolveCategoryIdOptional(
  name: string,
  categories: Category[]
): Promise<{ id: number | null; categories: Category[] }> {
  if (!name.trim()) return { id: null, categories };
  const result = await resolveCategoryId(name, categories, 'Expense');
  return result;
}
