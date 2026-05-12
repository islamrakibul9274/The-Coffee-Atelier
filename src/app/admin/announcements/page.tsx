"use client";

import { useEffect, useState, useCallback } from "react";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Plus, Megaphone, Trash2, Edit, X, Check, Eye, EyeOff, Bell, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AnnouncementRow {
  _id: string;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", message: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getClientToken();
      const res = await fetch("/api/admin/announcements", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setItems((await res.json()).announcements);
    } catch { toast.error("COULD NOT LOAD ARCHIVES"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => { setEditId(null); setForm({ title: "", message: "", isActive: true }); setShowForm(true); };
  const openEdit = (a: AnnouncementRow) => { 
    setEditId(a._id); 
    setForm({ title: a.title, message: a.message, isActive: a.isActive }); 
    setShowForm(true); 
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("IDENTITY REQUIRED"); return; }
    setSaving(true);
    try {
      const token = await getClientToken();
      const payload: any = { ...form };
      if (editId) payload.announcementId = editId;
      const res = await fetch("/api/admin/announcements", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "ALERT UPDATED" : "BROADCAST AUTHORIZED");
      setShowForm(false); 
      fetchData();
    } catch { toast.error("TRANSMISSION FAILED"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getClientToken();
      const res = await fetch(`/api/admin/announcements?announcementId=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      toast.success("REMOVED FROM RECORDS"); 
      fetchData();
    } catch { toast.error("COULD NOT REMOVE"); }
  };

  const toggleActive = async (a: AnnouncementRow) => {
    try {
      const token = await getClientToken();
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ announcementId: a._id, isActive: !a.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success("STATUS SHIFTED"); 
      fetchData();
    } catch { toast.error("SHIFT FAILED"); }
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-serif text-4xl text-foreground italic">Atelier Broadcasts</h1>
            <p className="text-accent-gold text-[10px] font-bold uppercase tracking-[0.3em] mt-3 block">Site-wide Announcements & RTDB Alerts</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-3 px-6 py-3 bg-accent-gold text-background font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-white transition-all duration-500">
            <Plus className="w-4 h-4" /> New Broadcast
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">{[1,2].map(i => <div key={i} className="animate-pulse bg-card border border-cardBorder h-28" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-28 bg-card border border-cardBorder border-dashed">
            <Megaphone className="w-12 h-12 text-cardBorder mx-auto mb-6 opacity-20" />
            <p className="font-serif text-xl text-text-muted italic">The airwaves are silent</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((a) => (
              <div key={a._id} className={`bg-card border p-8 flex flex-col md:flex-row items-center gap-8 group transition-all duration-700 ${a.isActive ? "border-accent-gold" : "border-cardBorder"}`}>
                <div className="w-16 h-16 bg-background border border-accent-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent-gold transition-all duration-700">
                  <Bell className={`w-6 h-6 ${a.isActive ? "text-accent-gold" : "text-text-muted"} stroke-[1px]`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? "bg-accent-gold" : "bg-red-400"}`} />
                    <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest">{a.title}</h3>
                    {a.isActive && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-accent-gold/10 text-accent-gold text-[8px] font-bold uppercase tracking-widest rounded-full">
                        <Star className="w-2.5 h-2.5 fill-current" /> Live
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-text-muted italic font-serif leading-relaxed line-clamp-2">{a.message}</p>
                  <p className="text-[9px] text-text-muted/50 uppercase tracking-widest mt-4">Archived: {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => toggleActive(a)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all duration-500">
                    {a.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(a)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-accent-gold hover:border-accent-gold transition-all duration-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(a._id)} className="p-3 bg-background border border-cardBorder text-text-muted hover:text-red-400 hover:border-red-400 transition-all duration-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-card border border-cardBorder p-10 max-w-2xl w-full shadow-2xl">
              <div className="flex items-center justify-between mb-12">
                <h3 className="font-serif text-3xl text-foreground italic">{editId ? "Refine" : "Craft"} Broadcast</h3>
                <button onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-foreground"><X className="w-6 h-6 stroke-[1px]" /></button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Broadcast Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="COLLECTION UPDATE" className="w-full bg-transparent border-b border-cardBorder text-foreground font-serif text-2xl italic py-4 focus:outline-none focus:border-accent-gold transition-all" />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Artisanal Message</label>
                  <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4} placeholder="Narrative details for our members..." className="w-full bg-background border border-cardBorder p-6 text-sm text-foreground italic font-serif focus:outline-none focus:border-accent-gold transition-all resize-none" />
                </div>

                <div className="pt-6">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={`w-5 h-5 border border-cardBorder flex items-center justify-center transition-all ${form.isActive ? "bg-accent-gold border-accent-gold" : "group-hover:border-accent-gold"}`}>
                      {form.isActive && <Check className="w-3 h-3 text-background" />}
                    </div>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="hidden" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-foreground">Authorize Live Broadcast (deactivates others)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-6 mt-16 pt-10 border-t border-cardBorder">
                <button onClick={() => setShowForm(false)} className="flex-1 py-5 bg-background border border-cardBorder text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-cardBorder transition-all duration-500">Discard</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-5 bg-accent-gold text-background text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-foreground hover:text-white transition-all duration-700 disabled:opacity-30">
                  {saving ? "TRANSMITTING..." : (editId ? "Update Broadcast" : "Authorize Broadcast")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
