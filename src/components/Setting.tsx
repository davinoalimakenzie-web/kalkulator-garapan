import React, { useState } from "react";
import { formatIDR, formatRupiahInput, parseRupiahValue } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { CopyPlus, Edit2, Plus, Trash2, X, Users, UserCog, UserPlus, Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Setting() {
  const { services, users, addService, updateService, deleteService, addUser, currentUser } = useAppContext();
  
  const [isGarapanExpanded, setIsGarapanExpanded] = useState(false);
  const [isKaryawanExpanded, setIsKaryawanExpanded] = useState(false);

  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    isSetEnabled: false,
    itemsPerSet: "10",
    pricePerSet: ""
  });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", pin: "", role: "karyawan" as "owner" | "admin" | "karyawan" });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;

    let finalPrice = 0;
    const itemsPerSetNum = Number(serviceForm.itemsPerSet) || 10;
    const pricePerSetNum = Number(serviceForm.pricePerSet) || 0;

    if (serviceForm.isSetEnabled) {
      if (pricePerSetNum <= 0) return;
      finalPrice = pricePerSetNum / itemsPerSetNum;
    } else {
      if (!serviceForm.price) return;
      finalPrice = Number(serviceForm.price);
    }

    const payload = {
      name: serviceForm.name,
      price: finalPrice,
      isSetEnabled: serviceForm.isSetEnabled,
      itemsPerSet: itemsPerSetNum,
      pricePerSet: pricePerSetNum,
    };

    if (editingServiceId) {
      await updateService(editingServiceId, payload);
      setEditingServiceId(null);
    } else {
      await addService(payload);
    }
    setServiceForm({ 
      name: "", 
      price: "",
      isSetEnabled: false,
      itemsPerSet: "10",
      pricePerSet: "" 
    });
    setIsAddingService(false);
  };

  const initiateEditService = (service: any) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      price: service.price ? Math.round(service.price).toString() : "",
      isSetEnabled: !service.isSetEnabled ? false : service.isSetEnabled,
      itemsPerSet: service.itemsPerSet ? service.itemsPerSet.toString() : "10",
      pricePerSet: service.pricePerSet ? Math.round(service.pricePerSet).toString() : ""
    });
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
    <div className="space-y-0 max-w-2xl mx-auto pb-4">
      {/* ------------------- SETTING TEMA (DARK MODE) ------------------- */}
      <section className="bg-white dark:bg-slate-800 p-3 rounded-t-xl rounded-b-none border border-slate-205 dark:border-slate-700/80 border-b-0 shadow-sm space-y-2 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-none">
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Tema Aplikasi (Dark Mode)
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Ganti tema gelap atau terang dengan satu sentuhan.</p>
          </div>
          <button
            onClick={() => toggleTheme(!isDarkMode)}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-slate-200 dark:border-slate-600"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Mode Terang
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" /> Mode Gelap
              </>
            )}
          </button>
        </div>
      </section>

      {/* ------------------- SETTING GARAPAN ------------------- */}
      <section className="bg-white dark:bg-slate-800 rounded-none border border-slate-205 dark:border-slate-700/80 border-b-0 shadow-sm animate-fade-in-up overflow-hidden">
        <div 
          onClick={() => setIsGarapanExpanded(!isGarapanExpanded)}
          className="flex items-center justify-between gap-2 p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/40 select-none transition-colors"
        >
          <div className="flex items-center gap-2">
            <CopyPlus className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                Komisi Garapan
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Kelola jenis garapan dan tarif per item.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!isGarapanExpanded && (
              <span className="text-[9px] font-bold bg-indigo-55/60 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {services.length} Garapan
              </span>
            )}
            {isGarapanExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {isGarapanExpanded && (
          <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between gap-2 pt-2 pb-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Daftar Garapan</span>
              {!isAddingService && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setServiceForm({ name: "", price: "", isSetEnabled: false, itemsPerSet: "10", pricePerSet: "" });
                    setEditingServiceId(null);
                    setIsAddingService(true);
                  }}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.2 rounded-lg font-bold transition-all text-[11px] cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              )}
            </div>

            {isAddingService && (
              <form onSubmit={handleAddService} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-705 p-3 rounded-lg space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Nama Garapan</label>
                    <input
                      type="text"
                      value={serviceForm.name || ""}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-slate-150"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-auto pb-1">
                    <input
                      type="checkbox"
                      id="isSetEnabled"
                      checked={!!serviceForm.isSetEnabled}
                      onChange={(e) => setServiceForm({ ...serviceForm, isSetEnabled: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="isSetEnabled" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      Aktifkan Harga per Set (Pcs)
                    </label>
                  </div>
                </div>

                {serviceForm.isSetEnabled ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-250/20">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Isi per Set (Pcs)</label>
                      <select
                        value={serviceForm.itemsPerSet || "10"}
                        onChange={(e) => setServiceForm({ ...serviceForm, itemsPerSet: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-slate-150"
                      >
                        <option value="10">1 Set = 10 Pcs</option>
                        <option value="15">1 Set = 15 Pcs</option>
                        <option value="20">1 Set = 20 Pcs</option>
                        <option value="5">1 Set = 5 Pcs</option>
                        <option value="12">1 Set = 12 Pcs (1 Lusin)</option>
                        <option value="25">1 Set = 25 Pcs</option>
                        <option value="50">1 Set = 50 Pcs</option>
                        <option value="100">1 Set = 100 Pcs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Harga per Set (Rp)</label>
                      <input
                        type="text"
                        value={formatRupiahInput(serviceForm.pricePerSet) || ""}
                        onChange={(e) => setServiceForm({ ...serviceForm, pricePerSet: parseRupiahValue(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono dark:text-slate-150 font-bold"
                        placeholder="Rp 0"
                        required
                      />
                      <span className="text-[9px] text-slate-400 mt-0.5 block italic">
                        Setiap isi {serviceForm.itemsPerSet} pcs = {formatIDR(Number(serviceForm.pricePerSet) || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Harga per Item (Rp)</label>
                    <input
                      type="text"
                      value={formatRupiahInput(serviceForm.price) || ""}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: parseRupiahValue(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-707 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono dark:text-slate-150"
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end border-t border-slate-250/20 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingService(false);
                      setEditingServiceId(null);
                    }}
                    className="flex items-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    {editingServiceId ? "Simpan" : "Tambah"}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg overflow-hidden shrink-0">
              {services.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
                  <CopyPlus className="w-8 h-8 text-slate-300 dark:text-slate-705 mb-2" />
                  <p className="text-[11px] font-medium">Belum ada data garapan.</p>
                </div>
              ) : (
                <div>
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-150 dark:bg-slate-800 border-b border-slate-205 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <th className="py-1.5 px-3 font-semibold">Nama Garapan</th>
                        <th className="py-1.5 px-3 font-semibold">Harga/Item</th>
                        <th className="py-1.5 px-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-650 dark:text-slate-300">
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200 font-bold">{service.name}</td>
                          <td className="py-1.5 px-3 font-mono">
                            {formatIDR(service.price)}
                            {service.isSetEnabled && (
                              <div className="text-[10px] text-slate-400 mt-0.5 font-sans leading-tight">
                                {formatIDR(service.pricePerSet || 0)} per set ({service.itemsPerSet || 10} item)
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 px-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => initiateEditService(service)}
                                className="p-1 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteService(service.id)}
                                className="p-1 text-red-600 hover:bg-red-150 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        )}
      </section>

      {/* ------------------- SETTING KARYAWAN ------------------- */}
      <section className="bg-white dark:bg-slate-800 rounded-b-xl rounded-t-none border border-slate-205 dark:border-slate-700/80 shadow-sm animate-fade-in-up overflow-hidden">
        <div 
          onClick={() => setIsKaryawanExpanded(!isKaryawanExpanded)}
          className="flex items-center justify-between gap-2 p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/40 select-none transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-505 dark:text-indigo-400" />
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                Akses Mitra
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Kelola profil mitra dan level akses.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!isKaryawanExpanded && (
              <span className="text-[9px] font-bold bg-indigo-55/60 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {users.length} Akun
              </span>
            )}
            {isKaryawanExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {isKaryawanExpanded && (
          <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between gap-2 pt-2 pb-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Daftar Akun Mitra</span>
              {!isAddingUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingUser(true);
                  }}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.2 rounded-lg font-bold transition-all text-[11px] cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              )}
            </div>

            {isAddingUser && (
              <form onSubmit={handleAddUser} className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-705 p-3 rounded-lg space-y-2.5 animate-fade-in">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Nama Mitra</label>
                      <input
                        type="text"
                        value={userForm.name || ""}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-755 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-slate-150"
                        placeholder="Nama Lengkap"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">PIN Login (4 Angka)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={userForm.pin || ""}
                        onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, "") })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-755 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono dark:text-slate-150"
                        placeholder="Contoh: 1234"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Akses</label>
                      <select
                        value={userForm.role || "karyawan"}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "owner" | "admin" | "karyawan" })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-755 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-slate-150"
                      >
                        <option value="karyawan">Mitra</option>
                        <option value="admin">Admin</option>
                        {currentUser?.role === "owner" && <option value="owner">Owner</option>}
                      </select>
                    </div>
                 </div>
                 <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setIsAddingUser(false)} className="flex items-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer">
                      Batal
                    </button>
                    <button type="submit" className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer">
                      Tambah
                    </button>
                 </div>
              </form>
            )}

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg overflow-hidden shrink-0">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-150 dark:bg-slate-800 border-b border-slate-205 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <th className="py-1.5 px-3 font-semibold">Nama Lengkap</th>
                        <th className="py-1.5 px-3 font-semibold">PIN</th>
                        <th className="py-1.5 px-3 font-semibold">Akses</th>
                        <th className="py-1.5 px-3 font-semibold text-right">Ubah Level / Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-250 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-1.5 px-3 font-bold">{user.name}</td>
                          <td className="py-1.5 px-3">
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
                              className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-center font-mono focus:ring-1 focus:ring-indigo-500 outline-none text-[11px] dark:text-slate-100 font-bold"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                              user.role === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                              user.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-slate-150 text-slate-755 text-slate-700 dark:bg-slate-700 dark:text-slate-350'
                            }`}>
                              {user.role === "karyawan" ? "mitra" : user.role}
                            </span>
                          </td>
                          <td className="py-1.5 px-3">
                             <div className="flex items-center justify-end gap-1.5">
                               <select 
                                 value={user.role}
                                 onChange={(e) => handleRoleChange(user.id, e.target.value as "owner" | "admin" | "karyawan")}
                                 disabled={user.role === "owner" && currentUser?.role !== "owner"}
                                 className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed dark:text-slate-150"
                               >
                                 <option value="karyawan">Mitra</option>
                                 <option value="admin">Admin</option>
                                 {currentUser?.role === "owner" && <option value="owner">Owner</option>}
                               </select>
                               {user.id !== currentUser?.id && (
                                 <button
                                   onClick={() => handleDeleteUser(user.id, user.name)}
                                   className="p-1 text-red-655 hover:bg-red-50 dark:hover:bg-red-950/40 rounded cursor-pointer"
                                   title="Hapus"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                               )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((user) => {
                    const isOwner = user.role === "owner";
                    const isAdmin = user.role === "admin";
                    
                    const initials = user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div key={user.id} className="p-2.5 space-y-1.5 hover:bg-slate-100/30 dark:hover:bg-slate-800/30 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-indigo-55 dark:bg-indigo-900/40 border border-indigo-110 dark:border-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {initials}
                            </div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate leading-none">{user.name}</p>
                          </div>
                          <span className={`inline-block text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full ${
                            isOwner 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400" 
                              : isAdmin 
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" 
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          }`}>
                            {user.role === "karyawan" ? "mitra" : user.role}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 items-center">
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            <span className="text-[9px] text-slate-400 dark:text-slate-550 uppercase tracking-tight whitespace-nowrap">PIN</span>
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
                              className="w-full bg-transparent text-center font-mono focus:outline-none text-[11px] dark:text-slate-100 font-bold"
                              placeholder="PIN"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 justify-end">
                            <select 
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as "owner" | "admin" | "karyawan")}
                              disabled={user.role === "owner" && currentUser?.role !== "owner"}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[10px] focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed dark:text-slate-150"
                            >
                              <option value="karyawan">Mitra</option>
                              <option value="admin">Admin</option>
                              {currentUser?.role === "owner" && <option value="owner">Owner</option>}
                            </select>

                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
