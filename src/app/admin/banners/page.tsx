"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Plus, ImageIcon, Trash2, Edit, X, Check, Eye, EyeOff, Upload, Loader2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface BannerRow {
  _id: string;
  imageUrl: string;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  isActive: boolean;
}

const emptyForm = { imageUrl: "", targetUrl: "", startDate: "", endDate: "", priority: 0, isActive: true };

const formatForInput = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const token = await getClientToken();
      const res = await fetch("/api/admin/banners", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBanners(data.banners);
    } catch { toast.error("Could not load banners."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Uploading banner to cloud...");
    try {
      const token = await getClientToken();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm(prev => ({ ...prev, imageUrl: data.url }));
      toast.success("Banner image uploaded!", { id: toastId });
    } catch (error) {
      toast.error("Cloud upload failed.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (b: BannerRow) => {
    setEditId(b._id);
    setForm({
      imageUrl: b.imageUrl,
      targetUrl: b.targetUrl || "",
      startDate: formatForInput(b.startDate),
      endDate: formatForInput(b.endDate),
      priority: b.priority,
      isActive: b.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) { toast.error("IMAGE URL IS REQUIRED"); return; }
    setSaving(true);
    try {
      const token = await getClientToken();
      const method = editId ? "PUT" : "POST";
      const body = editId ? { bannerId: editId, ...form } : form;
      const res = await fetch("/api/admin/banners", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "IDENTITY UPDATED" : "IDENTITY CREATED");
      setShowForm(false);
      fetchBanners();
    } catch { toast.error("TRANSMISSION ERROR"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (bannerId: string) => {
    try {
      const token = await getClientToken();
      await fetch(`/api/admin/banners?bannerId=${bannerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("REMOVED FROM RECORDS");
      fetchBanners();
    } catch { toast.error("COULD NOT REMOVE"); }
  };

  const toggleActive = async (b: BannerRow) => {
    try {
      const token = await getClientToken();
      await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bannerId: b._id, isActive: !b.isActive }),
      });
      toast.success(`STATUS SHIFTED`);
      fetchBanners();
    } catch { toast.error("SHIFT FAILED"); }
  };

  // Find the current "Global" banner in the local list for highlighting
  const now = new Date();
  const activeBanners = banners.filter(b => {
    if (!b.isActive) return false;
    const start = b.startDate ? new Date(b.startDate) : null;
    const end = b.endDate ? new Date(b.endDate) : null;
    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  });
  const globalBannerId = activeBanners.sort((a, b) => (b.priority - a.priority) || (b._id > a._id ? 1 : -1))[0]?._id;

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl text-foreground italic">Marketing Banners</h1>
            <p className="text-accent-gold text-[10px] font-bold uppercase tracking-[0.3em] mt-3 block">Synchronized with Realtime DB</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-3 px-6 py-3 bg-accent-gold text-background font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-white transition-all duration-500">
            <Plus className="w-4 h-4" /> New Banner
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-card border border-cardBorder h-32" />)}</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-28 bg-card border border-cardBorder border-dashed">
            <ImageIcon className="w-12 h-12 text-cardBorder mx-auto mb-6 opacity-20" />
            <p className="font-serif text-xl text-text-muted italic">No active banners</p>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((b) => {
              const isGlobal = b._id === globalBannerId;
              return (
                <div key={b._id} className={`bg-card border ${isGlobal ? "border-accent-gold" : "border-cardBorder"} p-6 flex flex-col md:flex-row gap-8 items-start md:items-center group relative`}>
                  {isGlobal && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-accent-gold text-background text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                      <Star className="w-3 h-3 fill-current" /> Currently Global
                    </div>
                  )}
                  
                  <div className="w-full md:w-64 h-32 bg-background border border-cardBorder flex-shrink-0 relative overflow-hidden">
                    <img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? "bg-accent-gold" : "bg-red-400"}`} />
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{b.isActive ? "Live" : "Staged"}</span>
                      <div className="h-3 w-[1px] bg-cardBorder" />
                      <span className="text-[9px] text-text-muted uppercase tracking-[0.2em]">Priority {b.priority}</span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate italic mb-2 font-medium">{b.imageUrl}</p>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => toggleActive(b)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all duration-500">
                      {b.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(b)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all duration-500"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(b._id)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-red-400 hover:border-red-400 transition-all duration-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-card border border-cardBorder p-10 max-w-2xl w-full shadow-2xl">
              <div className="flex items-center justify-between mb-12">
                <h3 className="font-serif text-3xl text-foreground italic">{editId ? "Update" : "Draft"} Banner</h3>
                <button onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-foreground"><X className="w-6 h-6 stroke-[1px]" /></button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] block">Image Source</label>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-32 border border-dashed border-cardBorder flex flex-col items-center justify-center gap-3 hover:border-accent-gold hover:bg-accent-gold/5 transition-all duration-500">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin text-accent-gold" /> : <Upload className="w-6 h-6 text-accent-gold stroke-[1px]" />}
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{uploading ? "Uploading..." : "Cloud Upload"}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="OR PASTE CLOUD URL..." className="w-full bg-background border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all" />
                  </div>
                  <div className="bg-background border border-cardBorder min-h-[160px] relative overflow-hidden flex items-center justify-center">
                    {form.imageUrl ? <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover grayscale-[0.2]" /> : <span className="text-[10px] font-bold text-cardBorder uppercase tracking-widest italic">Live Preview</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 block">Priority Level</label>
                    <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all" />
                    <p className="text-[8px] text-accent-gold mt-2 uppercase font-bold tracking-widest">Highest priority shows globally</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 block">Campaign Target (URL)</label>
                    <input type="text" value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                      placeholder="/collection/summer-roast" className="w-full bg-background border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 block">Launch Date</label>
                    <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all color-scheme-dark" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 block">Expiry Date</label>
                    <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-cardBorder p-4 text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold transition-all color-scheme-dark" />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 mt-16 pt-10 border-t border-cardBorder">
                <button onClick={() => setShowForm(false)} className="flex-1 py-5 bg-background border border-cardBorder text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-cardBorder transition-all duration-500">Discard</button>
                <button onClick={handleSave} disabled={saving || uploading} className="flex-1 py-5 bg-accent-gold text-background text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-foreground hover:text-white transition-all duration-700 disabled:opacity-30">
                  {saving ? "TRANSMITTING..." : (editId ? "Update Campaign" : "Authorize Campaign")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
