import React, { useState } from "react";
import { formatIDR, formatRupiahInput, parseRupiahValue } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { ClipboardList, Trash2 } from "lucide-react";

export function InputPekerjaan() {
  const { services, jobs, users, addJob, deleteJob, updateJobStatus, currentUser } = useAppContext();
  
  const [form, setForm] = useState({
    employeeId: currentUser?.role === "karyawan" ? currentUser.id : "",
    date: new Date().toISOString().split("T")[0],
    serviceId: "",
    quantity: "1",
    deliveryFee: "0",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showFormError = (msg: string) => {
    setFormError(msg);
    setTimeout(() => {
      setFormError(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const handleDeleteClick = (jobId: string) => {
    if (confirmDeleteId === jobId) {
      deleteJob(jobId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(jobId);
      setTimeout(() => {
        setConfirmDeleteId(current => current === jobId ? null : current);
      }, 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Warning alerts for incomplete elements
    if (!form.date) {
      showFormError("Peringatan: Tanggal belum terisi/dipilih!");
      return;
    }
    if (!form.employeeId) {
      showFormError("Peringatan: Karyawan belum dipilih!");
      return;
    }
    if (!form.serviceId) {
      showFormError("Peringatan: Jenis Garapan belum dipilih!");
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      showFormError("Peringatan: Jumlah Garapan harus diisi dengan angka minimal 1!");
      return;
    }

    const employee = users.find(u => u.id === form.employeeId) || currentUser;
    if (!employee) {
      showFormError("Error: Data karyawan tidak dapat ditemukan!");
      return;
    }

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
  const recentJobs = [...jobs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Automatically calculate Jasa (Rp) based on selected service price and quantity
  React.useEffect(() => {
    if (form.serviceId) {
      const selectedService = services.find((s) => s.id === form.serviceId);
      if (selectedService) {
        const qty = Number(form.quantity) || 0;
        const autoFee = qty * selectedService.price;
        setForm((prev) => ({
          ...prev,
          deliveryFee: autoFee.toString(),
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        deliveryFee: "0",
      }));
    }
  }, [form.serviceId, form.quantity, services]);

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">Input Garapan</h2>
      </div>

      <div className="space-y-1.5">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2.5">
          {formError && (
            <div id="form-error-banner" className="bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 text-xs px-3.5 py-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40 font-semibold flex items-center gap-1.5">
              <span className="shrink-0 text-amber-600">⚠️</span>
              <span>{formError}</span>
            </div>
          )}
          {/* Form input - structured in exactly 3 rows of 2 columns each as requested */}
          <div className="space-y-2.5">
            
            {/* Row 1: Pilih Karyawan & Jenis Garapan */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pilih Karyawan</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100"
                  disabled={currentUser?.role === "karyawan"}
                >
                  <option value="">-- Pilih Karyawan --</option>
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Jenis Garapan</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100"
                >
                  <option value="">-- Pilih Garapan --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatIDR(s.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Jumlah Garapan & Komisi */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Jumlah Garapan</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100"
                  min="0"
                  placeholder="Jumlah"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Komisi (Rp)</label>
                <input
                  type="text"
                  value={formatRupiahInput(form.deliveryFee)}
                  onChange={(e) => setForm({ ...form, deliveryFee: parseRupiahValue(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono dark:text-slate-100"
                  placeholder="Rp 0"
                />
              </div>
            </div>

            {/* Row 3: Tanggal & Tombol Simpan */}
            <div className="grid grid-cols-2 gap-2.5 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={services.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm hover:shadow h-[32px] flex items-center justify-center active:scale-[0.98]"
                >
                  Simpan
                </button>
              </div>
            </div>

          </div>
        </form>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-150 flex items-center gap-2 text-sm sm:text-base">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Laporan Garapan
            </h3>
            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg text-xs md:text-sm transition-all border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex items-center gap-1.5">
              Total: {formatIDR(jobs.reduce((sum, j) => sum + (j.deliveryFee || 0), 0))}
            </span>
          </div>
          
          <div className="text-sm max-h-[400px] overflow-y-auto relative bg-white dark:bg-slate-800">
            {recentJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col justify-center items-center">
                <p>Belum ada garapan yang diinput.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table (hidden on mobile screen) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-300 sticky top-0 z-10">
                        <th className="py-2.5 px-4 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700">Tanggal</th>
                        <th className="py-2.5 px-4 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700">Karyawan</th>
                        <th className="py-2.5 px-4 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700">Garapan</th>
                        <th className="py-2.5 px-4 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700">Komisi</th>
                        <th className="py-2.5 px-4 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700">Status</th>
                        <th className="py-2.5 px-4 font-bold text-right whitespace-nowrap bg-slate-50 dark:bg-slate-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-600 dark:text-slate-300">
                      {recentJobs.map((job) => (
                        <tr key={job.id} className="last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">{job.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{job.employeeName}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {job.quantity}x {getServiceName(job.serviceId)}
                          </td>
                          <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 whitespace-nowrap font-bold font-mono">
                            {job.deliveryFee > 0 ? formatIDR(job.deliveryFee) : '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              disabled={currentUser?.role !== "owner" && currentUser?.role !== "admin"}
                              onClick={() => {
                                const nextStatus = (job.status || "pending") === "pending" ? "lunas" : "pending";
                                updateJobStatus(job.id, nextStatus);
                              }}
                              className={`px-2 py-0.5 font-bold rounded text-xs transition-colors border ${
                                (job.status || "pending") === "lunas"
                                  ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-905"
                                  : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-905"
                              } ${currentUser?.role !== "owner" && currentUser?.role !== "admin" ? "cursor-default" : "cursor-pointer"}`}
                              title={currentUser?.role === "owner" || currentUser?.role === "admin" ? "Klik untuk mengubah status" : ""}
                            >
                              {(job.status || "pending") === "lunas" ? "Lunas" : "Pending"}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteClick(job.id)}
                              className={`p-1.5 rounded transition-all inline-flex items-center gap-1 ${
                                confirmDeleteId === job.id
                                  ? "text-red-700 bg-red-100 dark:bg-red-955 dark:text-red-300 font-bold text-[10px] px-2 py-1"
                                  : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              }`}
                              title={confirmDeleteId === job.id ? "Klik lagi untuk menghapus" : "Hapus"}
                            >
                              {confirmDeleteId === job.id ? (
                                <>
                                  <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                                  <span>Yakin?</span>
                                </>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards (stacked cards, perfectly sized for modern phone screens) */}
                <div className="md:hidden space-y-1.5 p-1.5">
                  {recentJobs.map((job) => {
                    const isLunas = (job.status || "pending") === "lunas";
                    return (
                      <div key={job.id} className="p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all border border-slate-100/50 dark:border-slate-800/40">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">{job.date}</span>
                          <div className="flex items-center gap-1.5">
                            {/* Tap status key button */}
                            <button
                              disabled={currentUser?.role !== "owner" && currentUser?.role !== "admin"}
                              onClick={() => {
                                const nextStatus = (job.status || "pending") === "pending" ? "lunas" : "pending";
                                updateJobStatus(job.id, nextStatus);
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all border ${
                                isLunas
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                                  : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900"
                              }`}
                            >
                              {isLunas ? "Lunas" : "Pending"}
                            </button>

                            <button
                              onClick={() => handleDeleteClick(job.id)}
                              className={`p-1 rounded transition-all inline-flex items-center gap-1 ${
                                confirmDeleteId === job.id
                                  ? "text-red-700 bg-red-100 dark:bg-red-955 dark:text-red-300 font-bold text-[10px] px-1.5 py-0.5"
                                  : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              }`}
                              title={confirmDeleteId === job.id ? "Klik lagi untuk menghapus" : "Hapus"}
                            >
                              {confirmDeleteId === job.id ? (
                                <>
                                  <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                  <span>Yakin?</span>
                                </>
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{job.employeeName}</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {job.quantity}x <span className="font-medium text-slate-500 dark:text-slate-400">{getServiceName(job.serviceId)}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-widest leading-none">Komisi</span>
                            <span className="text-xs font-black font-mono text-indigo-650 dark:text-indigo-400 block mt-0.5">
                              {job.deliveryFee > 0 ? formatIDR(job.deliveryFee) : "Rp 0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

