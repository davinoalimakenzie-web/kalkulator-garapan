import React, { useState } from "react";
import { formatIDR } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { CopyPlus, Edit2, Plus, Trash2, X, Users, UserCog } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Setting() {
  const { services, users, addService, updateService, deleteService } = useAppContext();
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", price: "" });

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
    if (window.confirm(`Ganti peran ke ${newRole}?`)) {
      await updateDoc(doc(db, "users", userId), { role: newRole });
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
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  min="0"
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
                            onClick={() => window.confirm("Hapus layanan?") && deleteService(service.id)}
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
            <p className="text-slate-500 text-sm mt-1">Karyawan harus terdaftar melalui menu "Masuk dengan Google" di halaman Login terlebih dahulu.</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-indigo-100">
            <UserCog className="w-4 h-4" />
            Total: {users.length} Akun
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-6 font-medium text-slate-600">Nama Lengkap</th>
                    <th className="py-3 px-6 font-medium text-slate-600">Email</th>
                    <th className="py-3 px-6 font-medium text-slate-600">Level Akses</th>
                    <th className="py-3 px-6 font-medium text-slate-600 text-right">Ubah Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 flex-col sm:table-row">
                      <td className="py-3 px-6 text-slate-800 font-medium">{user.name}</td>
                      <td className="py-3 px-6 text-slate-600">{user.email}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                         <select 
                           value={user.role}
                           onChange={(e) => handleRoleChange(user.id, e.target.value as "owner" | "admin" | "karyawan")}
                           className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         >
                           <option value="karyawan">Karyawan</option>
                           <option value="admin">Admin</option>
                           <option value="owner">Owner</option>
                         </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      </section>

    </div>
  );
}
