import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Calculator } from "lucide-react";

export function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Cek apakah user sudah terdaftar di database
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // Jika belum, buat profil baru.
        // Beri akses 'owner' otomatis untuk email Anda, selain itu 'karyawan'
        const role = user.email === "davinoalimakenzie@gmail.com" ? "owner" : "karyawan";
        
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || "Pengguna",
          role: role,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError("Gagal masuk: " + (err.message || "Terjadi kesalahan."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl text-white mb-4">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Kalkulator Garapan</h1>
          <p className="text-slate-500 text-sm mt-2">
            Metode Email/Password dinonaktifkan dari sistem. Silakan gunakan akun Google Anda untuk masuk.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-800 px-4 py-3 rounded-lg font-medium transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          {loading ? "Memproses..." : "Masuk dengan Google"}
        </button>
      </div>
    </div>
  );
}
