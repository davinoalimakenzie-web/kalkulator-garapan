import React, { createContext, useContext, useEffect, useState } from "react";
import { Job, Service, UserProfile, SalaryTransaction } from "../types";
import { db, auth } from "../lib/firebase";
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, 
  query, orderBy, addDoc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

interface AppContextType {
  services: Service[];
  jobs: Job[];
  users: UserProfile[];
  transactions: SalaryTransaction[];
  centralBalance: number;
  currentUser: UserProfile | null;
  authLoading: boolean;
  setCurrentUser: (user: UserProfile | null) => void;

  addService: (service: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, service: Omit<Service, "id">) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  addJob: (job: Omit<Job, "id"> & { status?: "pending" | "lunas" }) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  updateJobStatus: (id: string, status: "pending" | "lunas") => Promise<void>;

  addUser: (user: Omit<UserProfile, "id">, uid: string) => Promise<void>;
  
  addTransaction: (tx: Omit<SalaryTransaction, "id" | "createdAt">) => Promise<void>;
  updateCentralBalance: (amount: number, isAdding: boolean) => Promise<void>;
  
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<SalaryTransaction[]>([]);
  const [centralBalance, setCentralBalance] = useState<number>(0);

  // Background anonymous authentication to satisfy Firestore security rules
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Anonymous authentication failed", err);
        }
      } else {
        setFirebaseReady(true);
      }
    });

    return () => unsubAuth();
  }, []);

  // Listen to Firestore once Firebase Auth is ready
  useEffect(() => {
    if (!firebaseReady) return;

    // Listen to users collection
    const unsubUsers = onSnapshot(collection(db, "users"), async (snap) => {
      let usersList = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          role: data.role || "karyawan",
          pin: data.pin || "1234",
          email: data.email
        } as UserProfile;
      });
      
      // Auto-seed a default owner account if database has zero users
      if (usersList.length === 0) {
        const defId = "owner_default";
        const defOwner: Omit<UserProfile, "id"> = {
          name: "Davino Alim",
          role: "owner",
          pin: "1234"
        };
        await setDoc(doc(db, "users", defId), {
          name: defOwner.name,
          role: defOwner.role,
          pin: defOwner.pin,
          createdAt: serverTimestamp()
        });
        usersList = [{ id: defId, ...defOwner }];
      }

      setUsers(usersList);

      // Restore session from localStorage if present
      const savedUid = localStorage.getItem("kalkulator_karyawan_uid");
      if (savedUid) {
        const profile = usersList.find(u => u.id === savedUid);
        if (profile) {
          setCurrentUser(profile);
        } else {
          localStorage.removeItem("kalkulator_karyawan_uid");
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    }, (error) => {
      console.error("Error listening to users", error);
      setAuthLoading(false);
    });

    const unsubServices = onSnapshot(collection(db, "services"), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubJobs = onSnapshot(jobsQuery, (snap) => {
      setJobs(snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status || "pending"
        } as Job;
      }));
    });

    const txQuery = query(collection(db, "salary_transactions"), orderBy("createdAt", "desc"));
    const unsubTx = onSnapshot(txQuery, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalaryTransaction)));
    });

    const unsubBalance = onSnapshot(doc(db, "central_balance", "main"), (docSnap) => {
      if (docSnap.exists()) {
        setCentralBalance(docSnap.data().balance || 0);
      } else {
        setDoc(doc(db, "central_balance", "main"), { balance: 0 }).catch(() => {});
      }
    });

    return () => {
      unsubUsers();
      unsubServices();
      unsubJobs();
      unsubTx();
      unsubBalance();
    };
  }, [firebaseReady]);

  const addService = async (service: Omit<Service, "id">) => {
    await addDoc(collection(db, "services"), { ...service, createdAt: serverTimestamp() });
  };

  const updateService = async (id: string, updatedService: Omit<Service, "id">) => {
    await updateDoc(doc(db, "services", id), updatedService);
  };

  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, "services", id));
  };

  const addJob = async (job: Omit<Job, "id"> & { status?: "pending" | "lunas" }) => {
    await addDoc(collection(db, "jobs"), { 
      ...job, 
      status: job.status || "pending",
      createdAt: serverTimestamp() 
    });
  };

  const deleteJob = async (id: string) => {
    await deleteDoc(doc(db, "jobs", id));
  };

  const updateJobStatus = async (id: string, status: "pending" | "lunas") => {
    await updateDoc(doc(db, "jobs", id), { status });
  };

  const addUser = async (user: Omit<UserProfile, "id">, uid: string) => {
    await setDoc(doc(db, "users", uid), { ...user, createdAt: serverTimestamp() });
  };

  const addTransaction = async (tx: Omit<SalaryTransaction, "id" | "createdAt">) => {
    await addDoc(collection(db, "salary_transactions"), { ...tx, createdAt: serverTimestamp() });
  };

  const updateCentralBalance = async (amount: number, isAdding: boolean) => {
    const newBalance = isAdding ? centralBalance + amount : centralBalance - amount;
    await updateDoc(doc(db, "central_balance", "main"), { balance: newBalance });
  };

  const signOut = async () => {
    localStorage.removeItem("kalkulator_karyawan_uid");
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        services,
        jobs,
        users,
        transactions,
        centralBalance,
        currentUser,
        authLoading,
        setCurrentUser,
        addService,
        updateService,
        deleteService,
        addJob,
        deleteJob,
        updateJobStatus,
        addUser,
        addTransaction,
        updateCentralBalance,
        signOut
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
