import React, { useState } from "react";
import { formatIDR } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { ClipboardList, Trash2 } from "lucide-react";

export function InputPekerjaan() {
  const { services, jobs, users, addJob, deleteJob, currentUser } = useAppContext();
  
  const [form, setForm] = useState({
    employeeId: currentUser?.role === "karyawan" ? currentUser.id : "",
    date: new Date().toISOString().split("T")[0],
    serviceId: "",
    quantity: "1",
    deliveryFee: "0",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.serviceId || !form.quantity) return;

    const employee = users.find(u => u.id === form.employeeId) || currentUser;
    if (!employee) return;

    addJob({
      employeeId: employee.id,
      employeeName: employee.name,
      date: form.date,
      serviceId: form.serviceId,
      quantity: Number(form.quantity),
      deliveryFee: Number(form.deliveryFee) || 0,
    });

    setForm({
      ...form,
      serviceId: "",
      quantity: "1",
      deliveryFee: "0",
    });
  };

  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || "Layanan Dihapus";
  };

  // Sort jobs by date descending (newest first)
  const recentJobs = [...jobs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Input Pekerjaan Harian</h2>
        <p className="text-slate-500 text-sm mt-1">Catat garapan selesai yang dikerjakan oleh karyawan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Karyawan</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
                disabled={currentUser?.role === "karyawan"}
              >
                <option value="" disabled>-- Pilih Karyawan --</option>
                {users.filter(u => u.role !== 'owner').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
                {currentUser?.role === "owner" && (
                  <option value={currentUser.id}>{currentUser.name} (Owner)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Garapan</label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              >
                <option value="" disabled>-- Pilih Garapan --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatIDR(s.price)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Garapan</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jasa Kirim (Rp)</label>
                <input
                  type="number"
                  value={form.deliveryFee}
                  onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  min="0"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              * Jasa kirim akan masuk sebagai penghasilan/komisi karyawan untuk transaksi ini.
            </p>

            <button
              type="submit"
              disabled={services.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4"
            >
              Simpan Garapan
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                Catatan Terbaru (10 Terakhir)
              </h3>
            </div>
            
            <div className="flex-1 text-sm overflow-x-auto">
              {recentJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 h-full flex flex-col justify-center items-center">
                  <p>Belum ada garapan yang diinput.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="py-2.5 px-4 font-medium whitespace-nowrap">Tanggal</th>
                      <th className="py-2.5 px-4 font-medium whitespace-nowrap">Karyawan</th>
                      <th className="py-2.5 px-4 font-medium whitespace-nowrap">Garapan</th>
                      <th className="py-2.5 px-4 font-medium whitespace-nowrap">Jasa/Fee</th>
                      <th className="py-2.5 px-4 font-medium text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{job.date}</td>
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{job.employeeName}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {job.quantity}x {getServiceName(job.serviceId)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {job.deliveryFee > 0 ? formatIDR(job.deliveryFee) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (window.confirm("Hapus baris garapan ini?")) {
                                deleteJob(job.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

