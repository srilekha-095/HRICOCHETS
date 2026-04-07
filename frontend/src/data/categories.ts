export interface Category {
  id: string;
  name: string;
  count: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function formatCategoryName(category: string) {
  return (
    {
      Flowers: "Floral Elegance",
      Animals: "Animal Friends",
      Characters: "Whimsical Characters",
      Combos: "Little Treasures",
      Wearables: "Wearable Art",
      Seasonal: "Seasonal Magic",
    } as Record<string, string>
  )[category] || category;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  const products: { category?: string }[] = await res.json();

  const categoryCountMap: Record<string, number> = {};
  products.forEach((p) => {
    const key = p.category || "Other";
    categoryCountMap[key] = (categoryCountMap[key] || 0) + 1;
  });

  return Object.entries(categoryCountMap).map(([category, count]) => ({
    id: category,
    name: formatCategoryName(category),
    count: `${count} items`,
  }));
}
