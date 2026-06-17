import React, { useState, useMemo } from "react";
import { formatIDR, formatRupiahInput, parseRupiahValue } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { 
  Calculator, Calendar, FileText, UserCircle, Landmark, Plus, ArrowDownToLine, 
  Banknote, X, Zap, ChevronRight, ArrowLeft, Clock, Search, ArrowUpRight, ArrowDownLeft, Activity 
} from "lucide-react";

type FilterType = "today" | "week" | "month" | "all";

export function RekapGaji() {
  const { jobs, services, users, currentUser, centralBalance, transactions, updateCentralBalance, addTransaction, updateJobStatus } = useAppContext();
  const [filter, setFilter] = useState<FilterType>("month");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [isPayActionModalOpen, setIsPayActionModalOpen] = useState(false);
  const [payMode, setPayMode] = useState<"options" | "cicil">("options");
  const [payAmount, setPayAmount] = useState("");

  const [logSearch, setLogSearch] = useState("");
  const [logEmployeeFilter, setLogEmployeeFilter] = useState<string>("all");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!job.date) return true;
      const date = parseISO(job.date);
      if (filter === "today") return isToday(date);
      if (filter === "week") return isThisWeek(date, { weekStartsOn: 1 });
      if (filter === "month") return isThisMonth(date);
      return true;
    });
  }, [jobs, filter]);

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

  const handleAddDeposit = async () => {
    const amount = Number(depositAmount);
    if (amount > 0) {
      await updateCentralBalance(amount, true);
    }
    setDepositAmount("");
    setDepositModalOpen(false);
  };

  const handleWithdrawSaldo = async () => {
    const amount = Number(withdrawAmount);
    if (amount <= 0) return;
    if (amount > centralBalance) {
      alert("Sisa saldo tidak mencukupi!");
      return;
    }

    await updateCentralBalance(amount, false);
    await addTransaction({
      employeeId: currentUser?.id || "owner",
      type: "penarikan",
      amount,
      date: new Date().toISOString().split("T")[0],
    });

    setIsWithdrawModalOpen(false);
    setWithdrawAmount("");
  };

  const handlePayFull = async () => {
    if (!selectedEmployeeId) return;
    const summary = employeeSummaries.find(e => e.employeeId === selectedEmployeeId);
    if (!summary) return;
    const amount = summary.unpaidBalance;

    if (amount <= 0) {
      alert("Komisi karyawan ini sudah lunas!");
      return;
    }

    if (amount > centralBalance) {
      alert("Saldo pusat tidak mencukupi!");
      return;
    }

    await updateCentralBalance(amount, false);
    await addTransaction({
      employeeId: selectedEmployeeId,
      type: "pelunasan",
      amount,
      date: new Date().toISOString().split("T")[0],
    });

    // Update pending jobs
    const pendingJobs = jobs.filter(
      (j) => (j.employeeId === selectedEmployeeId || j.employeeName === selectedEmployeeId) && (j.status || "pending") === "pending"
    );
    for (const job of pendingJobs) {
      await updateJobStatus(job.id, "lunas");
    }

    setIsPayActionModalOpen(false);
  };

  const handlePayCicil = async () => {
    const amount = Number(payAmount);
    if (amount <= 0 || !selectedEmployeeId) return;

    const summary = employeeSummaries.find(e => e.employeeId === selectedEmployeeId);
    if (!summary) return;
    const unpaid = summary.unpaidBalance;

    if (amount > unpaid) {
      alert("Jumlah pembayaran melebihi sisa jatah komisi!");
      return;
    }

    if (amount > centralBalance) {
      alert("Saldo pusat tidak mencukupi!");
      return;
    }

    await updateCentralBalance(amount, false);
    await addTransaction({
      employeeId: selectedEmployeeId,
      type: "pelunasan",
      amount,
      date: new Date().toISOString().split("T")[0],
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

    setPayAmount("");
    setIsPayActionModalOpen(false);
  };

  // Build unified activities logs list
  const allActivities = useMemo(() => {
    const jobLogs = jobs.map((job) => {
      const sName = services.find((s) => s.id === job.serviceId)?.name || "Garapan Tanpa Nama";
      return {
        id: job.id,
        type: "job",
        date: job.date,
        title: "Pencatatan Garapan",
        description: `${job.employeeName} mencatat garapan "${sName}"`,
        details: `${job.quantity} pcs × komisi ${formatIDR(job.deliveryFee || 0)}`,
        amount: job.deliveryFee || 0,
        amountType: "plus",
        employeeId: job.employeeId || job.employeeName,
        employeeName: job.employeeName,
        status: job.status || "pending"
      };
    });

    const txLogs = transactions.map((tx) => {
      const emp = users.find((u) => u.id === tx.employeeId);
      const empName = emp ? emp.name : (tx.employeeId === "owner" || tx.employeeId === "owner_withdrawal" ? "Owner" : (tx.employeeId || "Karyawan"));
      const isPelunasan = tx.type === "pelunasan";
      const isPenarikan = tx.type === "penarikan";

      return {
        id: tx.id,
        type: tx.type,
        date: tx.date,
        title: isPelunasan ? "Pelunasan Komisi" : isPenarikan ? "Penarikan Saldo" : "Penyimpanan Titipan",
        description: isPelunasan 
          ? `Pembayaran komisi kepada ${empName}` 
          : isPenarikan 
            ? `Penarikan sisa saldo oleh ${empName}` 
            : `Penerimaan titipan dari ${empName}`,
        details: isPelunasan 
          ? `Sisa komisi dibayarkan` 
          : isPenarikan 
            ? `Saldo ditarik dari kas pusat` 
            : `Pengurangan saldo kas titipan`,
        amount: tx.amount,
        amountType: isPelunasan || isPenarikan ? "minus" : "plus",
        employeeId: tx.employeeId,
        employeeName: empName,
        status: "lunas"
      };
    });

    // Merge and sort by date descending
    return [...jobLogs, ...txLogs].sort((a, b) => b.date.localeCompare(a.date));
  }, [jobs, transactions, services, users]);

  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      // If user is a karyawan, they are only allowed to see their own logs
      if (currentUser?.role === "karyawan" && act.employeeId !== currentUser.id) {
        return false;
      }
      
      // 1. Employee Filter
      if (logEmployeeFilter !== "all" && act.employeeId !== logEmployeeFilter) {
        return false;
      }
      // 2. Search query filter
      if (logSearch.trim()) {
        const query = logSearch.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(query);
        const matchDesc = act.description.toLowerCase().includes(query);
        const matchEmpName = act.employeeName.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchEmpName;
      }
      return true;
    });
  }, [allActivities, logEmployeeFilter, logSearch, currentUser]);

  const totalBayarKomisi = useMemo(() => {
    return transactions
      .filter((t) => t.type === "pelunasan")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const sisaSaldo = centralBalance;
  const saldoAwal = sisaSaldo + totalBayarKomisi;

  return (
    <div className="space-y-4">
      {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
        <div className="bg-white border text-slate-800 border-slate-200/80 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Col 1: Saldo Awal */}
          <div className="flex items-center justify-between gap-4 pr-0 md:pr-4 py-1">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Saldo Awal</p>
                <p className="text-2xl font-black font-mono text-indigo-700">{formatIDR(saldoAwal)}</p>
              </div>
            </div>
            <button 
              onClick={() => setDepositModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:shadow hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Top Up Saldo
            </button>
          </div>

          {/* Col 2: Sisa Saldo */}
          <div className="flex items-center justify-between gap-4 pt-4 md:pt-0 pl-0 md:pl-4 py-1">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sisa Saldo</p>
                <p className="text-2xl font-black font-mono text-emerald-600">{formatIDR(sisaSaldo)}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (sisaSaldo <= 0) {
                  alert("Sisa saldo sudah kosong!");
                  return;
                }
                setWithdrawAmount(sisaSaldo.toString());
                setIsWithdrawModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:shadow hover:scale-[1.02] active:scale-95"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Tarik Saldo
            </button>
          </div>
        </div>
      )}

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Tarik Sisa Saldo</h3>
            <p className="text-xs text-slate-500 mb-3 uppercase font-medium">Maksimal yang dapat ditarik: {formatIDR(sisaSaldo)}</p>
            <input 
              type="text"
              placeholder="Jumlah (Rp)"
              value={formatRupiahInput(withdrawAmount)}
              onChange={e => {
                const val = parseRupiahValue(e.target.value);
                if (Number(val) <= sisaSaldo) {
                  setWithdrawAmount(val);
                } else {
                  setWithdrawAmount(sisaSaldo.toString());
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleWithdrawSaldo}
                disabled={!withdrawAmount || Number(withdrawAmount) <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Konfirmasi Tarik
              </button>
              <button 
                onClick={() => setIsWithdrawModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Top Up Saldo Pusat</h3>
            <input 
              type="text"
              placeholder="Jumlah (Rp)"
              value={formatRupiahInput(depositAmount)}
              onChange={e => setDepositAmount(parseRupiahValue(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleAddDeposit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
              >
                Konfirmasi
              </button>
              <button 
                onClick={() => setDepositModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium"
              >
                Batal
              </button>
            </div>
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 uppercase">
                      <span>Kas Pusat: {formatIDR(centralBalance)}</span>
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
                      disabled={!payAmount || Number(payAmount) <= 0 || Number(payAmount) > centralBalance || Number(payAmount) > (allTimeEmployeeBalances[selectedEmployeeId] || 0)}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pelunasan Komisi Karyawan</h2>
          <p className="text-xs text-slate-500">Kelola dan selesaikan kewajiban pembayaran komisi karyawan</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 self-start sm:self-auto shrink-0">
          <FilterButton current={filter} filter="today" onClick={setFilter} label="Hari Ini" />
          <FilterButton current={filter} filter="week" onClick={setFilter} label="Minggu Ini" />
          <FilterButton current={filter} filter="month" onClick={setFilter} label="Bulan Ini" />
          <FilterButton current={filter} filter="all" onClick={setFilter} label="Semua" />
        </div>
      </div>

      {/* Jatah Bayar Komisi - Cards Row Sejajar */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jatah Bayar Komisi</h2>
        {employeeSummaries.length === 0 ? (
          <div className="bg-white p-8 border border-slate-200 rounded-xl text-center text-slate-500 text-sm shadow-sm">
            Semua komisi karyawan telah dilunasi!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employeeSummaries.map((emp) => {
              const isSelected = selectedEmployeeId === emp.employeeId;
              return (
                <button
                  key={emp.employeeId}
                  onClick={() => {
                    setSelectedEmployeeId(emp.employeeId);
                    setLogEmployeeFilter(emp.employeeId);
                    if (currentUser?.role === 'owner' || currentUser?.role === 'admin') {
                      setPayAmount("");
                      setPayMode("options");
                      setIsPayActionModalOpen(true);
                    }
                  }}
                  className={`p-4 bg-white border rounded-xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer shadow-sm w-full ${
                    isSelected 
                      ? "border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/50" 
                      : "border-slate-200 hover:border-slate-300 hover:shadow"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCircle className={`w-10 h-10 shrink-0 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{emp.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Sisa Titipan/Kurangan: <span className="font-bold text-indigo-600 font-mono">{formatIDR(emp.unpaidBalance)}</span>
                      </p>
                    </div>
                  </div>
                  {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
                    <div className="bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg text-indigo-600 transition-colors shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Semua Aktifitas Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
        {/* Log Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              Log Semua Aktifitas
            </h3>
            <p className="text-[11px] text-slate-400">Daftar log pencatatan garapan dan pelunasan komisi</p>
          </div>

          {/* Filters Panel */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari aktifitas..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent w-full md:w-40"
              />
            </div>

            {/* Dropdown Employee Filter */}
            {currentUser?.role !== "karyawan" && (
              <select
                value={logEmployeeFilter}
                onChange={(e) => setLogEmployeeFilter(e.target.value)}
                className="py-1 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">Semua Karyawan</option>
                {Array.from(new Map(allActivities.map(act => [act.employeeId, act.employeeName])).entries()).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}

            {/* Reset Filter Button */}
            {(logEmployeeFilter !== "all" || logSearch.trim() !== "") && (
              <button
                onClick={() => {
                  setLogEmployeeFilter("all");
                  setLogSearch("");
                }}
                className="py-1 px-2.5 text-[11px] bg-indigo-50 text-indigo-600 font-semibold rounded-md hover:bg-indigo-100 transition-colors cursor-pointer text-center"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Log List View - Single Row Terperinci */}
        <div className="p-0 overflow-x-auto">
          <div className="max-h-[350px] overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-semibold">Belum ada aktifitas yang cocok.</p>
                <p className="text-[10px] mt-0.5">Coba sesuaikan filter atau kata kunci.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold z-10 shadow-sm">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap bg-slate-50">Tanggal</th>
                    <th className="py-2.5 px-4 whitespace-nowrap bg-slate-50">Aktivitas</th>
                    <th className="py-2.5 px-4 whitespace-nowrap bg-slate-50">Pelaku</th>
                    <th className="py-2.5 px-4 bg-slate-50">Keterangan / Rincian</th>
                    <th className="py-2.5 px-4 text-right whitespace-nowrap bg-slate-50">Jumlah</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap bg-slate-50">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredActivities.map((act) => {
                    const isRepayment = act.type === "pelunasan";
                    const isWithdrawal = act.type === "penarikan";

                    // Determine background & text color based on activity type
                    let iconColorClass = "bg-indigo-50 text-indigo-600";
                    let rowBgColorClass = "hover:bg-slate-50/50";
                    if (isRepayment) {
                      iconColorClass = "bg-emerald-50 text-emerald-600";
                    } else if (isWithdrawal) {
                      iconColorClass = "bg-amber-50 text-amber-600";
                    }

                    return (
                      <tr key={act.id} className={`${rowBgColorClass} transition-colors`}>
                        {/* Tanggal */}
                        <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {act.date}
                        </td>

                        {/* Aktivitas */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`p-1 rounded-md shrink-0 ${iconColorClass}`}>
                              {isRepayment ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : isWithdrawal ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <Activity className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <span className="font-semibold text-slate-700">{act.title}</span>
                          </div>
                        </td>

                        {/* Nama pelaku */}
                        <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {act.employeeName}
                        </td>

                        {/* Keterangan */}
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-slate-600 font-medium">{act.description}</span>
                            {act.details && (
                              <>
                                <span className="text-slate-300 hidden sm:inline">•</span>
                                <span className="text-[10px] text-slate-400 font-mono italic">{act.details}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Jumlah */}
                        <td className={`py-2.5 px-4 text-right font-bold font-mono whitespace-nowrap ${isRepayment || isWithdrawal ? "text-rose-600" : "text-indigo-600"}`}>
                          {act.amountType === "minus" ? "-" : "+"}{formatIDR(act.amount)}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          {act.status && (
                            <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${
                              act.status === "lunas" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}>
                              {act.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
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


