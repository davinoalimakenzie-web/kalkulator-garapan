import React, { useState, useMemo } from "react";
import { formatIDR, formatRupiahInput, parseRupiahValue } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { 
  Calculator, Calendar, FileText, UserCircle, Landmark, Plus, ArrowDownToLine, 
  Banknote, X, Zap, ChevronRight, ArrowLeft, Clock, Search, ArrowUpRight, ArrowDownLeft, Activity, Lock
} from "lucide-react";

type FilterType = "today" | "week" | "month" | "year" | "all";

export function RekapGaji() {
  const { 
    jobs, services, users, currentUser, transactions, 
    addTransaction, updateJobStatus, paymentRequests, 
    addPaymentRequest, updatePaymentRequestStatus 
  } = useAppContext();
  
  const [filter, setFilter] = useState<FilterType>("month");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(-1); // -1 means All Months

  const [isPayActionModalOpen, setIsPayActionModalOpen] = useState(false);
  const [payMode, setPayMode] = useState<"options" | "cicil">("options");
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState<string | null>(null);

  // New states for Payment Requests:
  const [isMitraRequestModalOpen, setIsMitraRequestModalOpen] = useState(false);
  const [mitraRequestAmount, setMitraRequestAmount] = useState("");
  const [mitraRequestNote, setMitraRequestNote] = useState("");
  const [activeProcessingRequest, setActiveProcessingRequest] = useState<any | null>(null);
  const [proofInput, setProofInput] = useState("");

  // Confirmation / upload states:
  const [isConfirmPayModalOpen, setIsConfirmPayModalOpen] = useState(false);
  const [confirmPayAmount, setConfirmPayAmount] = useState(0);
  const [confirmPayType, setConfirmPayType] = useState<"full" | "cicil">("full");
  const [confirmProofImage, setConfirmProofImage] = useState<string>("");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  const showError = (msg: string) => {
    setPayError(msg);
    setTimeout(() => {
      setPayError(prev => prev === msg ? null : prev);
    }, 4500);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!job.date) return true;
      const date = parseISO(job.date);
      if (filter === "today") return isToday(date);
      if (filter === "week") return isThisWeek(date, { weekStartsOn: 1 });
      if (filter === "month") return isThisMonth(date);
      if (filter === "year") {
        const matchesYear = date.getFullYear() === new Date().getFullYear();
        if (!matchesYear) return false;
        if (selectedMonth !== -1) {
          return date.getMonth() === selectedMonth;
        }
        return true;
      }
      return true;
    });
  }, [jobs, filter, selectedMonth]);

  const allTimeEmployeeBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    // Calculate total earnings - in this app, commission is entirely stored in deliveryFee
    jobs.forEach(job => {
      const earning = job.deliveryFee || 0;
      balances[job.employeeId || job.employeeName] = (balances[job.employeeId || job.employeeName] || 0) + earning;
    });
    // Subtract pelunasan (payments made)
    transactions.forEach(tx => {
      if (tx.type === "pelunasan") {
        balances[tx.employeeId] = (balances[tx.employeeId] || 0) - tx.amount;
      }
    });
    return balances;
  }, [jobs, transactions]);

  const employeeSummaries = useMemo(() => {
    const summary: Record<string, { employeeId: string; name: string; totalJobs: number; totalDelivery: number }> = {};
    
    jobs.forEach((job) => {
      const empKey = job.employeeId || job.employeeName;
      if (!summary[empKey]) {
        summary[empKey] = { employeeId: empKey, name: job.employeeName, totalJobs: 0, totalDelivery: 0 };
      }
    });

    const filteredSummary: Record<string, { totalJobs: number; totalDelivery: number }> = {};
    filteredJobs.forEach((job) => {
      const empKey = job.employeeId || job.employeeName;
      if (!filteredSummary[empKey]) {
        filteredSummary[empKey] = { totalJobs: 0, totalDelivery: 0 };
      }
      filteredSummary[empKey].totalJobs += job.quantity;
      filteredSummary[empKey].totalDelivery += (job.deliveryFee || 0);
    });

    const resultList = Object.values(summary).map(data => {
      const filt = filteredSummary[data.employeeId] || { totalJobs: 0, totalDelivery: 0 };
      return {
        ...data,
        totalJobs: filt.totalJobs,
        totalDelivery: filt.totalDelivery,
        totalSalary: filt.totalDelivery,
        unpaidBalance: allTimeEmployeeBalances[data.employeeId] || 0
      };
    });

    if (currentUser?.role === "karyawan") {
      return resultList.filter(emp => emp.employeeId === currentUser.id);
    }

    return resultList.filter(emp => emp.unpaidBalance > 0).sort((a, b) => b.totalSalary - a.totalSalary);
  }, [jobs, filteredJobs, allTimeEmployeeBalances, currentUser]);

  const selectedSummary = useMemo(() => {
    const summaryAll = Object.values(
      jobs.reduce((summary: Record<string, any>, job) => {
        const empKey = job.employeeId || job.employeeName;
        if (!summary[empKey]) {
          summary[empKey] = { employeeId: empKey, name: job.employeeName, totalJobs: 0, totalDelivery: 0 };
        }
        return summary;
      }, {})
    ).map((data: any) => {
      const filteredForEmp = filteredJobs.filter(j => (j.employeeId || j.employeeName) === data.employeeId);
      const totalDelivery = filteredForEmp.reduce((sum, j) => sum + (j.deliveryFee || 0), 0);
      return {
        employeeId: data.employeeId,
        name: data.name,
        totalJobs: filteredForEmp.reduce((sum, j) => sum + j.quantity, 0),
        totalDelivery,
        totalSalary: totalDelivery,
        unpaidBalance: allTimeEmployeeBalances[data.employeeId] || 0
      };
    });
    return summaryAll.find(e => e.employeeId === selectedEmployeeId);
  }, [jobs, filteredJobs, allTimeEmployeeBalances, selectedEmployeeId]);

  const periodTotal = useMemo(() => {
    const jobsForTotal = currentUser?.role === "karyawan" 
      ? filteredJobs.filter(j => j.employeeId === currentUser.id)
      : filteredJobs;
    return jobsForTotal.reduce((sum, j) => sum + (j.deliveryFee || 0), 0);
  }, [filteredJobs, currentUser]);

  React.useEffect(() => {
    if (employeeSummaries.length > 0) {
      if (!selectedEmployeeId || !employeeSummaries.some(e => e.employeeId === selectedEmployeeId)) {
        const initialEmpId = employeeSummaries[0].employeeId;
        setSelectedEmployeeId(initialEmpId);
      }
    } else {
      setSelectedEmployeeId(null);
    }
  }, [employeeSummaries, selectedEmployeeId]);

  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || "Layanan Dihapus";
  };

  const handlePayFull = async () => {
    if (!selectedEmployeeId) return;
    const amount = allTimeEmployeeBalances[selectedEmployeeId] || 0;

    if (amount <= 0) {
      showError("Komisi mitra ini sudah lunas!");
      return;
    }

    try {
      await addTransaction({
        employeeId: selectedEmployeeId,
        type: "pelunasan",
        amount,
        date: new Date().toISOString().split("T")[0],
        note: proofInput || "Pelunasan komisi (Full)"
      });

      // Update pending jobs
      const pendingJobs = jobs.filter(
        (j) => (j.employeeId === selectedEmployeeId || j.employeeName === selectedEmployeeId) && (j.status || "pending") === "pending"
      );
      for (const job of pendingJobs) {
        await updateJobStatus(job.id, "lunas");
      }

      if (activeProcessingRequest) {
        await updatePaymentRequestStatus(activeProcessingRequest.id, "lunas", proofInput || "Lunas ditransfer");
      }

      setProofInput("");
      setIsPayActionModalOpen(false);
    } catch (e: any) {
      showError("Terjadi kesalahan sistem saat melakukan pelunasan.");
      console.error(e);
    }
  };

  const handlePayCicil = async () => {
    const amount = Number(payAmount);
    if (amount <= 0 || !selectedEmployeeId) {
      showError("Masukkan nominal pembayaran cicilan yang valid!");
      return;
    }

    const unpaid = allTimeEmployeeBalances[selectedEmployeeId] || 0;

    if (amount > unpaid) {
      showError("Jumlah pembayaran melebihi sisa jatah komisi!");
      return;
    }

    try {
      await addTransaction({
        employeeId: selectedEmployeeId,
        type: "pelunasan",
        amount,
        date: new Date().toISOString().split("T")[0],
        note: proofInput || "Cicilan komisi"
      });

      // If fully paid, update statuses
      if (amount === unpaid) {
        const pendingJobs = jobs.filter(
          (j) => (j.employeeId === selectedEmployeeId || j.employeeName === selectedEmployeeId) && (j.status || "pending") === "pending"
        );
        for (const job of pendingJobs) {
           await updateJobStatus(job.id, "lunas");
        }
      }

      if (activeProcessingRequest) {
        await updatePaymentRequestStatus(activeProcessingRequest.id, "lunas", proofInput || "Lunas ditransfer");
      }

      setPayAmount("");
      setProofInput("");
      setIsPayActionModalOpen(false);
    } catch (e: any) {
      showError("Terjadi kesalahan sistem saat melakukan cicilan.");
      console.error(e);
    }
  };

  const handleMitraRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const amountNum = Number(mitraRequestAmount);
    // Find matching employee unpaid balance
    const currentUnpaid = selectedSummary?.unpaidBalance || allTimeEmployeeBalances[currentUser.id] || 0;

    if (amountNum <= 0) {
      showError("Masukkan nominal pengajuan yang valid!");
      return;
    }

    if (amountNum > currentUnpaid) {
      showError("Jumlah pengajuan melebihi sisa jatah komisi Anda!");
      return;
    }

    try {
      await addPaymentRequest({
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        amount: amountNum,
        date: new Date().toISOString().split("T")[0],
        note: mitraRequestNote || ""
      });
      setIsMitraRequestModalOpen(false);
      setMitraRequestAmount("");
      setMitraRequestNote("");
      alert("Pengajuan Pelunasan berhasil terkirim ke Owner/Admin!");
    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan sistem saat mengirim pengajuan.");
    }
  };

  const pendingRequests = useMemo(() => {
    return paymentRequests.filter(pr => pr.status === "pending");
  }, [paymentRequests]);

  const settledRequestsForCurrentUser = useMemo(() => {
    if (!currentUser) return [];
    return paymentRequests.filter(pr => pr.employeeId === currentUser.id && pr.status === "lunas");
  }, [paymentRequests, currentUser]);

  return (
    <div className="space-y-4">
      {/* Real-time Notification Banner for Owners / Admins */}
      {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && pendingRequests.length > 0 && (
         <div className="bg-gradient-to-r from-amber-500 to-indigo-650 text-white p-3.5 rounded-2xl shadow-md border border-indigo-400/40 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
               <span className="text-xl shrink-0 animate-bounce">🔔</span>
               <div className="min-w-0">
                  <h4 className="font-extrabold text-[11px] sm:text-xs">Ada {pendingRequests.length} Pengajuan Pelunasan Komisi Baru!</h4>
                  <p className="text-[10px] text-indigo-50/90 font-medium leading-normal">Mitra Anda mengajukan transfer/pelunasan. Silakan tindak lanjuti pengajuan di bawah.</p>
               </div>
            </div>
         </div>
      )}

      {/* Mitra Payment Request Modal */}
      {isMitraRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-700/85 overflow-hidden">
            <div className="px-5 py-4 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900 hover:bg-opacity-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-105">Ajukan Pelunasan Komisi</h3>
                <p className="text-[10px] text-slate-400">Kirim pengajuan pencairan komisi ke Admin/Owner</p>
              </div>
              <button onClick={() => setIsMitraRequestModalOpen(false)} className="text-slate-405 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleMitraRequestSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nominal Diajukan (Rp)</label>
                <input
                  type="text"
                  required
                  value={formatRupiahInput(mitraRequestAmount)}
                  onChange={e => setMitraRequestAmount(parseRupiahValue(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-705 rounded-xl px-3.5 py-2 font-bold font-mono text-xs dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Rp 0"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">
                  Maksimal sisa yang bisa ditarik: {formatIDR(allTimeEmployeeBalances[currentUser?.id || ""] || 0)}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Catatan (Tujuan Rekening & Pesan)</label>
                <textarea
                  value={mitraRequestNote}
                  onChange={e => setMitraRequestNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-705 rounded-xl px-3.5 py-2 text-xs dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none min-h-[60px]"
                  placeholder="Contoh: Transfer ke BCA No. Rek 12345 a/n Rian"
                />
              </div>

              {payError && (
                <div className="bg-red-50 text-red-600 text-[10px] p-2 rounded-lg font-bold">
                  ⚠️ {payError}
                </div>
              )}

              <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-700/60 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMitraRequestModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-105 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-650 dark:text-slate-350 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  Ajukan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Action Popup (Cicil / Bayar Full) */}
      {isPayActionModalOpen && selectedEmployeeId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100">
            {/* Header */}
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pelunasan Komisi</h3>
                <p className="text-xs text-slate-500">Pilih metode pembayaran komisi</p>
              </div>
              <button 
                onClick={() => setIsPayActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Employee info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                <UserCircle className="w-12 h-12 text-indigo-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    {users.find(u => u.id === selectedEmployeeId)?.name || employeeSummaries.find(e => e.employeeId === selectedEmployeeId)?.name || 'Karyawan'}
                  </p>
                  <div className="flex gap-4 mt-0.5 text-xs text-slate-500">
                    <div>
                      <span>Sisa Jatah:</span>{" "}
                      <span className="font-bold text-indigo-600 font-mono">
                        {formatIDR(allTimeEmployeeBalances[selectedEmployeeId] || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Bukti Transfer / Catatan TF</label>
                <input
                  type="text"
                  placeholder="Contoh: TF Sukses BCA Ref 91823"
                  value={proofInput}
                  onChange={e => setProofInput(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-205 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {payError && (
                <div id="pay-error-banner" className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-xl border border-red-200/50 dark:border-red-900/50 font-semibold flex items-center gap-2">
                  <span className="shrink-0 text-red-500">⚠️</span>
                  <span>{payError}</span>
                </div>
              )}

              {payMode === "options" ? (
                /* Payment Options Mode */
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih Aksi</p>
                  
                  {/* Bayar Full Button */}
                  <button
                    onClick={handlePayFull}
                    disabled={(allTimeEmployeeBalances[selectedEmployeeId] || 0) <= 0}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-semibold flex items-center justify-between px-5 transition-all shadow-sm hover:shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-green-100" />
                      <div className="text-left">
                        <span className="block text-sm">Bayar Full (Lunas)</span>
                        <span className="block text-[10px] text-green-100 font-normal">Selesaikan seluruh sisa tagihan</span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold">
                      {formatIDR(allTimeEmployeeBalances[selectedEmployeeId] || 0)}
                    </span>
                  </button>

                  {/* Cicil Button */}
                  <button
                    onClick={() => {
                      setPayAmount("");
                      setPayMode("cicil");
                    }}
                    disabled={(allTimeEmployeeBalances[selectedEmployeeId] || 0) <= 0}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-semibold flex items-center justify-between px-5 transition-all shadow-sm hover:shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-indigo-100" />
                      <div className="text-left">
                        <span className="block text-sm">Cicil (Bayar Sebagian)</span>
                        <span className="block text-[10px] text-indigo-100 font-normal">Bayar nominal tertentu</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-200" />
                  </button>

                  {/* Batal Button */}
                  <button
                    onClick={() => setIsPayActionModalOpen(false)}
                    className="w-full h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] mt-1"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                /* Input Amount Mode (Cicil) */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input Nominal Cicilan</label>
                    <input 
                      type="text"
                      placeholder="Masukkan Jumlah (Rp)"
                      value={formatRupiahInput(payAmount)}
                      onChange={e => setPayAmount(parseRupiahValue(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold font-mono text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end items-center text-[10px] text-slate-400 mt-2 uppercase">
                      <span>Maksimal: {formatIDR(allTimeEmployeeBalances[selectedEmployeeId] || 0)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => setPayMode("options")}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali
                    </button>
                    <button 
                      onClick={handlePayCicil}
                      disabled={!payAmount || Number(payAmount) <= 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
                    >
                      Konfirmasi Bayar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-transparent pb-0 pt-1">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-800 leading-none">Pelunasan Komisi Mitra</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-none mt-1">Kelola dan selesaikan kewajiban pembayaran komisi mitra</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {filter === "year" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-lg px-2.5 py-1.2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all cursor-pointer h-[30px]"
              >
                <option value={-1}>Semua Bulan (Jan - Des)</option>
                <option value={0}>Januari</option>
                <option value={1}>Februari</option>
                <option value={2}>Maret</option>
                <option value={3}>April</option>
                <option value={4}>Mei</option>
                <option value={5}>Juni</option>
                <option value={6}>Juli</option>
                <option value={7}>Agustus</option>
                <option value={8}>September</option>
                <option value={9}>Oktober</option>
                <option value={10}>November</option>
                <option value={11}>Desember</option>
              </select>
            )}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 select-none">
              <FilterButton current={filter} filter="today" onClick={setFilter} label="Hari Ini" />
              <FilterButton current={filter} filter="week" onClick={setFilter} label="Minggu Ini" />
              <FilterButton current={filter} filter="month" onClick={setFilter} label="Bulan Ini" />
              <FilterButton current={filter} filter="year" onClick={setFilter} label="Tahun Ini" />
              <FilterButton current={filter} filter="all" onClick={setFilter} label="Semua" />
            </div>
          </div>
        </div>

      {/* Jatah Bayar Komisi - Cards Row Sejajar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Jatah Bayar Komisi</h2>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 select-none">
            <span>Total Komisi:</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-xs sm:text-sm">
              {formatIDR(periodTotal)}
            </span>
          </div>
        </div>
        {employeeSummaries.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 border border-slate-200 dark:border-slate-705 rounded-xl text-center text-slate-500 text-sm shadow-sm">
            Semua komisi mitra telah dilunasi!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employeeSummaries.map((emp) => {
              const isSelected = selectedEmployeeId === emp.employeeId;
              const canProcessPayment = currentUser?.role === 'owner' || currentUser?.role === 'admin';
              
              // Find matching pending requests from this user
              const hasPendingRequest = paymentRequests.some(pr => pr.employeeId === emp.employeeId && pr.status === 'pending');
              const hasLunasRequest = paymentRequests.some(pr => pr.employeeId === emp.employeeId && pr.status === 'lunas' && pr.proofUrl);

              return (
                <button
                  key={emp.employeeId}
                  onClick={() => {
                    setSelectedEmployeeId(emp.employeeId);
                    if (canProcessPayment) {
                      setPayAmount("");
                      setPayMode("options");
                      setProofInput("");
                      // Check for pending request from this employee to link
                      const matchingRequest = paymentRequests.find(pr => pr.employeeId === emp.employeeId && pr.status === 'pending');
                      setActiveProcessingRequest(matchingRequest || null);
                      if (matchingRequest) {
                        setPayAmount(matchingRequest.amount.toString());
                        setPayMode("cicil");
                      }
                      setIsPayActionModalOpen(true);
                    } else if (currentUser?.role === 'karyawan') {
                      setMitraRequestAmount(Math.round(emp.unpaidBalance).toString());
                      setMitraRequestNote("");
                      setIsMitraRequestModalOpen(true);
                    }
                  }}
                  className={`p-4 bg-white dark:bg-slate-800 border rounded-xl text-left transition-all flex flex-col justify-between gap-3 shadow-sm w-full ${
                    isSelected && canProcessPayment
                      ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950/40 bg-indigo-50/20" 
                      : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-650 hover:shadow"
                  } cursor-pointer`}
                  title={canProcessPayment ? "Klik untuk proses pembayaran komisi" : "Klik untuk mengajukan pelunasan komisi"}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <UserCircle className={`w-10 h-10 shrink-0 ${isSelected && canProcessPayment ? "text-indigo-500" : "text-slate-400"}`} />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">{emp.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Sisa Komisi: <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{formatIDR(emp.unpaidBalance)}</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      {canProcessPayment ? (
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-650 dark:text-indigo-400 transition-colors shrink-0">
                          <Banknote className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-650 dark:text-indigo-400 transition-colors shrink-0">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges / Request indicators */}
                  <div className="w-full flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                    {hasPendingRequest && (
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Menunggu TF
                      </span>
                    )}
                    {hasLunasRequest && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Ada Bukti TF
                      </span>
                    )}
                    {!hasPendingRequest && !hasLunasRequest && (
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium whitespace-nowrap block">
                        {canProcessPayment ? "Bayar / Cicil Komisi" : "Ajukan Pelunasan"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION LIST OF ALL COMMISSION REQUESTS (OWNER / ADMIN ONLY) */}
      {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <span className="text-indigo-600 dark:text-indigo-400">📥</span> Pengajuan Pelunasan Komisi Mitra
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Daftar pengajuan pelunasan komisi yang diajukan oleh mitra</p>
            </div>
            {pendingRequests.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full select-none">
                {pendingRequests.length} Pending
              </span>
            )}
          </div>

          {paymentRequests.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic dark:text-slate-550">
              Belum ada riwayat pengajuan pelunasan komisi.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 pr-1 space-y-0.5">
              {paymentRequests.map((req) => (
                <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-800 dark:text-slate-205">{req.employeeName}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold">({req.date})</span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/35 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-450'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    {req.note && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 block max-w-lg truncate">
                        📋 {req.note}
                      </p>
                    )}
                    {req.status === 'lunas' && req.proofUrl && (
                      <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded inline-block max-w-lg truncate border border-emerald-100/50">
                        ✓ Catatan Pembayaran/Ref TF: {req.proofUrl}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
                      {formatIDR(req.amount)}
                    </div>
                    {req.status === 'pending' ? (
                      <button
                        onClick={() => {
                          setSelectedEmployeeId(req.employeeId);
                          setPayAmount(req.amount.toString());
                          setPayMode("cicil");
                          setProofInput("");
                          setActiveProcessingRequest(req);
                          setIsPayActionModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors shadow-sm"
                      >
                        Bayar TF
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-450 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                        Selesai
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION FOR MITRA TO VIEW THEIR OWN PAYMENT REQUEST HISTORIES */}
      {currentUser?.role === 'karyawan' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-105 flex items-center gap-1.5 animate-pulse">
                <span>📋</span> Status Pengajuan Pelunasan Saya
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Pantau proses transfer atau persetujuan pembayaran Anda</p>
            </div>
          </div>

          {paymentRequests.filter(pr => pr.employeeId === currentUser.id).length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic dark:text-slate-500">
              Anda belum pernah mengajukan pelunasan komisi. Klik tombol jatah komisi di atas untuk mengajukan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50 pr-1 max-h-52 overflow-y-auto space-y-0.5">
              {paymentRequests
                .filter(pr => pr.employeeId === currentUser.id)
                .map((req) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-850 dark:text-slate-200">Pengajuan: {formatIDR(req.amount)}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 select-none ${
                          req.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30' : 'bg-emerald-105 text-emerald-800 dark:bg-emerald-950/30'
                        }`} style={{
                          backgroundColor: req.status === 'pending' ? '#FEF3C7' : '#D1FAE5',
                          color: req.status === 'pending' ? '#D97706' : '#059669',
                        }}>
                          {req.status}
                        </span>
                      </div>
                      {req.note && <p className="text-[10px] text-slate-450 dark:text-slate-400 italic font-medium">Catatan Anda: {req.note}</p>}
                      {req.status === 'lunas' && req.proofUrl && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-400 p-2 rounded-xl border border-emerald-150/40 space-y-1 mt-1 block max-w-sm">
                          <p className="font-extrabold text-[10px] flex items-center gap-1 leading-none">
                            <span>💳</span> Bukti Transfer Terlampir:
                          </p>
                          <p className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold bg-white dark:bg-slate-900 px-1.5 py-1 rounded inline-block">
                            {req.proofUrl}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                      {req.date}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({ current, filter, onClick, label }: { current: FilterType, filter: FilterType, onClick: (f: FilterType) => void, label: string }) {
  const active = current === filter;
  return (
    <button
      onClick={() => onClick(filter)}
      className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
        active
          ? "bg-white text-indigo-700 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {label}
    </button>
  );
}


