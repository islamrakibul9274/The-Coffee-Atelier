"use client";

import { useEffect, useState, useCallback } from "react";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Search, ChevronLeft, ChevronRight, Shield, Trash2, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface UserRow {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profileImage?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getClientToken();
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error("Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = await getClientToken();
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error("Could not update role.");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const token = await getClientToken();
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted.");
      setConfirmDelete(null);
      fetchUsers();
    } catch {
      toast.error("Could not delete user.");
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    customer: "bg-[#A3B18A]/10 text-[#A3B18A] border-[#A3B18A]/20",
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-outfit text-3xl font-bold text-text-primary">Users</h1>
            <p className="text-text-secondary text-sm mt-1">Manage roles & permissions</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-cardBorder rounded-xl text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-cardBorder rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cardBorder">
                  <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-cardBorder/50">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="animate-pulse h-5 bg-cardBorder/30 rounded w-3/4" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-secondary">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-cardBorder/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background border border-cardBorder flex items-center justify-center overflow-hidden flex-shrink-0">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-accent-gold">{u.name?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-text-primary truncate max-w-[150px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary truncate max-w-[180px]">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[u.role] || roleColors.customer}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === "customer" && (
                            <button
                              onClick={() => handleRoleChange(u._id, "manager")}
                              title="Promote to Manager"
                              className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {u.role === "manager" && (
                            <button
                              onClick={() => handleRoleChange(u._id, "customer")}
                              title="Demote to Customer"
                              className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-400/10 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          {u.role !== "admin" && (
                            <button
                              onClick={() => setConfirmDelete(u._id)}
                              title="Delete User"
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-cardBorder">
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white/5 border border-cardBorder text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white/5 border border-cardBorder text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-cardBorder rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="font-outfit text-lg font-bold text-text-primary mb-2">Delete User?</h3>
              <p className="text-sm text-text-secondary mb-6">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 bg-white/5 border border-cardBorder text-text-primary rounded-xl hover:bg-white/10 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
