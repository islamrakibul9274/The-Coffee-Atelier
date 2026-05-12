"use client";

import { useEffect, useState, useCallback } from "react";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Plus, Tags, Trash2, Edit, X, Check, Eye, EyeOff, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";

interface DiscountRow {
  _id: string;
  name: string;
  type: string;
  value: number;
  appliesTo: { type: string; targetId?: string };
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  repeatWeekly: boolean;
}

const emptyForm = { name: "", type: "percentage", value: 0, appliesToType: "all", startDate: "", endDate: "", isActive: true, repeatWeekly: false };

// Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm) in local time
const formatForInput = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
  return localISOTime;
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    try {
      const token = await getClientToken();
      const res = await fetch("/api/admin/discounts", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setDiscounts((await res.json()).discounts);
    } catch { toast.error("Could not load discounts."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (d: DiscountRow) => {
    setEditId(d._id);
    setForm({
      name: d.name, type: d.type, value: d.value,
      appliesToType: d.appliesTo?.type || "all",
      startDate: formatForInput(d.startDate),
      endDate: formatForInput(d.endDate),
      isActive: d.isActive, repeatWeekly: d.repeatWeekly,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("NAME IS REQUIRED"); return; }
    setSaving(true);
    try {
      const token = await getClientToken();
      const payload: any = {
        name: form.name, type: form.type, value: form.value,
        appliesTo: { type: form.appliesToType },
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
        isActive: form.isActive, repeatWeekly: form.repeatWeekly,
      };
      if (editId) payload.discountId = editId;
      const res = await fetch("/api/admin/discounts", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "IDENTITY UPDATED" : "IDENTITY CREATED");
      setShowForm(false);
      fetchDiscounts();
    } catch { toast.error("TRANSMISSION ERROR"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getClientToken();
      await fetch(`/api/admin/discounts?discountId=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("REMOVED FROM RECORDS");
      fetchDiscounts();
    } catch { toast.error("COULD NOT REMOVE"); }
  };

  const toggleActive = async (d: DiscountRow) => {
    try {
      const token = await getClientToken();
      await fetch("/api/admin/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ discountId: d._id, isActive: !d.isActive }),
      });
      toast.success(`STATUS SHIFTED`);
      fetchDiscounts();
    } catch { toast.error("SHIFT FAILED"); }
  };

  const typeLabel: Record<string, string> = { percentage: "%", fixed: "$", bogo: "BOGO" };

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground italic">Member Curations</h1>
            <p className="text-accent-gold text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] mt-2 sm:mt-3 block">Private Discount Logic</p>
          </div>
          <button onClick={openNew} className="flex items-center justify-center gap-3 px-6 py-3 bg-accent-gold text-background font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-white transition-all duration-500 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> New Curation
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-card border border-cardBorder h-24" />)}</div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-28 bg-card border border-cardBorder border-dashed">
            <Tags className="w-12 h-12 text-cardBorder mx-auto mb-6 opacity-20" />
            <p className="font-serif text-xl text-text-muted italic">No active curations</p>
          </div>
        ) : (
          <div className="space-y-6">
            {discounts.map((d) => (
              <div key={d._id} className="bg-card border border-cardBorder p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6 sm:gap-8 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-background border border-accent-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent-gold transition-all duration-700">
                  <span className="text-accent-gold font-serif text-lg sm:text-xl italic">{d.value}{typeLabel[d.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${d.isActive ? "bg-accent-gold" : "bg-red-400"}`} />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{d.name}</span>
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">
                    {d.type} · {d.appliesTo?.type || "all"}
                    {d.endDate && ` · EXPIRES: ${new Date(d.endDate).toLocaleDateString()}`}
                    {d.repeatWeekly && " · WEEKLY RECURRENCE"}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => toggleActive(d)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all duration-500">
                    {d.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(d)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all duration-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(d._id)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-red-400 hover:border-red-400 transition-all duration-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-card border border-cardBorder p-6 sm:p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <h3 className="font-serif text-2xl sm:text-3xl text-foreground italic">{editId ? "Update" : "Craft"} Curation</h3>
                <button onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-foreground"><X className="w-6 h-6 stroke-[1px]" /></button>
              </div>

              <div className="space-y-10">
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Curation Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="PRIVATE SELECTION" className="w-full bg-transparent border-b border-cardBorder text-foreground font-serif text-xl sm:text-2xl italic py-3 sm:py-4 focus:outline-none focus:border-accent-gold transition-all" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Curation Logic</label>
                    <CustomSelect
                      value={form.type}
                      onChange={(val) => setForm({ ...form, type: val })}
                      options={[
                        { value: "percentage", label: "Percentage Shift" },
                        { value: "fixed", label: "Fixed Reduction" },
                        { value: "bogo", label: "Complementary Selection" }
                      ]}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Numerical Value</label>
                    <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-background border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Collection Scope</label>
                  <CustomSelect
                    value={form.appliesToType}
                    onChange={(val) => setForm({ ...form, appliesToType: val })}
                    options={[
                      { value: "all", label: "Entire Atelier" },
                      { value: "category", label: "Specific Category" },
                      { value: "product", label: "Specific Product" }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Activation Threshold</label>
                    <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all color-scheme-dark" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Expiry Threshold</label>
                    <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all color-scheme-dark" />
                  </div>
                </div>

                <div className="flex gap-10 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border border-cardBorder flex items-center justify-center transition-all ${form.isActive ? "bg-accent-gold border-accent-gold" : "group-hover:border-accent-gold"}`}>
                      {form.isActive && <Check className="w-3 h-3 text-background" />}
                    </div>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="hidden" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-foreground">Active</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border border-cardBorder flex items-center justify-center transition-all ${form.repeatWeekly ? "bg-accent-gold border-accent-gold" : "group-hover:border-accent-gold"}`}>
                      {form.repeatWeekly && <Check className="w-3 h-3 text-background" />}
                    </div>
                    <input type="checkbox" checked={form.repeatWeekly} onChange={(e) => setForm({ ...form, repeatWeekly: e.target.checked })} className="hidden" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-foreground">Weekly Ritual</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-10 sm:mt-16 pt-8 sm:pt-10 border-t border-cardBorder">
                <button onClick={() => setShowForm(false)} className="py-4 sm:py-5 bg-background border border-cardBorder text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-cardBorder transition-all duration-500">Discard</button>
                <button onClick={handleSave} disabled={saving} className="py-4 sm:py-5 bg-accent-gold text-background text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-foreground hover:text-white transition-all duration-700 disabled:opacity-30">
                  {saving ? "TRANSMITTING..." : (editId ? "Update Curation" : "Authorize Curation")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
