import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Calculator, Key, ArrowLeft, Delete, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Login() {
  const { users, setCurrentUser, updateUserPin } = useAppContext();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // PIN flow: login = standard login, curr_pin = old pin check, new_pin = type new pin, confirm_pin = confirm new pin
  const [pinFlow, setPinFlow] = useState<"login" | "curr_pin" | "new_pin" | "confirm_pin">("login");
  const [newPinProposed, setNewPinProposed] = useState("");

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setPin("");
    setError("");
    setSuccessMsg("");
    setPinFlow("login");
  };

  const handleKeyPress = (num: string) => {
    setError("");
    setSuccessMsg("");
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        processPinAction(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setError("");
    setPin(p => p.slice(0, -1));
  };

  const processPinAction = async (enteredPin: string) => {
    if (!selectedUser) return;
    
    if (pinFlow === "login") {
      if (selectedUser.pin === enteredPin) {
        localStorage.setItem("kalkulator_karyawan_uid", selectedUser.id);
        setCurrentUser(selectedUser);
      } else {
        setError("PIN yang Anda masukkan salah. Silakan coba lagi.");
        setPin("");
      }
    } else if (pinFlow === "curr_pin") {
      if (selectedUser.pin === enteredPin) {
        setPinFlow("new_pin");
        setPin("");
        setError("");
        setSuccessMsg("PIN lama benar! Silakan masukkan PIN Baru Anda.");
      } else {
        setError("PIN lama salah. Pembatalan.");
        setPin("");
        setPinFlow("login");
      }
    } else if (pinFlow === "new_pin") {
      setNewPinProposed(enteredPin);
      setPinFlow("confirm_pin");
      setPin("");
      setError("");
      setSuccessMsg("Silakan Ulangi PIN baru untuk konfirmasi.");
    } else if (pinFlow === "confirm_pin") {
      if (enteredPin === newPinProposed) {
        try {
          await updateUserPin(selectedUser.id, enteredPin);
          // Sync current local instance pin
          selectedUser.pin = enteredPin;
          setSuccessMsg("PIN berhasil diperbarui! Silakan masukkan PIN untuk masuk.");
          setPinFlow("login");
          setPin("");
          setError("");
        } catch (err) {
          setError("Gagal memperbarui PIN di database.");
          setPin("");
          setPinFlow("login");
        }
      } else {
        setError("Konfirmasi PIN tidak sesuai. Pembatalan.");
        setPin("");
        setPinFlow("login");
      }
    }
  };

  const getFlowTitle = () => {
    if (pinFlow === "login") return "Masukkan PIN";
    if (pinFlow === "curr_pin") return "Verifikasi PIN Lama";
    if (pinFlow === "new_pin") return "Buat PIN Baru";
    return "Konfirmasi PIN Baru";
  };

  const getFlowSub = () => {
    if (pinFlow === "login") return "Masukkan 4 digit PIN Anda untuk masuk";
    if (pinFlow === "curr_pin") return "Masukkan PIN lama untuk keamanan verifikasi";
    if (pinFlow === "new_pin") return "Ketik 4 digit nomor PIN baru Anda";
    return "Ketik ulang PIN baru Anda sekali lagi";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden relative min-h-[580px] flex flex-col justify-between">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 py-6 px-6 text-white text-center flex flex-col items-center">
          <div className="bg-white/10 p-2.5 rounded-xl mb-3 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Kalkulator Ronce</h1>
          <p className="text-indigo-100/80 text-xs mt-1">Sistem Pencatatan Finansial & Gaji Mitra</p>
        </div>

        <div className="px-6 py-6 flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!selectedUser ? (
              <motion.div
                key="select-user"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-lg font-bold text-slate-800">Pilih Akun Mitra</h2>
                  <p className="text-slate-500 text-xs mt-1">Silakan pilih nama Anda untuk melanjutkan</p>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 mt-4">
                  {users.map((u) => {
                    const isOwner = u.role === "owner";
                    const isAdmin = u.role === "admin";
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-3 p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-5/60 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {getInitials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-sm">{u.name}</p>
                          <span className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                            isOwner 
                              ? "bg-purple-100 text-purple-700" 
                              : isAdmin 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {u.role === "karyawan" ? "mitra" : u.role}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="enter-pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex justify-between items-center px-1">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setPinFlow("login");
                      setPin("");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>

                  {pinFlow === "login" ? (
                    <button
                      onClick={() => {
                        setPinFlow("curr_pin");
                        setPin("");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-indigo-500" />
                      Ubah PIN Login
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPinFlow("login");
                        setPin("");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Batal Ubah PIN
                    </button>
                  )}
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto text-base border border-indigo-200 mb-2">
                    {getInitials(selectedUser.name)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedUser.name}</h2>
                  <p className="text-slate-500 text-xs capitalize">
                    {selectedUser.role === "karyawan" ? "mitra" : selectedUser.role}
                  </p>
                  <div className="mt-2 text-center bg-slate-50 dark:bg-slate-900/40 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800 inline-block">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-650 dark:text-slate-300">
                      {getFlowTitle()}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-0.5">{getFlowSub()}</p>
                  </div>
                </div>

                {successMsg && (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="bg-emerald-50 text-emerald-750 text-[11px] px-3 py-2 rounded-xl border border-emerald-110 flex items-center gap-1.5 font-medium shadow-sm"
                  >
                    <span>✅</span>
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Bullets mapping entered PIN digits */}
                <div className="flex justify-center gap-4.5 my-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        pin.length > index
                          ? "bg-indigo-600 scale-110 shadow-sm shadow-indigo-600/30"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Interactive Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mt-4">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeyPress(num)}
                      className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 text-lg font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center mx-auto"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPin("")}
                    className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-500 active:scale-95 transition-all flex items-center justify-center mx-auto"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeyPress("0")}
                    className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 text-lg font-bold text-slate-700 active:scale-95 transition-all flex items-center justify-center mx-auto"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center mx-auto text-slate-500"
                    aria-label="Delete"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="py-4 border-t border-slate-100 text-center bg-slate-50/50">
          <p className="text-[10px] text-slate-400 font-medium">© 2026 Kalkulator Ronce • PIN Auth Protocol</p>
        </div>
      </div>
    </div>
  );
}
