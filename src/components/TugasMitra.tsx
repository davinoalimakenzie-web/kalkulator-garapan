import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { formatIDR } from "../lib/utils";
import { CheckCircle, ClipboardList, Plus, Trash2, Clock, CheckCircle2, Keyboard, X, ListChecks } from "lucide-react";

export function TugasMitra() {
  const { 
    currentUser, users, services, partnerTasks, 
    addPartnerTask, updatePartnerTaskStatus, deletePartnerTask, addJob 
  } = useAppContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskItems, setTaskItems] = useState([{ id: Date.now().toString(), serviceId: "", quantity: "", note: "", deliveryFee: "0" }]);

  const [formError, setFormError] = useState<string | null>(null);

  // States for Multi-completion Modal for Karyawan
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [selectedTaskIdsToComplete, setSelectedTaskIdsToComplete] = useState<string[]>([]);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Auto-calculate Fee
  React.useEffect(() => {
    setTaskItems(prevItems => prevItems.map(item => {
      if (item.serviceId) {
        const selectedService = services.find((s) => s.id === item.serviceId);
        if (selectedService) {
          const qty = Number(item.quantity) || 0;
          let autoFee = 0;
          if (selectedService.isSetEnabled) {
            const pricePerSet = selectedService.pricePerSet || (selectedService.price * (selectedService.itemsPerSet || 10));
            autoFee = qty * pricePerSet;
          } else {
            autoFee = qty * selectedService.price;
          }
          return { ...item, deliveryFee: Math.round(autoFee).toString() };
        }
      }
      return { ...item, deliveryFee: "0" };
    }));
  }, [taskItems.map(i => `${i.serviceId}-${i.quantity}`).join(","), services]);

  const showFormError = (msg: string) => {
    setFormError("⚠️ " + msg);
    setTimeout(() => setFormError(null), 4000);
  };

  const handleAddItem = () => {
    setTaskItems([...taskItems, { id: Date.now().toString(), serviceId: "", quantity: "", note: "", deliveryFee: "0" }]);
  };

  const handleRemoveItem = (id: string) => {
    setTaskItems(taskItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: string) => {
    setTaskItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployeeId) {
      showFormError("Pilih mitra tujuan.");
      return;
    }
    const validItems = taskItems.filter(item => item.serviceId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      showFormError("Pastikan setidaknya ada satu garapan dengan jumlah > 0.");
      return;
    }
    
    const targetEmployee = users.find(u => u.id === targetEmployeeId);
    if (!targetEmployee) return;

    try {
      for (const item of validItems) {
        await addPartnerTask({
          employeeId: targetEmployee.id,
          employeeName: targetEmployee.name,
          serviceId: item.serviceId,
          quantity: Number(item.quantity),
          deliveryFee: Number(item.deliveryFee) || 0,
          date: formDate,
          note: item.note
        });
      }
      setTargetEmployeeId("");
      setTaskItems([{ id: Date.now().toString(), serviceId: "", quantity: "", note: "", deliveryFee: "0" }]);
      setIsFormOpen(false);
    } catch (err: any) {
      showFormError("Gagal menambahkan tugas: " + err.message);
    }
  };

  const myTasks = partnerTasks.filter(t => currentUser?.role !== "karyawan" || t.employeeId === currentUser?.id);
  const pendingTasks = myTasks.filter(t => t.status === "pending");
  const completedTasks = myTasks.filter(t => t.status === "completed").slice(0, 20);

  const openCompletionModal = () => {
    setSelectedTaskIdsToComplete([]); // reset
    setIsCompletionModalOpen(true);
  };

  const submitBatchCompletion = async () => {
    if (selectedTaskIdsToComplete.length === 0) {
      alert("Pilih setidaknya satu tugas untuk diselesaikan.");
      return;
    }
    setIsSubmittingCompletion(true);
    try {
      const now = Date.now();
      const isoDate = new Date().toISOString().split("T")[0];
      for (const taskId of selectedTaskIdsToComplete) {
        const task = pendingTasks.find(t => t.id === taskId);
        if (task) {
          await updatePartnerTaskStatus(task.id, "completed", now);
          await addJob({
            employeeId: task.employeeId,
            employeeName: task.employeeName,
            date: isoDate,
            serviceId: task.serviceId,
            quantity: task.quantity,
            deliveryFee: task.deliveryFee,
            status: "pending"
          });
        }
      }
      setIsCompletionModalOpen(false);
      setSelectedTaskIdsToComplete([]);
    } catch (err) {
      alert("Terjadi kesalahan sistem saat memproses.");
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus tugas ini?")) {
      await deletePartnerTask(id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* COMPLETED/BATCH MODAL FOR KARAYAWAN */}
      {isCompletionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in" onClick={() => setIsCompletionModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-105">Centang Tugas Selesai</h3>
                <p className="text-[10px] text-slate-500">Tugas yg dicentang akan otomatis masuk komisi Anda</p>
              </div>
              <button disabled={isSubmittingCompletion} onClick={() => setIsCompletionModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-slate-900/20">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">Tidak ada tugas yang dikerjakan saat ini.</div>
              ) : (
                pendingTasks.map(task => {
                  const isSelected = selectedTaskIdsToComplete.includes(task.id);
                  const svc = services.find(s => s.id === task.serviceId);
                  return (
                    <label key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/60 ring-1 ring-indigo-500/50' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-300'}`}>
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTaskIdsToComplete([...selectedTaskIdsToComplete, task.id]);
                            else setSelectedTaskIdsToComplete(selectedTaskIdsToComplete.filter(id => id !== task.id));
                          }}
                        />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                           {task.quantity}{svc?.isSetEnabled ? " Set" : " Pcs"} {svc?.name}
                         </p>
                         {task.note && <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">"{task.note}"</p>}
                         {currentUser?.role !== 'karyawan' && <p className="text-[10px] font-bold text-slate-400 mt-1">[{task.employeeName}]</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{task.date}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800">
               <button 
                 disabled={selectedTaskIdsToComplete.length === 0 || isSubmittingCompletion}
                 onClick={submitBatchCompletion} 
                 className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {isSubmittingCompletion ? "Memproses..." : `Selesaikan ${selectedTaskIdsToComplete.length} Tugas Terpilih`}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY TOP CONTAINER */}
      <div className="sticky top-[64px] z-20 bg-slate-50 dark:bg-slate-900 pt-1.5 sm:pt-3 pb-3 -mx-2.5 sm:-mx-6 lg:-mx-8 px-2.5 sm:px-6 lg:px-8 space-y-4">
        {/* HEADER */}
        <div className="flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/80">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
              <span className="truncate">Tugas Garapan</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug pr-1">
              {currentUser?.role === 'karyawan' ? "Centang tugas di bawah ini jika sudah selesai Anda kerjakan." : "Admin/Owner memberikan tugas garapan yang diselesaikan mitra."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingTasks.length > 0 && currentUser?.role === 'karyawan' && (
               <button
                 onClick={openCompletionModal}
                 className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
               >
                 <ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Proses Garapan Selesai</span><span className="sm:hidden">Proses</span>
               </button>
            )}
            {(currentUser?.role === "owner" || currentUser?.role === "admin") && (
              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Tambah Tugas</span><span className="xs:hidden">Tambah</span>
              </button>
            )}
          </div>
        </div>

        {/* FORM TAMBAH TUGAS (OWNER/ADMIN) - MULTI ITEMS */}
        {(currentUser?.role === "owner" || currentUser?.role === "admin") && isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-md space-y-3 animate-fade-in-up">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Formulir Penugasan Baru</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-4 h-4"/></button>
            </div>
            
            {formError && (
              <div className="bg-amber-50 text-amber-600 text-xs px-3 py-2 rounded-lg border border-amber-200 font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Mitra Tujuan</label>
                <select
                  value={targetEmployeeId}
                  onChange={e => setTargetEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100"
                >
                  <option value="">-- Pilih Mitra --</option>
                  {users.filter(u => u.role !== 'owner').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tanggal Tugas</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100"
                />
              </div>
            </div>

            {/* DYNAMIC ITEMS */}
            <div className="space-y-3">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">Daftar Garapan</label>
              {taskItems.map((item, index) => (
                <div key={item.id} className="relative bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {taskItems.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 rounded-full p-1 shadow-sm z-10">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <div className="grid grid-cols-12 gap-2 relative z-[85]">
                    <div className="col-span-12 sm:col-span-5">
                      <select
                        value={item.serviceId}
                        onChange={e => handleItemChange(item.id, 'serviceId', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100"
                      >
                        <option value="">-- Pilih Garapan --</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-12 sm:col-span-3 relative">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity}
                          disabled={!item.serviceId}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 font-mono font-bold disabled:opacity-50"
                          placeholder="Qty"
                        />
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-4">
                       <input
                          type="text"
                          value={item.note}
                          onChange={e => handleItemChange(item.id, 'note', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-[10px] sm:text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100"
                          placeholder="Catatan..."
                        />
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={handleAddItem}
                className="mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-[10px] sm:text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris Garapan
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-4">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors shadow flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Serahkan Tugas
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PENDING TASKS LIST */}
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-6 mb-2">
        <Clock className="w-4 h-4 text-amber-500" /> Tugas Belum Selesai ({pendingTasks.length})
      </h3>
      {pendingTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 dark:text-slate-500 text-xs italic">
          Tidak ada daftar tugas yang sedang aktif.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pendingTasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-slate-800 border-l-4 border-l-amber-400 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.date}</span>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{task.employeeName}</span>
                  </div>
                  {(currentUser?.role === "owner" || currentUser?.role === "admin") && (
                    <button onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1 mt-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {task.quantity}{services.find(s => s.id === task.serviceId)?.isSetEnabled ? " Set" : " Pcs"} <span className="font-medium">{services.find(s => s.id === task.serviceId)?.name || "Layanan Terhapus"}</span>
                  </p>
                  {task.note && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded italic border border-slate-100 dark:border-slate-800">
                      " {task.note} "
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">Est: <span className="text-indigo-600 dark:text-indigo-400">{formatIDR(task.deliveryFee)}</span></span>
                {currentUser?.role === 'owner' || currentUser?.role === 'admin' ? (
                   <span className="text-[9px] font-bold px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 rounded border border-amber-200/50">PENDING</span>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedTaskIdsToComplete([task.id]);
                      setIsCompletionModalOpen(true);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 pointer-events-none" /> <span className="pointer-events-none">Selesaikan</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLETED TASKS LIST */}
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-8 mb-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Riwayat Tugas Selesai
      </h3>
      {completedTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 dark:text-slate-500 text-xs italic">
          Belum ada riwayat pengerjaan tugas.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-80">
          {completedTasks.map((task) => (
            <div key={task.id} className="bg-slate-50 dark:bg-slate-900/40 border-l-4 border-l-emerald-500 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 shadow-sm grayscale-[20%]">
               <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{task.employeeName}</span>
                    <span className="text-[9px] text-slate-400">{task.date}</span>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wider">DONE</span>
                </div>
                <div className="space-y-0.5 mt-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <p>{task.quantity}{services.find(s => s.id === task.serviceId)?.isSetEnabled ? " Set" : " Pcs"} {services.find(s => s.id === task.serviceId)?.name}</p>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
