"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { slugify } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  description: string;
  inStock: boolean;
  isFeatured: boolean;
  views: number;
}

const CATEGORIES = [
  { value: "body-beauty", label: "Body & Beauty" },
  { value: "candles", label: "Candles" },
  { value: "home-car", label: "Home & Car" },
];

const SUBCATEGORIES: Record<string, string[]> = {
  "body-beauty": ["Body Mist", "Perfume Oil", "Body Serum", "Body Lotion", "Makhmaria", "Lip Gloss", "Hair Mist", "Body Powder", "Cream", "Loose Highlighter"],
  candles: ["Massage Candle", "Vangokh Candle Jar", "Candle Jar", "Candle Cakes", "Bubbles Candle", "Flower Candle", "Mini Bubbles Candle", "Alexander Candle", "Roman Candle"],
  "home-car": ["Car Diffuser", "Home Diffuser"],
};

type FormData = Omit<Product, "id" | "views" | "slug"> & { slug?: string };

const EMPTY_FORM: FormData = {
  name: "",
  price: 0,
  image: "/candela-logo.png",
  category: "body-beauty",
  subcategory: "Body Mist",
  description: "",
  inStock: true,
  isFeatured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const load = () => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      inStock: product.inStock,
      isFeatured: product.isFeatured,
    });
    setShowForm(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        price: typeof formData.price === "number" ? formData.price : parseFloat(String(formData.price)) || 0,
        image: formData.image?.trim() || "/candela-logo.png",
        slug: slugify(formData.name),
      };

      const res = editingProduct
        ? await fetch(`/api/products/${editingProduct.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to save product: ${errorData.error || res.statusText}`);
        return;
      }

      const savedProduct: Product = await res.json();
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...savedProduct } : p))
        );
      } else {
        setProducts((prev) => [savedProduct, ...prev]);
      }

      setShowForm(false);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(`Network error saving product: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      // Optimistically remove immediately from UI
      setProducts((prev) => prev.filter((p) => p.id !== id));

      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete product: ${err.error || res.statusText}`);
        load(); // Revert on error
        return;
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Network error deleting product: ${err?.message || "Unknown error"}`);
      load();
    }
  };

  const toggleField = async (id: string, field: "inStock" | "isFeatured", value: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to update product: ${err.error || res.statusText}`);
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.type === "number"
      ? parseFloat(e.target.value)
      : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em" }}>
            Products
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'Jost', sans-serif" }}>
            {products.length} products in catalog
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="px-5 py-2.5 font-medium text-sm tracking-widest uppercase"
          style={{ background: "#F4A7B9", color: "#1A1A1A", borderRadius: "12px", fontFamily: "'Jost', sans-serif" }}
        >
          + Add Product
        </motion.button>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))
          : products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="relative aspect-[3/4]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <Image
                    src={product.image || "/candela-logo.png"}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/candela-logo.png"; }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.isFeatured && (
                      <span className="px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-bold rounded-full">
                        FEATURED
                      </span>
                    )}
                    {!product.inStock && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                        OUT
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] mb-0.5" style={{ fontFamily: "'Jost', sans-serif", color: "rgba(244,167,185,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {product.subcategory}
                  </p>
                  <p className="text-sm font-medium mb-2 line-clamp-2" style={{ fontFamily: "'Jost', sans-serif", color: "rgba(255,255,255,0.8)" }}>
                    {product.name}
                  </p>
                  <p className="text-sm mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "white", fontSize: "1rem" }}>
                    {product.price} EGP
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex-1 py-1.5 text-[10px] tracking-widest uppercase"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: "8px", fontFamily: "'Jost', sans-serif" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleField(product.id, "inStock", !product.inStock)}
                      className="flex-1 py-1.5 text-[10px] tracking-widest uppercase"
                      style={{
                        background: product.inStock ? "rgba(134,239,172,0.1)" : "rgba(252,165,165,0.1)",
                        color: product.inStock ? "#86EFAC" : "#FCA5A5",
                        borderRadius: "8px",
                        fontFamily: "'Jost', sans-serif",
                      }}
                    >
                      {product.inStock ? "In Stock" : "Out"}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="w-7 flex items-center justify-center"
                      style={{ background: "rgba(255,100,100,0.1)", color: "rgba(252,165,165,0.6)", borderRadius: "8px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-8 bottom-8 z-50 overflow-y-auto mx-auto max-w-lg"
              style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" }}
            >
              <div className="p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "white", fontWeight: 400 }}>
                    {editingProduct ? "Edit Product" : "New Product"}
                  </h2>
                  <button onClick={() => setShowForm(false)} style={{ color: "rgba(255,255,255,0.3)" }}>✕</button>
                </div>

                <AdminInput label="Product Name" type="text" value={formData.name} onChange={update("name")} placeholder="e.g. Dark Kiss Body Mist" />

                <div className="grid grid-cols-2 gap-4">
                  <AdminInput label="Price (EGP)" type="number" value={formData.price.toString()} onChange={update("price")} placeholder="0" />
                  <div>
                    <label className="admin-label">Category</label>
                    <select value={formData.category} onChange={update("category")} className="admin-select">
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Subcategory</label>
                  <select value={formData.subcategory} onChange={update("subcategory")} className="admin-select">
                    {(SUBCATEGORIES[formData.category] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={update("description")}
                    rows={3}
                    placeholder="Product description..."
                    className="admin-input resize-none"
                  />
                </div>

                <div>
                  <label className="admin-label">Product Image</label>
                  <div className="flex gap-3 items-center">
                    {formData.image && (
                      <div className="w-16 h-20 relative rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <Image
                          src={formData.image}
                          alt="preview"
                          fill
                          unoptimized
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/candela-logo.png"; }}
                        />
                      </div>
                    )}
                    <label className="flex-1 py-3 text-center text-xs cursor-pointer tracking-widest uppercase transition-colors" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: "10px", fontFamily: "'Jost', sans-serif" }}>
                      {imageUploading ? "Uploading..." : "Upload Image"}
                      <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={update("image")}
                    placeholder="Or paste image URL"
                    className="admin-input mt-2"
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.inStock} onChange={update("inStock")} className="w-4 h-4 accent-pink-400" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>In Stock</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isFeatured} onChange={update("isFeatured")} className="w-4 h-4 accent-yellow-400" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Featured</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 text-sm tracking-widest uppercase" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", borderRadius: "12px", fontFamily: "'Jost', sans-serif" }}>
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving || !formData.name || !formData.price}
                    className="flex-1 py-3 text-sm font-medium tracking-widest uppercase disabled:opacity-40"
                    style={{ background: "#F4A7B9", color: "#1A1A1A", borderRadius: "12px", fontFamily: "'Jost', sans-serif" }}
                  >
                    {saving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .admin-label {
          display: block;
          font-family: 'Jost', sans-serif;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .admin-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.8);
          border-radius: 10px;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .admin-input:focus {
          border-color: rgba(244,167,185,0.4);
        }
        .admin-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        .admin-select {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.8);
          border-radius: 10px;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          outline: none;
        }
        .admin-select option {
          background: #1a1a1a;
          color: white;
        }
      `}</style>
    </div>
  );
}

function AdminInput({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="admin-input" />
    </div>
  );
}
