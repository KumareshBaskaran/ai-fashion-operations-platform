"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/inventory", label: "Inventory" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/sales-orders", label: "Sales Orders" },
  { href: "/reports", label: "Reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-64 border-r border-slate-800 bg-slate-950 p-6 text-white">
      <div className="mb-8">
        <h1 className="text-xl font-bold">
          Fashion AI Ops
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Operations Platform
        </p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/" &&
              pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-4 py-3 text-sm transition ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}