"use client";

import { useEffect, useState } from "react";

type SalesSummary = {
  fulfilled_orders: number;
  total_items_sold: number;
  total_revenue: number;
  estimated_cost: number;
  estimated_gross_profit: number;
};

type TopProduct = {
  product_id: number;
  sku: string;
  name: string;
  units_sold: number;
  revenue: number;
};

type DailySales = {
  date: string;
  orders: number;
  items_sold: number;
  revenue: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(value);
}

export default function ReportsPage() {
  const [summary, setSummary] =
    useState<SalesSummary | null>(null);

  const [topProducts, setTopProducts] =
    useState<TopProduct[]>([]);

  const [dailySales, setDailySales] =
    useState<DailySales[]>([]);

  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);

    const [
      summaryResponse,
      topProductsResponse,
      dailySalesResponse,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/reports/sales-summary`),
      fetch(`${API_BASE_URL}/reports/top-products`),
      fetch(`${API_BASE_URL}/reports/daily-sales`),
    ]);

    if (
      !summaryResponse.ok ||
      !topProductsResponse.ok ||
      !dailySalesResponse.ok
    ) {
      alert("Unable to load reporting data");
      setLoading(false);
      return;
    }

    setSummary(await summaryResponse.json());
    setTopProducts(await topProductsResponse.json());
    setDailySales(await dailySalesResponse.json());

    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        Loading reports...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        Unable to load reports.
      </div>
    );
  }

  const grossMargin =
    summary.total_revenue > 0
      ? (
          (summary.estimated_gross_profit /
            summary.total_revenue) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">

      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Reports
        </h1>

        <p className="mt-2 text-slate-400">
          Sales performance and management reporting.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">
          Sales Summary
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Revenue
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(
                summary.total_revenue
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Gross Profit
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(
                summary.estimated_gross_profit
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Gross Margin
            </p>

            <p className="mt-2 text-2xl font-bold">
              {grossMargin}%
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Fulfilled Orders
            </p>

            <p className="mt-2 text-2xl font-bold">
              {summary.fulfilled_orders}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Items Sold
            </p>

            <p className="mt-2 text-2xl font-bold">
              {summary.total_items_sold}
            </p>
          </div>

        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">

        <section className="rounded-xl bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Top Products
          </h2>

          {topProducts.length === 0 ? (
            <p className="text-slate-400">
              No fulfilled sales yet.
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-slate-700 text-sm text-slate-400">
                    <th className="p-3">Product</th>
                    <th className="p-3">Units</th>
                    <th className="p-3">Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {topProducts.map((product) => (
                    <tr
                      key={product.product_id}
                      className="border-b border-slate-800"
                    >

                      <td className="p-3">
                        <div className="font-medium">
                          {product.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {product.sku}
                        </div>
                      </td>

                      <td className="p-3">
                        {product.units_sold}
                      </td>

                      <td className="p-3">
                        {formatCurrency(
                          product.revenue
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

        <section className="rounded-xl bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Daily Sales
          </h2>

          {dailySales.length === 0 ? (
            <p className="text-slate-400">
              No daily sales data yet.
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-slate-700 text-sm text-slate-400">
                    <th className="p-3">Date</th>
                    <th className="p-3">Orders</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {dailySales.map((day) => (
                    <tr
                      key={day.date}
                      className="border-b border-slate-800"
                    >

                      <td className="p-3">
                        {day.date}
                      </td>

                      <td className="p-3">
                        {day.orders}
                      </td>

                      <td className="p-3">
                        {day.items_sold}
                      </td>

                      <td className="p-3">
                        {formatCurrency(day.revenue)}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>

    </div>
  );
}