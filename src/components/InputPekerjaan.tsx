import React, { useState } from "react";
import { formatIDR, formatRupiahInput, parseRupiahValue } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { ClipboardList, Trash2, Keyboard, X } from "lucide-react";

export function InputPekerjaan() {
  const { services, jobs, users, addJob, deleteJob, updateJobStatus, currentUser } = useAppContext();
  
  const [form, setForm] = useState({
    employeeId: currentUser?.role === "karyawan" ? currentUser.id || "" : "",
    date: new Date().toISOString().split("T")[0],
    serviceId: "",
    quantity: "",
    deliveryFee: "0",
  });

  React.useEffect(() => {
    if (currentUser?.role === "karyawan" && currentUser.id && form.employeeId !== currentUser.id) {
      setForm(prev => ({ ...prev, employeeId: currentUser.id }));
    }
  }, [currentUser, form.employeeId]);

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  const handleNumpadPress = (val: string) => {
    if (val === "C") {
      setForm(prev => ({ ...prev, quantity: "" }));
    } else if (val === "backspace") {
      setForm(prev => ({ ...prev, quantity: prev.quantity.slice(0, -1) }));
    } else {
      setForm(prev => {
        if (prev.quantity === "0" || prev.quantity === "") {
          return { ...prev, quantity: val };
        }
        return { ...prev, quantity: prev.quantity + val };
      });
    }
  };

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
      showFormError("Error: Data mitra tidak dapat ditemukan!");
      return;
    }

    setIsConfirmingSave(true);
  };

  const handleConfirmedSave = () => {
    const employee = users.find(u => u.id === form.employeeId) || currentUser;
    if (!employee) {
      showFormError("Error: Data mitra tidak dapat ditemukan!");
      setIsConfirmingSave(false);
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
      quantity: "",
      deliveryFee: "0",
    });
    setIsConfirmingSave(false);
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
        let autoFee = 0;
        if (selectedService.isSetEnabled) {
          const pricePerSet = selectedService.pricePerSet || (selectedService.price * (selectedService.itemsPerSet || 10));
          autoFee = qty * pricePerSet;
        } else {
          autoFee = qty * selectedService.price;
        }
        setForm((prev) => ({
          ...prev,
          deliveryFee: Math.round(autoFee).toString(),
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
    <div className="space-y-4">
      {/* Sticky Top Header & Form (fixed at top during scroll) */}
      <div className="sticky top-[64px] z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md pt-2 pb-3.5 space-y-3 -mx-2.5 px-2.5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200/50 dark:border-slate-700/50">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">Input Garapan</h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2.5">
          {formError && (
            <div id="form-error-banner" className="bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 text-xs px-3.5 py-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40 font-semibold flex items-center gap-1.5">
              <span className="shrink-0 text-amber-600">⚠️</span>
              <span>{formError}</span>
            </div>
          )}
          {/* Form input - structured in exactly 2 rows of 3 columns each as requested, always horizontal */}
          <div className="space-y-3 relative">
            {showNumpad && (
              <div 
                className="fixed inset-0 z-[80]" 
                onClick={() => setShowNumpad(false)} 
              />
            )}
            
            {/* Baris 1: Pilih Mitra, Jenis Garapan, Jumlah Garapan */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 relative z-[85]">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 truncate">Pilih Mitra</label>
                <select
                  value={form.employeeId || ""}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentUser?.role === "karyawan"}
                >
                  <option value="">-- Pilih Mitra --</option>
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

              <div className={!form.employeeId ? "opacity-35 transition-opacity" : "transition-opacity"}>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 truncate">Jenis Garapan</label>
                <select
                  value={form.serviceId || ""}
                  disabled={!form.employeeId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Pilih Garapan --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatIDR(s.isSetEnabled ? (s.pricePerSet || (s.price * (s.itemsPerSet || 10))) : s.price)}{s.isSetEnabled ? ` / Set` : " / Pcs"})
                    </option>
                  ))}
                </select>
              </div>

              <div className={`relative ${!form.serviceId ? "opacity-35 transition-opacity" : "transition-opacity"}`}>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 truncate">
                  Jumlah Garapan ({form.serviceId && services.find(s => s.id === form.serviceId)?.isSetEnabled ? "Set" : "Pcs"})
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.quantity || ""}
                    disabled={!form.serviceId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setForm({ ...form, quantity: val });
                    }}
                    onFocus={() => {
                      if (form.serviceId) setShowNumpad(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (form.serviceId) setShowNumpad(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-1.5 pr-7 sm:pl-2.5 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-bold font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    disabled={!form.serviceId}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (form.serviceId) setShowNumpad(!showNumpad);
                    }}
                    className="absolute right-1 text-slate-400 hover:text-indigo-500 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showNumpad && (
                  <div className="absolute top-full right-0 mt-1 w-44 sm:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/85 p-1.5 sm:p-2 rounded-xl shadow-xl z-[90] space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-700/60 pb-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Numpad</span>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowNumpad(false);
                        }}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNumpadPress(num);
                          }}
                          className="bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900/60 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 aspect-square rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 cursor-pointer active:scale-95 transition-all"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNumpadPress("C");
                        }}
                        className="bg-red-50 hover:bg-red-100 dark:bg-red-95/20 dark:hover:bg-red-900/35 text-red-600 dark:text-red-400 rounded-lg text-[9px] sm:text-xs font-bold flex items-center justify-center border border-red-100/50 dark:border-red-950/50 cursor-pointer active:scale-95 transition-all"
                      >
                        C
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNumpadPress("0");
                        }}
                        className="bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900/60 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 cursor-pointer active:scale-95 transition-all"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNumpadPress("backspace");
                        }}
                        className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-955/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-bold text-xs flex items-center justify-center border border-amber-100 dark:border-amber-900/30 cursor-pointer active:scale-95 transition-all"
                      >
                        ⌫
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowNumpad(false);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded-lg text-[9px] sm:text-xs transition-colors cursor-pointer text-center"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Baris 2: Komisi, Tanggal, Simpan */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 items-end relative z-[81]">
              <div className={(!form.quantity || Number(form.quantity) <= 0) ? "opacity-35 transition-opacity" : "transition-opacity"}>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 truncate">Komisi (Rp)</label>
                <input
                  type="text"
                  disabled={!form.quantity || Number(form.quantity) <= 0}
                  value={formatRupiahInput(form.deliveryFee) || ""}
                  onChange={(e) => setForm({ ...form, deliveryFee: parseRupiahValue(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono dark:text-slate-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Rp 0"
                />
              </div>

              <div className={(!form.quantity || Number(form.quantity) <= 0) ? "opacity-35 transition-opacity" : "transition-opacity"}>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 truncate">Tanggal</label>
                <input
                  type="date"
                  disabled={!form.quantity || Number(form.quantity) <= 0}
                  value={form.date || ""}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1 py-1.5 text-[10.5px] sm:text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed select-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!form.employeeId || !form.serviceId || !form.quantity || Number(form.quantity) <= 0 || services.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-450 disabled:cursor-not-allowed text-white px-2 sm:px-4 py-1.5 rounded-lg font-bold text-[10.5px] sm:text-xs transition-all cursor-pointer shadow-sm hover:shadow h-[32px] sm:h-[34px] flex items-center justify-center active:scale-[0.98]"
                >
                  Simpan
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      <div className="space-y-3">
        {isConfirmingSave && (() => {
          const selectedServiceObj = services.find(s => s.id === form.serviceId);
          const isSetEnabled = selectedServiceObj?.isSetEnabled || false;
          const itemsPerSet = selectedServiceObj?.itemsPerSet || 10;
          return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl relative space-y-4 text-slate-800 dark:text-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <span className="text-xl">🔍</span>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base leading-none">Cek Ulang Garapan</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Pastikan rincian berikut sudah benar</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-150/50 dark:border-slate-750">
                    <span className="text-slate-500 font-medium">Karyawan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {users.find(u => u.id === form.employeeId)?.name || (currentUser?.id === form.employeeId ? currentUser.name : "-")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-150/50 dark:border-slate-750">
                    <span className="text-slate-500 font-medium">Jenis Garapan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedServiceObj?.name || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-150/50 dark:border-slate-750">
                    <span className="text-slate-500 font-medium">Jumlah</span>
                    <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-[11px]">
                      {isSetEnabled ? (
                        `${form.quantity} Set (${Number(form.quantity) * Number(itemsPerSet)} Pcs)`
                      ) : (
                        `${form.quantity} Pcs`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-150/50 dark:border-slate-750">
                    <span className="text-slate-500 font-medium">Komisi (Rp)</span>
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatIDR(Number(form.deliveryFee))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-150/50 dark:border-slate-750">
                    <span className="text-slate-500 font-medium">Tanggal</span>
                    <span className="font-bold font-mono">{form.date}</span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5 border border-amber-200/50 dark:border-amber-900/30 text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5 font-medium leading-normal">
                  <span className="shrink-0 text-amber-600">⚠️</span>
                  <span>Komisi akan langsung tercatat ke dalam laporan gaji mitra bersangkutan.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingSave(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-extrabold py-2 px-3 rounded-lg text-xs cursor-pointer transition-colors text-center border border-slate-200 dark:border-slate-600 active:scale-95"
                  >
                    Batal / Edit Lagi
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmedSave}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-3 rounded-lg text-xs cursor-pointer transition-colors text-center shadow active:scale-95"
                  >
                    Ya, Simpan!
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-150 flex items-center gap-2 text-sm sm:text-base">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Laporan Garapan
            </h3>
            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg text-xs md:text-sm transition-all border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex items-center gap-1.5">
              Total Pending: {formatIDR(jobs.filter(j => (j.status || "pending") !== "lunas").reduce((sum, j) => sum + (j.deliveryFee || 0), 0))}
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
                            {job.quantity}{services.find(s => s.id === job.serviceId)?.isSetEnabled ? " Set" : "x"} {getServiceName(job.serviceId)}
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
                              {job.quantity}{services.find(s => s.id === job.serviceId)?.isSetEnabled ? " Set" : "x"} <span className="font-medium text-slate-500 dark:text-slate-400">{getServiceName(job.serviceId)}</span>
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

