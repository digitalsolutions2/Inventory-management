const FOODICS_BASE_URL = "https://api-v2.foodics.com/v5";

interface FoodicsProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
}

export async function testFoodicsConnection(
  apiToken: string
): Promise<{ success: true; businessName: string } | { success: false; error: string }> {
  try {
    const res = await fetch(`${FOODICS_BASE_URL}/whoami`, {
      headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json" },
    });

    if (res.status === 401) {
      return { success: false, error: "Invalid API token" };
    }
    if (res.status === 429) {
      return { success: false, error: "Rate limited. Please try again later." };
    }
    if (!res.ok) {
      return { success: false, error: `Foodics API error: ${res.status}` };
    }

    const data = await res.json();
    return { success: true, businessName: data?.data?.name || data?.name || "Connected" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

export async function fetchFoodicsProducts(apiToken: string): Promise<FoodicsProduct[]> {
  const products: FoodicsProduct[] = [];
  let page = 1;
  const maxPages = 20; // Safety limit

  while (page <= maxPages) {
    const res = await fetch(`${FOODICS_BASE_URL}/products?page=${page}`, {
      headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json" },
    });

    if (res.status === 401) throw new Error("Invalid API token");
    if (res.status === 429) throw new Error("Rate limited. Please try again later.");
    if (!res.ok) throw new Error(`Foodics API error: ${res.status}`);

    const data = await res.json();
    const items = data?.data || [];

    for (const item of items) {
      products.push({
        id: item.id,
        name: item.name || item.name_en || "",
        sku: item.sku || null,
        category: item.category?.name || null,
      });
    }

    // Check if there are more pages
    if (!data?.links?.next || items.length === 0) break;
    page++;
  }

  return products;
}
