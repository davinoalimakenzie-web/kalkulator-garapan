import React, { useMemo } from "react";
import { formatIDR } from "../lib/utils";
import { useAppContext } from "../context/AppContext";
import { Clock, Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function LogSemuaAktifitas() {
  const { jobs, services, users, currentUser, transactions } = useAppContext();

  // Build unified activities logs list
  const allActivities = useMemo(() => {
    const jobLogs = jobs.map((job) => {
      const svc = services.find((s) => s.id === job.serviceId);
      const sName = svc?.name || "Garapan";
      const isSet = !!svc?.isSetEnabled;
      return {
        id: job.id,
        type: "job",
        date: job.date,
        title: "Catat Garapan",
        description: `${job.quantity}${isSet ? " Set" : "x"} ${sName}`,
        details: `${job.quantity} ${isSet ? "Set" : "pcs"}`,
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
        title: isPelunasan ? "Bayar Komisi" : isPenarikan ? "Tarik Saldo" : "Titipan",
        description: isPelunasan 
          ? `Lunas ke ${empName}` 
          : isPenarikan 
            ? `Tarik oleh ${empName}` 
            : `Titipan ${empName}`,
        details: isPelunasan ? "Lunas" : isPenarikan ? "Kas Pusat" : "Kas Titipan",
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
      return true;
    });
  }, [allActivities, currentUser]);

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">Log Semua Aktifitas</h2>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Daftar log pencatatan garapan dan pelunasan komisi</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
        <div className="p-0">
          <div className="max-h-[500px] overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <Clock className="w-10 h-10 text-slate-200 dark:text-slate-705 mx-auto mb-2" />
                <p className="text-xs font-semibold">Belum ada aktifitas.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table (hidden on mobile screen) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-transparent text-slate-500 dark:text-slate-400 font-semibold z-10">
                      <tr>
                        <th className="py-2 px-3 whitespace-nowrap bg-slate-100 dark:bg-slate-800/90">Tanggal</th>
                        <th className="py-2 px-3 whitespace-nowrap bg-slate-100 dark:bg-slate-800/90">Aktivitas</th>
                        <th className="py-2 px-3 whitespace-nowrap bg-slate-100 dark:bg-slate-800/90">Pelaku</th>
                        <th className="py-2 px-3 bg-slate-100 dark:bg-slate-800/90">Rincian</th>
                        <th className="py-2 px-3 text-right whitespace-nowrap bg-slate-100 dark:bg-slate-800/90">Jumlah</th>
                        <th className="py-2 px-3 text-center whitespace-nowrap bg-slate-100 dark:bg-slate-800/90">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-800">
                      {filteredActivities.map((act) => {
                        const isRepayment = act.type === "pelunasan";
                        const isWithdrawal = act.type === "penarikan";

                        let iconColorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400";
                        let rowBgColorClass = "hover:bg-slate-50/30 dark:hover:bg-slate-700/20";
                        if (isRepayment) {
                           iconColorClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
                        } else if (isWithdrawal) {
                           iconColorClass = "bg-amber-50 text-amber-600 dark:bg-amber-955/40 dark:text-amber-400";
                        }

                        return (
                          <tr key={act.id} className={`${rowBgColorClass} transition-colors border-none`}>
                            <td className="py-1.5 px-3 font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              {act.date}
                            </td>
                            <td className="py-1.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`p-1 rounded shrink-0 ${iconColorClass}`}>
                                  {isRepayment ? (
                                    <ArrowDownLeft className="w-3 h-3" />
                                  ) : isWithdrawal ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : (
                                    <Activity className="w-3 h-3" />
                                  )}
                                </span>
                                <span className="font-bold text-slate-750 dark:text-slate-200">{act.title}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-3 font-medium text-slate-700 dark:text-slate-305 whitespace-nowrap">
                              {act.employeeName}
                            </td>
                            <td className="py-1.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 dark:text-slate-405 font-medium">{act.description}</span>
                                {act.details && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono italic">{act.details}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className={`py-1.5 px-3 text-right font-bold font-mono whitespace-nowrap ${isRepayment || isWithdrawal ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                              {act.amountType === "minus" ? "-" : "+"}{formatIDR(act.amount)}
                            </td>
                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                              {act.status && (
                                <span className={`inline-block text-[8px] uppercase font-bold px-1.5 rounded-full border-none ${
                                  act.status === "lunas" 
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                                    : "bg-amber-50 text-amber-600 dark:bg-amber-955/30 dark:text-amber-400"
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
                </div>

                {/* Mobile View List Cards - Compact, Tight Spacing and Zero White Line Dividers */}
                <div className="md:hidden space-y-1 p-1 bg-slate-50/60 dark:bg-slate-900/30">
                  {filteredActivities.map((act) => {
                    const isRepayment = act.type === "pelunasan";
                    const isWithdrawal = act.type === "penarikan";

                    let iconColorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400";
                    if (isRepayment) {
                      iconColorClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-905 dark:text-emerald-400";
                    } else if (isWithdrawal) {
                      iconColorClass = "bg-amber-50 text-amber-600 dark:bg-amber-905 dark:text-amber-400";
                    }

                    return (
                      <div key={act.id} className="p-2 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all text-xs flex flex-col gap-0.5 border border-transparent">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`p-1 rounded shrink-0 ${iconColorClass}`}>
                              {isRepayment ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : isWithdrawal ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <Activity className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-205 truncate">{act.title}</span>
                          </div>
                          <span className={`font-mono text-xs font-black shrink-0 ${isRepayment || isWithdrawal ? "text-rose-650 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                            {act.amountType === "minus" ? "-" : "+"}{formatIDR(act.amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="truncate font-medium">{act.description}</span>
                          <span className="shrink-0 font-mono text-[9px] text-slate-400 dark:text-slate-500">{act.date}</span>
                        </div>

                        <div className="flex items-center justify-between pt-0.5 mt-0.5 border-t border-slate-100/10 dark:border-slate-700/10 text-[9px]">
                          <span className="text-slate-400 dark:text-slate-500">Oleh: <strong className="text-slate-600 dark:text-slate-350 font-medium">{act.employeeName}</strong></span>
                          {act.status && (
                            <span className={`font-bold px-1 rounded-full uppercase text-[8px] ${
                              act.status === "lunas" 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450" 
                                : "bg-amber-50 text-amber-600 dark:bg-amber-955/30 dark:text-amber-450"
                            }`}>
                              {act.status}
                            </span>
                          )}
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
