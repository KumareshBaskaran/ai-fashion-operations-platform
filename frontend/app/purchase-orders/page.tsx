"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  sku: string;
  name: string;
};

type PurchaseOrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
};

type PurchaseOrder = {
  id: number;
  supplier_id: number;
  status: string;
  reference: string | null;
  created_at: string;
  received_at: string | null;
  items: PurchaseOrderItem[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");

  const [items, setItems] = useState([
    {
      product_id: "",
      quantity: "1",
      unit_cost: "",
    },
  ]);

  async function loadData() {
    setLoading(true);

    const [ordersRes, suppliersRes, productsRes] =
      await Promise.all([
        fetch(`${API_BASE_URL}/purchase-orders`),
        fetch(`${API_BASE_URL}/suppliers`),
        fetch(`${API_BASE_URL}/products`),
      ]);

    setOrders(await ordersRes.json());
    setSuppliers(await suppliersRes.json());
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
        unit_cost: "",
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
    const newItems = [...items];

    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    setItems(newItems);
  }

  async function createPurchaseOrder(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const response = await fetch(
      `${API_BASE_URL}/purchase-orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          supplier_id: Number(supplierId),
          reference: reference || null,

          items: items.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
            unit_cost: Number(item.unit_cost),
          })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(
        error.detail ??
          "Unable to create purchase order"
      );

      return;
    }

    setSupplierId("");
    setReference("");

    setItems([
      {
        product_id: "",
        quantity: "1",
        unit_cost: "",
      },
    ]);

    await loadData();
  }

  async function receivePurchaseOrder(id: number) {
    const confirmed = window.confirm(
      "Receive this purchase order? Stock will be increased."
    );

    if (!confirmed) return;

    const response = await fetch(
      `${API_BASE_URL}/purchase-orders/${id}/receive`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(
        error.detail ??
          "Unable to receive purchase order"
      );

      return;
    }

    await loadData();
  }

  function supplierName(id: number) {
    return (
      suppliers.find(
        (supplier) => supplier.id === id
      )?.name ?? `Supplier ${id}`
    );
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
          Purchase Orders
        </h1>

        <p className="mt-2 text-slate-400">
          Create purchase orders and receive stock
          from suppliers.
        </p>
      </header>

      <section className="mb-10 rounded-xl bg-slate-900 p-6">

        <h2 className="mb-5 text-xl font-semibold">
          Create Purchase Order
        </h2>

        <form
          onSubmit={createPurchaseOrder}
          className="space-y-6"
        >

          <div className="grid gap-4 md:grid-cols-2">

            <select
              required
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value)
              }
              className="rounded bg-slate-800 p-3"
            >
              <option value="">
                Select supplier
              </option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Reference e.g. PO-2026-002"
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
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Cost"
                    value={item.unit_cost}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "unit_cost",
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
            Create Purchase Order
          </button>

        </form>

      </section>

      <section className="rounded-xl bg-slate-900 p-6">

        <h2 className="mb-5 text-xl font-semibold">
          Purchase Orders
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
                        `PO-${order.id}`}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {supplierName(
                        order.supplier_id
                      )}
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      order.status === "received"
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
                        {productName(
                          item.product_id
                        )}
                      </span>

                      <span className="text-slate-400">
                        {item.quantity} × AED{" "}
                        {Number(
                          item.unit_cost
                        ).toFixed(2)}
                      </span>

                    </div>

                  ))}

                </div>

                {order.status !== "received" && (

                  <button
                    onClick={() =>
                      receivePurchaseOrder(order.id)
                    }
                    className="mt-5 rounded bg-emerald-700 px-4 py-2 font-medium"
                  >
                    Receive Order
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