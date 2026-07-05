import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type FoodResult = {
  id: string
  name: string
  brand?: string
  cal100: number
  pro100: number
  carb100: number
  fat100: number
  fibre100: number
  sodium100: number
  source: 'openfoodfacts' | 'local'
}

// Local fallback food library
const LOCAL_FOODS: FoodResult[] = [
  { id: 'l1', name: 'Chicken Breast', cal100: 165, pro100: 31, carb100: 0, fat100: 3.6, fibre100: 0, sodium100: 74, source: 'local' },
  { id: 'l2', name: 'Salmon (Atlantic)', cal100: 208, pro100: 20, carb100: 0, fat100: 13, fibre100: 0, sodium100: 59, source: 'local' },
  { id: 'l3', name: 'Lean Beef Mince', cal100: 215, pro100: 26, carb100: 0, fat100: 12, fibre100: 0, sodium100: 72, source: 'local' },
  { id: 'l4', name: 'Tuna (canned in water)', cal100: 116, pro100: 26, carb100: 0, fat100: 1, fibre100: 0, sodium100: 339, source: 'local' },
  { id: 'l5', name: 'Turkey Breast', cal100: 135, pro100: 29, carb100: 0, fat100: 1, fibre100: 0, sodium100: 64, source: 'local' },
  { id: 'l6', name: 'Eggs (whole)', cal100: 155, pro100: 13, carb100: 1.1, fat100: 11, fibre100: 0, sodium100: 124, source: 'local' },
  { id: 'l7', name: 'Greek Yogurt (0% fat)', cal100: 59, pro100: 10, carb100: 3.6, fat100: 0.4, fibre100: 0, sodium100: 36, source: 'local' },
  { id: 'l8', name: 'Cottage Cheese', cal100: 98, pro100: 11, carb100: 3.4, fat100: 4.3, fibre100: 0, sodium100: 364, source: 'local' },
  { id: 'l9', name: 'Whey Protein Powder', cal100: 380, pro100: 75, carb100: 8, fat100: 6, fibre100: 0, sodium100: 150, source: 'local' },
  { id: 'l10', name: 'White Rice (cooked)', cal100: 130, pro100: 2.7, carb100: 28, fat100: 0.3, fibre100: 0.4, sodium100: 1, source: 'local' },
  { id: 'l11', name: 'Brown Rice (cooked)', cal100: 123, pro100: 2.7, carb100: 26, fat100: 1, fibre100: 1.8, sodium100: 1, source: 'local' },
  { id: 'l12', name: 'Rolled Oats (dry)', cal100: 389, pro100: 17, carb100: 66, fat100: 7, fibre100: 10, sodium100: 2, source: 'local' },
  { id: 'l13', name: 'Sweet Potato', cal100: 86, pro100: 1.6, carb100: 20, fat100: 0.1, fibre100: 3, sodium100: 55, source: 'local' },
  { id: 'l14', name: 'Potato (white)', cal100: 77, pro100: 2, carb100: 17, fat100: 0.1, fibre100: 2.2, sodium100: 6, source: 'local' },
  { id: 'l15', name: 'Banana', cal100: 89, pro100: 1.1, carb100: 23, fat100: 0.3, fibre100: 2.6, sodium100: 1, source: 'local' },
  { id: 'l16', name: 'Apple', cal100: 52, pro100: 0.3, carb100: 14, fat100: 0.2, fibre100: 2.4, sodium100: 1, source: 'local' },
  { id: 'l17', name: 'Pasta (cooked)', cal100: 131, pro100: 5, carb100: 25, fat100: 1.1, fibre100: 1.8, sodium100: 1, source: 'local' },
  { id: 'l18', name: 'Bread (wholegrain)', cal100: 250, pro100: 11, carb100: 41, fat100: 4, fibre100: 6, sodium100: 450, source: 'local' },
  { id: 'l19', name: 'Avocado', cal100: 160, pro100: 2, carb100: 9, fat100: 15, fibre100: 7, sodium100: 7, source: 'local' },
  { id: 'l20', name: 'Almonds', cal100: 579, pro100: 21, carb100: 22, fat100: 50, fibre100: 12.5, sodium100: 1, source: 'local' },
  { id: 'l21', name: 'Olive Oil', cal100: 884, pro100: 0, carb100: 0, fat100: 100, fibre100: 0, sodium100: 2, source: 'local' },
  { id: 'l22', name: 'Peanut Butter', cal100: 588, pro100: 25, carb100: 20, fat100: 50, fibre100: 6, sodium100: 430, source: 'local' },
  { id: 'l23', name: 'Broccoli', cal100: 34, pro100: 2.8, carb100: 7, fat100: 0.4, fibre100: 2.6, sodium100: 33, source: 'local' },
  { id: 'l24', name: 'Spinach', cal100: 23, pro100: 2.9, carb100: 3.6, fat100: 0.4, fibre100: 2.2, sodium100: 79, source: 'local' },
  { id: 'l25', name: 'Blueberries', cal100: 57, pro100: 0.7, carb100: 14, fat100: 0.3, fibre100: 2.4, sodium100: 1, source: 'local' },
  { id: 'l26', name: 'Almond Milk (unsweetened)', cal100: 15, pro100: 0.6, carb100: 0.3, fat100: 1.2, fibre100: 0.2, sodium100: 67, source: 'local' },
  { id: 'l27', name: 'Whole Milk', cal100: 61, pro100: 3.2, carb100: 4.8, fat100: 3.3, fibre100: 0, sodium100: 44, source: 'local' },
  { id: 'l28', name: 'Cheddar Cheese', cal100: 402, pro100: 25, carb100: 1.3, fat100: 33, fibre100: 0, sodium100: 621, source: 'local' },
  { id: 'l29', name: 'Bell Pepper (red)', cal100: 31, pro100: 1, carb100: 6, fat100: 0.3, fibre100: 2.1, sodium100: 4, source: 'local' },
  { id: 'l30', name: 'Zucchini', cal100: 17, pro100: 1.2, carb100: 3.1, fat100: 0.3, fibre100: 1, sodium100: 8, source: 'local' },
]

export async function GET(request: NextRequest) {
  // Session required — sole consumer is the coach nutrition page, and an
  // open OpenFoodFacts proxy invites abuse of our hosting + their API.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (!query || query.length < 2) {
    return NextResponse.json({ foods: LOCAL_FOODS.slice(0, 15) })
  }

  // Filter local library first (instant)
  const localMatches = LOCAL_FOODS.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  )

  // Try Open Food Facts
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=15&fields=id,product_name,brands,nutriments`,
      { signal: controller.signal, next: { revalidate: 3600 } }
    )
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offFoods: FoodResult[] = (data.products ?? []).flatMap((p: any) => {
        const name = (p.product_name ?? '').trim()
        if (!name) return []
        const cal = p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal'] ?? 0
        if (cal <= 0) return []
        return [{
          id: `off_${p.id ?? Math.random()}`,
          name,
          brand: p.brands ?? undefined,
          cal100: Math.round(cal),
          pro100: parseFloat((p.nutriments?.proteins_100g ?? 0).toFixed(1)),
          carb100: parseFloat((p.nutriments?.carbohydrates_100g ?? 0).toFixed(1)),
          fat100: parseFloat((p.nutriments?.fat_100g ?? 0).toFixed(1)),
          fibre100: parseFloat((p.nutriments?.fiber_100g ?? 0).toFixed(1)),
          sodium100: Math.round((p.nutriments?.sodium_100g ?? 0) * 1000),
          source: 'openfoodfacts' as const,
        }]
      })

      // Merge: local first, then OFF results (deduplicate by name)
      const localNames = new Set(localMatches.map(f => f.name.toLowerCase()))
      const merged = [
        ...localMatches,
        ...offFoods.filter(f => !localNames.has(f.name.toLowerCase())).slice(0, 12),
      ]
      return NextResponse.json({ foods: merged })
    }
  } catch {
    // Fall back to local only
  }

  return NextResponse.json({ foods: localMatches })
}
