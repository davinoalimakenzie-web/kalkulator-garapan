import React, { useState } from "react";
import { formatIDR, formatRupiahInput, parseRupiahValue } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { CopyPlus, Edit2, Plus, Trash2, X, Users, UserCog, UserPlus } from "lucide-react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Setting() {
  const { services, users, addService, updateService, deleteService, addUser, currentUser } = useAppContext();
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", price: "" });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", pin: "", role: "karyawan" as "owner" | "admin" | "karyawan" });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) return;

    if (editingServiceId) {
      await updateService(editingServiceId, { name: serviceForm.name, price: Number(serviceForm.price) });
      setEditingServiceId(null);
    } else {
      await addService({ name: serviceForm.name, price: Number(serviceForm.price) });
    }
    setServiceForm({ name: "", price: "" });
    setIsAddingService(false);
  };

  const initiateEditService = (id: string, name: string, price: number) => {
    setEditingServiceId(id);
    setServiceForm({ name, price: price.toString() });
    setIsAddingService(true);
  };

  const handleRoleChange = async (userId: string, newRole: "owner" | "admin" | "karyawan") => {
    const targetUser = users.find(u => u.id === userId);
    if (currentUser?.role === "admin" && (newRole === "owner" || targetUser?.role === "owner")) {
      alert("Hanya Owner yang dapat memberikan atau mengubah hak akses Owner!");
      return;
    }
    await updateDoc(doc(db, "users", userId), { role: newRole });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.pin) return;
    if (userForm.pin.length !== 4) {
      return;
    }

    const tempId = "u_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    await addUser({
      name: userForm.name,
      pin: userForm.pin,
      role: userForm.role
    }, tempId);

    setUserForm({ name: "", pin: "", role: "karyawan" });
    setIsAddingUser(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (currentUser?.role === "admin" && targetUser?.role === "owner") {
      alert("Admin tidak diperbolehkan menghapus akun Owner!");
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun ${userName}?`)) {
      await deleteDoc(doc(db, "users", userId));
    }
  };

  return (
    <div className="space-y-8">
      {/* ------------------- SETTING GARAPAN ------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              Master Biaya Garapan
            </h2>
            <p className="text-slate-500 text-sm mt-1">Kelola jenis layanan dan harga per satuan.</p>
          </div>
          {!isAddingService && (
            <button
              onClick={() => {
                setServiceForm({ name: "", price: "" });
                setEditingServiceId(null);
                setIsAddingService(true);
              }}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Garapan
            </button>
          )}
        </div>

        {isAddingService && (
          <form onSubmit={handleAddService} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Garapan</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                <input
                  type="text"
                  value={formatRupiahInput(serviceForm.price)}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseRupiahValue(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                  placeholder="Rp 0"
                  required
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingServiceId ? "Simpan" : "Tambah"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingService(false);
                    setEditingServiceId(null);
                  }}
                  className="flex-none flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {services.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <CopyPlus className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm">Belum ada data garapan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-6 font-medium text-slate-600">Nama Garapan</th>
                    <th className="py-3 px-6 font-medium text-slate-600">Harga/Item</th>
                    <th className="py-3 px-6 font-medium text-slate-600 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-6 text-slate-800 font-medium">{service.name}</td>
                      <td className="py-3 px-6 text-slate-600">{formatIDR(service.price)}</td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => initiateEditService(service.id, service.name, service.price)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteService(service.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ------------------- SETTING KARYAWAN ------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              Manajemen Akses Karyawan
            </h2>
            <p className="text-slate-500 text-sm mt-1">Sediakan profil karyawan & hak akses sistem mendahului login Google.</p>
          </div>
          <div className="flex items-center gap-3">
            {!isAddingUser && (
              <button
                onClick={() => setIsAddingUser(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Karyawan
              </button>
            )}
          </div>
        </div>

        {isAddingUser && (
          <form onSubmit={handleAddUser} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Karyawan</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Nama Lengkap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PIN Login (4 Angka)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={userForm.pin}
                    onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                    placeholder="e.g. 1234"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peran Akses</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "owner" | "admin" | "karyawan" })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="karyawan">Karyawan</option>
                    <option value="admin">Admin</option>
                    {currentUser?.role === "owner" && <option value="owner">Owner</option>}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                    Tambah
                  </button>
                  <button type="button" onClick={() => setIsAddingUser(false)} className="flex-none p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
             </div>
             <p className="text-xs text-slate-500 mt-3">
               * Karyawan dapat login menggunakan PIN 4 angka. 
               Hak Akses: <strong className="text-purple-600">Owner</strong> (Akses penuh & Tarik Saldo), <strong className="text-amber-600">Admin</strong> (Input, Rekap, Kelola Garapan & Karyawan), <strong className="text-indigo-600">Karyawan</strong> (Hanya Input Mandiri & Rekap Pribadi).
             </p>
          </form>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Desktop Table View (hidden on mobile screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-6 font-medium text-slate-600">Nama Lengkap</th>
                    <th className="py-3 px-6 font-medium text-slate-600">PIN Login</th>
                    <th className="py-3 px-6 font-medium text-slate-600">Level Akses</th>
                    <th className="py-3 px-6 font-medium text-slate-600 text-right">Ubah Peran / Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-6 text-slate-800 font-medium">{user.name}</td>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          maxLength={4}
                          value={user.pin || ""}
                          onChange={async (e) => {
                            const newPin = e.target.value.replace(/\D/g, "");
                            if (newPin.length <= 4) {
                              await updateDoc(doc(db, "users", user.id), { pin: newPin });
                            }
                          }}
                          className="w-16 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                         <div className="flex items-center justify-end gap-2.5">
                           <select 
                             value={user.role}
                             onChange={(e) => handleRoleChange(user.id, e.target.value as "owner" | "admin" | "karyawan")}
                             disabled={user.role === "owner" && currentUser?.role !== "owner"}
                             className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                           >
                             <option value="karyawan">Karyawan</option>
                             <option value="admin">Admin</option>
                             {currentUser?.role === "owner" && <option value="owner">Owner</option>}
                           </select>
                           {user.id !== currentUser?.id && (
                             <button
                               onClick={() => handleDeleteUser(user.id, user.name)}
                               className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded transition-colors"
                               title="Hapus Karyawan"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (displayed on modern phone ratios) */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((user) => {
                const isOwner = user.role === "owner";
                const isAdmin = user.role === "admin";
                
                // Helper to render letter initials
                const initials = user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={user.id} className="p-4 space-y-3.5 hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                        <span className={`inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                          isOwner 
                            ? "bg-purple-100 text-purple-700" 
                            : isAdmin 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center pt-1">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">PIN Login</span>
                        <input
                          type="text"
                          maxLength={4}
                          value={user.pin || ""}
                          onChange={async (e) => {
                            const newPin = e.target.value.replace(/\D/g, "");
                            if (newPin.length <= 4) {
                              await updateDoc(doc(db, "users", user.id), { pin: newPin });
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                          placeholder="PIN"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Level Akses</span>
                        <div className="flex items-center gap-2">
                          <select 
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as "owner" | "admin" | "karyawan")}
                            disabled={user.role === "owner" && currentUser?.role !== "owner"}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                          >
                            <option value="karyawan">Karyawan</option>
                            <option value="admin">Admin</option>
                            {currentUser?.role === "owner" && <option value="owner">Owner</option>}
                          </select>

                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded"
                              title="Hapus Karyawan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </section>

    </div>
  );
}
