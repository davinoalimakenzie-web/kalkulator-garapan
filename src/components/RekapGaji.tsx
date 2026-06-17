import React, { useState, useMemo } from "react";
import { formatIDR } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { Calculator, Calendar, FileText, UserCircle, Landmark, Plus, ArrowDownToLine, Banknote } from "lucide-react";

type FilterType = "today" | "week" | "month" | "all";

export function RekapGaji() {
  const { jobs, services, users, currentUser, centralBalance, transactions, updateCentralBalance, addTransaction } = useAppContext();
  const [filter, setFilter] = useState<FilterType>("month");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const [isPayModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");

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
    // Calculate total earnings
    jobs.forEach(job => {
      const service = services.find(s => s.id === job.serviceId);
      const price = service ? service.price : 0;
      const earning = (job.quantity * price) + (job.deliveryFee || 0);
      balances[job.employeeId || job.employeeName] = (balances[job.employeeId || job.employeeName] || 0) + earning;
    });
    // Subtract pelunasan (payments made)
    transactions.forEach(tx => {
      if (tx.type === "pelunasan") {
        balances[tx.employeeId] = (balances[tx.employeeId] || 0) - tx.amount;
      }
    });
    return balances;
  }, [jobs, services, transactions]);

  const employeeSummaries = useMemo(() => {
    const summary: Record<string, { employeeId: string; name: string; totalJobs: number; totalIncome: number; totalDelivery: number }> = {};
    
    filteredJobs.forEach((job) => {
      const service = services.find((s) => s.id === job.serviceId);
      const servicePrice = service ? service.price : 0;
      const jobIncome = job.quantity * servicePrice;
      const empKey = job.employeeId || job.employeeName;

      if (!summary[empKey]) {
        summary[empKey] = { employeeId: empKey, name: job.employeeName, totalJobs: 0, totalIncome: 0, totalDelivery: 0 };
      }
      summary[empKey].totalJobs += job.quantity;
      summary[empKey].totalIncome += jobIncome;
      summary[empKey].totalDelivery += (job.deliveryFee || 0);
    });

    return Object.values(summary).map(data => ({
      ...data,
      totalSalary: data.totalIncome + data.totalDelivery,
      unpaidBalance: allTimeEmployeeBalances[data.employeeId] || 0
    })).sort((a, b) => b.totalSalary - a.totalSalary);
  }, [filteredJobs, services, allTimeEmployeeBalances]);

  const selectedSummary = employeeSummaries.find(e => e.employeeId === selectedEmployeeId);
  const employeeDetails = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return filteredJobs
      .filter((j) => (j.employeeId || j.employeeName) === selectedEmployeeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredJobs, selectedEmployeeId]);

  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || "Layanan Dihapus";
  };
  const getServicePrice = (id: string) => {
    return services.find(s => s.id === id)?.price || 0;
  };

  const handleAddDeposit = async () => {
    const amount = Number(depositAmount);
    if (amount > 0) {
      await updateCentralBalance(amount, true);
    }
    setDepositAmount("");
    setDepositModalOpen(false);
  };

  const handlePayEmployee = async () => {
    const amount = Number(payAmount);
    if (amount > 0 && selectedEmployeeId) {
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
    }
    setPayAmount("");
    setPayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
        <div className="bg-white border text-slate-800 border-indigo-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Pusat (Kas Sementara)</p>
              <p className="text-3xl font-bold font-mono text-indigo-700">{formatIDR(centralBalance)}</p>
            </div>
          </div>
          <button 
            onClick={() => setDepositModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Top Up Saldo
          </button>
        </div>
      )}

      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Top Up Saldo Pusat</h3>
            <input 
              type="number"
              min="0"
              placeholder="Jumlah (Rp)"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
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

      {isPayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Pelunasan Gaji</h3>
            <p className="text-sm text-slate-500 mb-4">Pengiriman gaji mengurangi Saldo Pusat dan Kurangan Gaji karyawan.</p>
            <input 
              type="number"
              min="0"
              placeholder="Jumlah (Rp)"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={handlePayEmployee}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
              >
                Bayar
              </button>
              <button 
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Rekap Pekerjaan</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterButton current={filter} filter="today" onClick={setFilter} label="Hari Ini" />
          <FilterButton current={filter} filter="week" onClick={setFilter} label="Minggu Ini" />
          <FilterButton current={filter} filter="month" onClick={setFilter} label="Bulan Ini" />
          <FilterButton current={filter} filter="all" onClick={setFilter} label="Semua" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 text-sm">Gaji Per Karyawan ({filter})</h3>
            </div>
            
            {employeeSummaries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Tidak ada data pekerjaan untuk periode ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {employeeSummaries.map((emp) => (
                  <button
                    key={emp.employeeId}
                    onClick={() => setSelectedEmployeeId(emp.employeeId)}
                    className={`w-full text-left px-5 py-4 transition-colors flex items-center justify-between group ${
                      selectedEmployeeId === emp.employeeId ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserCircle className={`w-10 h-10 ${selectedEmployeeId === emp.employeeId ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400'}`} />
                      <div>
                        <p className="font-medium text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-500">
                          Sisa Titipan/Kurangan: {formatIDR(emp.unpaidBalance)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedSummary ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Rincian Karyawan: {selectedSummary.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-sm bg-white px-3 py-1.5 border border-slate-200 rounded-lg">
                      <p className="text-slate-500 text-xs uppercase">Sisa Gaji/Titipan</p>
                      <p className="font-bold text-indigo-700">{formatIDR(selectedSummary.unpaidBalance)}</p>
                    </div>
                    {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
                      <button 
                        onClick={() => { setPayAmount(selectedSummary.unpaidBalance.toString()); setPayModalOpen(true); }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5"
                      >
                        <Banknote className="w-4 h-4" />
                        Bayar / Lunasi
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700">Pekerjaan Periode {filter}</h4>
                </div>
                <div className="max-h-[350px] overflow-y-auto pr-2 mb-6 border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <th className="py-2.5 px-4 text-left w-24">Tanggal</th>
                        <th className="py-2.5 px-4 text-left">Pekerjaan</th>
                        <th className="py-2.5 px-4 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {employeeDetails.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-slate-400">Belum ada garapan di periode ini.</td>
                        </tr>
                      )}
                      {employeeDetails.map((job) => {
                        const price = getServicePrice(job.serviceId);
                        const jobTotal = price * job.quantity;
                        return (
                          <React.Fragment key={job.id}>
                            <tr className="hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-500 align-top whitespace-nowrap">{job.date}</td>
                              <td className="py-3 px-4 align-top">
                                <span className="font-medium text-slate-800 block">{getServiceName(job.serviceId)}</span>
                                <span className="text-xs text-slate-400">{job.quantity}x @ {formatIDR(price)}</span>
                              </td>
                              <td className="py-3 px-4 text-right font-medium align-top">{formatIDR(jobTotal)}</td>
                            </tr>
                            {job.deliveryFee > 0 && (
                              <tr className="bg-slate-50/50">
                                <td className="py-2 px-4"></td>
                                <td className="py-2 px-4 text-slate-500 text-xs italic flex items-center gap-1.5">
                                   └ Jasa Kirim / Transport
                                </td>
                                <td className="py-2 px-4 text-right text-sm">+{formatIDR(job.deliveryFee)}</td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Penghasilan Periode Ini</span>
                    <span className="font-bold text-slate-800">{formatIDR(selectedSummary.totalSalary)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 mt-4 text-center">
                  * Untuk melihat detail history pelunasan, lihat laporan utuh (segera hadir).
                </p>
              </div>
            </div>
          ) : (
             <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col items-center justify-center p-12 text-center text-slate-500">
               <Calculator className="w-16 h-16 text-slate-200 mb-4" />
               <p className="text-lg font-medium text-slate-700">Pilih Karyawan</p>
               <p className="text-sm mt-1">Klik nama di daftar kiri untuk melihat detail pekerjaannya.</p>
             </div>
          )}
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
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

