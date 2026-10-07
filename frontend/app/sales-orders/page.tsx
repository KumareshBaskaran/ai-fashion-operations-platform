"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  sku: string;
  name: string;
  selling_price: number;
  stock_quantity: number;
};

type SalesOrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
};

type SalesOrder = {
  id: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  reference: string | null;
  created_at: string;
  fulfilled_at: string | null;
  items: SalesOrderItem[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reference, setReference] = useState("");

  const [items, setItems] = useState([
    {
      product_id: "",
      quantity: "1",
      unit_price: "",
    },
  ]);

  async function loadData() {
    setLoading(true);

    const [ordersRes, productsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sales-orders`),
      fetch(`${API_BASE_URL}/products`),
    ]);

    setOrders(await ordersRes.json());
    setProducts(await productsRes.json());

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function addItem() {
    setItems([
      ...items,
      {
        product_id: "",
        quantity: "1",
        unit_price: "",
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;

    setItems(
      items.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function updateItem(
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (field === "product_id") {
      const product = products.find(
        (p) => p.id === Number(value)
      );

      if (product) {
        updated[index].unit_price =
          String(product.selling_price);
      }
    }

    setItems(updated);
  }

  async function createSalesOrder(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const response = await fetch(
      `${API_BASE_URL}/sales-orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          reference: reference || null,
          items: items.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
            unit_price: item.unit_price
              ? Number(item.unit_price)
              : null,
          })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(error.detail ?? "Unable to create sales order");
      return;
    }

    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setReference("");

    setItems([
      {
        product_id: "",
        quantity: "1",
        unit_price: "",
      },
    ]);

    await loadData();
  }

  async function fulfillSalesOrder(id: number) {
    const confirmed = window.confirm(
      "Fulfill this sales order? Stock will be deducted."
    );

    if (!confirmed) return;

    const response = await fetch(
      `${API_BASE_URL}/sales-orders/${id}/fulfill`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(error.detail ?? "Unable to fulfill sales order");
      return;
    }

    await loadData();
  }

  function productName(id: number) {
    const product = products.find(
      (product) => product.id === id
    );

    if (!product) {
      return `Product ${id}`;
    }

    return `${product.sku} - ${product.name}`;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Sales Orders
        </h1>

        <p className="mt-2 text-slate-400">
          Create customer orders and fulfil them from available stock.
        </p>
      </header>

      <section className="mb-10 rounded-xl bg-slate-900 p-6">
        <h2 className="mb-5 text-xl font-semibold">
          Create Sales Order
        </h2>

        <form
          onSubmit={createSalesOrder}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              placeholder="Customer name"
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              type="email"
              placeholder="Customer email"
              value={customerEmail}
              onChange={(e) =>
                setCustomerEmail(e.target.value)
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              placeholder="Customer phone"
              value={customerPhone}
              onChange={(e) =>
                setCustomerPhone(e.target.value)
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              placeholder="Reference e.g. SO-2026-002"
              value={reference}
              onChange={(e) =>
                setReference(e.target.value)
              }
              className="rounded bg-slate-800 p-3"
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                Items
              </h3>

              <button
                type="button"
                onClick={addItem}
                className="rounded bg-slate-700 px-4 py-2 text-sm"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg bg-slate-950 p-4 md:grid-cols-4"
                >
                  <select
                    required
                    value={item.product_id}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "product_id",
                        e.target.value
                      )
                    }
                    className="rounded bg-slate-800 p-3"
                  >
                    <option value="">
                      Select product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.sku} - {product.name}
                        {" | Stock: "}
                        {product.stock_quantity}
                      </option>
                    ))}
                  </select>

                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantity",
                        e.target.value
                      )
                    }
                    className="rounded bg-slate-800 p-3"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "unit_price",
                        e.target.value
                      )
                    }
                    className="rounded bg-slate-800 p-3"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(index)
                    }
                    className="rounded bg-red-950 p-3 text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="rounded bg-white px-5 py-3 font-semibold text-black"
          >
            Create Sales Order
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-slate-900 p-6">
        <h2 className="mb-5 text-xl font-semibold">
          Sales Orders
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {order.reference ??
                        `SO-${order.id}`}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {order.customer_name}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      order.status === "fulfilled"
                        ? "bg-emerald-950 text-emerald-300"
                        : "bg-amber-950 text-amber-300"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-t border-slate-800 pt-2 text-sm"
                    >
                      <span>
                        {productName(item.product_id)}
                      </span>

                      <span className="text-slate-400">
                        {item.quantity} × AED{" "}
                        {Number(item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.status !== "fulfilled" && (
                  <button
                    onClick={() =>
                      fulfillSalesOrder(order.id)
                    }
                    className="mt-5 rounded bg-emerald-700 px-4 py-2 font-medium"
                  >
                    Fulfill Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}