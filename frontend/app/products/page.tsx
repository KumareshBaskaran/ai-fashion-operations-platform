"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  supplier_id: number | null;
};

type Supplier = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    cost_price: "",
    selling_price: "",
    reorder_level: "5",
    supplier_id: "",
  });

  async function loadData() {
    setLoading(true);

    const productsResponse = await fetch(
      `${API_BASE_URL}/products`
    );

    const suppliersResponse = await fetch(
      `${API_BASE_URL}/suppliers`
    );

    const productsData = await productsResponse.json();
    const suppliersData = await suppliersResponse.json();

    setProducts(productsData);
    setSuppliers(suppliersData);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const response = await fetch(
      `${API_BASE_URL}/products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          category: form.category || null,
          cost_price: Number(form.cost_price),
          selling_price: Number(form.selling_price),
          stock_quantity: 0,
          reorder_level: Number(form.reorder_level),
          supplier_id: form.supplier_id
            ? Number(form.supplier_id)
            : null,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(
        error.detail ??
          "Unable to create product"
      );

      return;
    }

    setForm({
      sku: "",
      name: "",
      category: "",
      cost_price: "",
      selling_price: "",
      reorder_level: "5",
      supplier_id: "",
    });

    await loadData();
  }

  async function deleteProduct(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/products/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(
        error.detail ??
          "Unable to delete product"
      );

      return;
    }

    await loadData();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-8">

        <h1 className="mb-8 text-3xl font-bold">
          Products
        </h1>

        <section className="mb-10 rounded-xl bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Add Product
          </h2>

          <form
            onSubmit={createProduct}
            className="grid gap-4 md:grid-cols-2"
          >

            <input
              required
              placeholder="SKU"
              value={form.sku}
              onChange={(e) =>
                setForm({
                  ...form,
                  sku: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              required
              placeholder="Product Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              required
              type="number"
              step="0.01"
              placeholder="Cost Price"
              value={form.cost_price}
              onChange={(e) =>
                setForm({
                  ...form,
                  cost_price: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              required
              type="number"
              step="0.01"
              placeholder="Selling Price"
              value={form.selling_price}
              onChange={(e) =>
                setForm({
                  ...form,
                  selling_price: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            />

            <input
              required
              type="number"
              placeholder="Reorder Level"
              value={form.reorder_level}
              onChange={(e) =>
                setForm({
                  ...form,
                  reorder_level: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            />

            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  supplier_id: e.target.value,
                })
              }
              className="rounded bg-slate-800 p-3"
            >

              <option value="">
                No Supplier
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

            <button
              type="submit"
              className="rounded bg-white p-3 font-semibold text-black"
            >
              Create Product
            </button>

          </form>

        </section>

        <section className="rounded-xl bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold">
            Product Catalogue
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Cost</th>
                    <th className="p-3">Selling</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>

                  {products.map((product) => {

                    const lowStock =
                      product.stock_quantity <=
                      product.reorder_level;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-slate-800"
                      >

                        <td className="p-3">
                          {product.sku}
                        </td>

                        <td className="p-3">
                          {product.name}
                        </td>

                        <td className="p-3">
                          {product.category ?? "-"}
                        </td>

                        <td className="p-3">
                          AED{" "}
                          {Number(
                            product.cost_price
                          ).toFixed(2)}
                        </td>

                        <td className="p-3">
                          AED{" "}
                          {Number(
                            product.selling_price
                          ).toFixed(2)}
                        </td>

                        <td className="p-3">
                          {product.stock_quantity}
                        </td>

                        <td className="p-3">
                          {product.stock_quantity === 0
                            ? "Out of Stock"
                            : lowStock
                            ? "Low Stock"
                            : "Healthy"}
                        </td>

                        <td className="p-3">

                          <button
                            onClick={() =>
                              deleteProduct(product.id)
                            }
                            className="text-red-400"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}