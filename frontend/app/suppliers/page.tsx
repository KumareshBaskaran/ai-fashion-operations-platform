"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  async function loadSuppliers() {
    setLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/suppliers`
    );

    const data = await response.json();

    setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function createSupplier(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const response = await fetch(
      `${API_BASE_URL}/suppliers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(
        error.detail ??
          "Unable to create supplier"
      );

      return;
    }

    setForm({
      name: "",
      email: "",
      phone: "",
    });

    await loadSuppliers();
  }

  async function deleteSupplier(id: number) {
    const confirmed = window.confirm(
      "Delete this supplier?"
    );

    if (!confirmed) return;

    const response = await fetch(
      `${API_BASE_URL}/suppliers/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();

      alert(
        error.detail ??
          "Unable to delete supplier"
      );

      return;
    }

    await loadSuppliers();
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">

      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          Suppliers
        </h1>

        <p className="mt-2 text-slate-400">
          Manage your supplier directory.
        </p>
      </header>

      <section className="mb-10 rounded-xl bg-slate-900 p-6">

        <h2 className="mb-5 text-xl font-semibold">
          Add Supplier
        </h2>

        <form
          onSubmit={createSupplier}
          className="grid gap-4 md:grid-cols-3"
        >

          <input
            required
            placeholder="Supplier name"
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
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="rounded bg-slate-800 p-3"
          />

          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="rounded bg-slate-800 p-3"
          />

          <button
            type="submit"
            className="rounded bg-white p-3 font-semibold text-black"
          >
            Create Supplier
          </button>

        </form>

      </section>

      <section className="rounded-xl bg-slate-900 p-6">

        <h2 className="mb-5 text-xl font-semibold">
          Supplier Directory
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-3">ID</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>

                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-slate-800"
                  >

                    <td className="p-3">
                      {supplier.id}
                    </td>

                    <td className="p-3 font-medium">
                      {supplier.name}
                    </td>

                    <td className="p-3">
                      {supplier.email ?? "-"}
                    </td>

                    <td className="p-3">
                      {supplier.phone ?? "-"}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          deleteSupplier(supplier.id)
                        }
                        className="text-red-400"
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}