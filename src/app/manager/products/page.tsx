"use client";

import { useEffect, useState, useCallback } from "react";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Plus, Package, Trash2, Edit, X, Check, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";

interface ProductRow {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  status: string;
  stock: number;
  imageUrl?: string;
  category?: { _id: string; name: string };
  comingSoonLaunchDate?: string;
}

interface CategoryOption { _id: string; name: string; }

const emptyForm = {
  name: "", description: "", basePrice: 0, status: "active",
  stock: 0, imageUrl: "", category: "", comingSoonLaunchDate: "",
};

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products?limit=100");
      if (!res.ok) throw new Error();
      setProducts((await res.json()).products);
    } catch { toast.error("Could not load products."); }
    finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error();
      setCategories((await res.json()).categories);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: ProductRow) => {
    setEditId(p._id);
    setForm({
      name: p.name, description: p.description, basePrice: p.basePrice,
      status: p.status, stock: p.stock, imageUrl: p.imageUrl || "",
      category: p.category?._id || "",
      comingSoonLaunchDate: p.comingSoonLaunchDate ? new Date(p.comingSoonLaunchDate).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.category) {
      toast.error("Name, description, and category are required."); return;
    }
    setSaving(true);
    try {
      const token = await getClientToken();
      const payload: any = { ...form };
      if (!payload.comingSoonLaunchDate) delete payload.comingSoonLaunchDate;
      if (editId) payload.productId = editId;

      const res = await fetch("/api/products", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "Product updated!" : "Product created!");
      setShowForm(false); fetchProducts();
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getClientToken();
      await fetch(`/api/products?productId=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("Product deleted."); fetchProducts();
    } catch { toast.error("Could not delete."); }
  };

  const statusBadge: Record<string, string> = {
    active: "bg-[#A3B18A]/10 text-[#A3B18A] border-[#A3B18A]/20",
    coming_soon: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    out_of_stock: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-outfit text-3xl font-bold text-text-primary">Products</h1>
            <p className="text-text-secondary text-sm mt-1">Add, edit, and manage your coffee blends</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-accent-gold text-background rounded-xl font-medium text-sm hover:bg-accent-amber transition-colors">
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-card border border-cardBorder rounded-2xl h-20" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-card border border-cardBorder rounded-2xl">
            <Package className="w-16 h-16 text-cardBorder mx-auto mb-4" />
            <p className="font-outfit text-lg text-text-primary">No products yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p._id} className="bg-card border border-cardBorder rounded-2xl p-4 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-[#1A1A1A] overflow-hidden flex-shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-cardBorder" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-text-primary truncate">{p.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge[p.status] || statusBadge.active}`}>
                      {p.status === "coming_soon" ? "Coming Soon" : p.status === "out_of_stock" ? "Out of Stock" : "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    ${p.basePrice.toFixed(2)} · Stock: {p.stock}
                    {p.category && ` · ${p.category.name}`}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-text-secondary hover:bg-white/5 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-card border border-cardBorder rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-outfit text-xl font-bold text-text-primary">{editId ? "Edit" : "New"} Product</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-text-secondary" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Boutique Reserve"
                    className="w-full px-4 py-3 bg-background border border-cardBorder rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Description *</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Rich dark roast..."
                    className="w-full px-4 py-3 bg-background border border-cardBorder rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary mb-1 block">Category *</label>
                    <CustomSelect
                      value={form.category}
                      onChange={(val) => setForm({ ...form, category: val })}
                      options={categories.map(c => ({ value: c._id, label: c.name }))}
                      placeholder="Select..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary mb-1 block">Price ($)</label>
                    <input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({...form, basePrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-background border border-cardBorder rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary mb-1 block">Status</label>
                    <CustomSelect
                      value={form.status}
                      onChange={(val) => setForm({ ...form, status: val })}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "coming_soon", label: "Coming Soon" },
                        { value: "out_of_stock", label: "Out of Stock" }
                      ]}
                      direction="up"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary mb-1 block">Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-background border border-cardBorder rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Image URL</label>
                  <input type="text" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..."
                    className="w-full px-4 py-3 bg-background border border-cardBorder rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50" />
                </div>
                {form.status === "coming_soon" && (
                  <div>
                    <label className="text-sm text-text-secondary mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Launch Date</label>
                    <input type="datetime-local" value={form.comingSoonLaunchDate} onChange={e => setForm({...form, comingSoonLaunchDate: e.target.value})}
                      className="w-full px-4 py-3 bg-background border border-cardBorder rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-white/5 border border-cardBorder rounded-xl text-sm font-medium text-text-primary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-accent-gold text-background rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <span className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full" /> : <><Check className="w-4 h-4" />{editId ? "Update" : "Create"}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
