"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Shield, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <div className="w-12 h-12 border border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading to cloud...");

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
      setProfileImage(data.url);
      toast.success("Image uploaded to cloud", { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Cloud upload failed. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setProfileImage(imageUrlInput.trim());
    setImageUrlInput("");
    setShowUrlInput(false);
    toast.success("Cloud link applied");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("NAME IS REQUIRED");
      return;
    }
    setSaving(true);
    try {
      const token = await getClientToken();
      const response = await fetch(`/api/users/${user.firebaseUid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name, 
          profileImage 
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const data = await response.json();
      setUser(data.user);
      toast.success("IDENTITY PERSISTED IN CLOUD");
    } catch (error: any) {
      toast.error(error.message || "TRANSMISSION ERROR");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-20 lg:py-40">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <span className="text-accent-gold text-[10px] font-bold tracking-[0.6em] uppercase mb-10 block italic">
          Profile Identity
        </span>
        <h1 className="font-serif text-5xl md:text-7xl text-foreground leading-[0.9] mb-16 tracking-tighter">Your <br /><span className="italic text-accent-gold">Sanctuary.</span></h1>

        {/* Avatar Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-12 mb-20 bg-card p-10 border border-cardBorder">
          <div className="relative group">
            <div className="w-32 h-32 bg-background border border-cardBorder overflow-hidden relative">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover grayscale-[0.2]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                  <span className="font-serif text-4xl italic">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-accent-gold animate-spin" />
                </div>
              )}
            </div>
            
            <div className="absolute -bottom-4 -right-4 flex flex-col gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-10 h-10 bg-accent-gold text-background flex items-center justify-center hover:bg-foreground hover:text-white transition-all duration-500 shadow-xl disabled:opacity-50"
                title="Upload from computer"
              >
                <Upload className="w-4 h-4 stroke-[1.5px]" />
              </button>
              <button 
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="w-10 h-10 bg-background border border-cardBorder text-accent-gold flex items-center justify-center hover:border-accent-gold transition-all duration-500 shadow-xl"
                title="Use image link"
              >
                <LinkIcon className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-3xl text-foreground italic mb-3">{user.name}</h2>
            <div className="flex items-center gap-3">
              <Shield className="w-3 h-3 text-accent-gold" />
              <span className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.3em]">{user.role} Distinction</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showUrlInput && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleUrlSubmit}
              className="mb-12 overflow-hidden"
            >
              <div className="p-8 bg-background border border-accent-gold/20 flex gap-4">
                <input 
                  type="url"
                  placeholder="PASTE CLOUD IMAGE URL HERE..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-transparent border-b border-cardBorder text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-accent-gold py-2"
                />
                <button type="submit" className="text-[9px] font-bold text-accent-gold uppercase tracking-[0.2em] border border-accent-gold/20 px-6 py-2 hover:bg-accent-gold hover:text-background transition-all">
                  Apply
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <div className="space-y-12">
          <div className="space-y-4">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Member Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-cardBorder text-foreground font-serif text-2xl italic py-4 focus:outline-none focus:border-accent-gold transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Authenticated Email</label>
            <p className="font-serif text-2xl text-text-muted opacity-40 py-4 italic border-b border-cardBorder/30">{user.email}</p>
          </div>

          <div className="pt-8 border-t border-cardBorder flex justify-between items-baseline">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Atelier Distinction Points</span>
            <span className="font-serif text-4xl text-accent-gold italic tabular-nums">
              {user.loyaltyPoints || 0}
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSave}
            disabled={saving || uploading || (name === user.name && profileImage === user.profileImage)}
            className="w-full py-6 bg-accent-gold text-background text-[11px] font-bold uppercase tracking-[0.5em] hover:bg-foreground hover:text-white transition-all duration-700 disabled:opacity-30 disabled:grayscale"
          >
            {saving ? "TRANSMITTING..." : "Preserve Identity"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
