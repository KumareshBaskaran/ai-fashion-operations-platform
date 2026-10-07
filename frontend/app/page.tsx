export const instant = false;

type DashboardData = {
  inventory: {
    total_products: number;
    total_suppliers: number;
    total_stock_units: number;
    low_stock_products: number;
    out_of_stock_products: number;
    inventory_value: number;
  };
  sales: {
    fulfilled_orders: number;
    total_items_sold: number;
    total_revenue: number;
    estimated_cost: number;
    estimated_gross_profit: number;
  };
};

async function getDashboardData(): Promise<DashboardData> {
  const apiBaseUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  const response = await fetch(
    `${apiBaseUrl}/dashboard/overview`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load dashboard");
  }

  return response.json();
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-8">

        <h1 className="mb-8 text-4xl font-bold">
          Fashion AI Operations Dashboard
        </h1>

        <h2 className="mb-4 text-xl font-semibold">
          Inventory
        </h2>

        <div className="mb-10 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Products
            </p>
            <p className="mt-2 text-3xl font-bold">
              {data.inventory.total_products}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Stock Units
            </p>
            <p className="mt-2 text-3xl font-bold">
              {data.inventory.total_stock_units}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Inventory Value
            </p>
            <p className="mt-2 text-3xl font-bold">
              AED {data.inventory.inventory_value.toFixed(2)}
            </p>
          </div>

        </div>

        <h2 className="mb-4 text-xl font-semibold">
          Sales
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Revenue
            </p>
            <p className="mt-2 text-3xl font-bold">
              AED {data.sales.total_revenue.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Fulfilled Orders
            </p>
            <p className="mt-2 text-3xl font-bold">
              {data.sales.fulfilled_orders}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-slate-400">
              Gross Profit
            </p>
            <p className="mt-2 text-3xl font-bold">
              AED {data.sales.estimated_gross_profit.toFixed(2)}
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}