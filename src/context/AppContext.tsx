import React, { createContext, useContext, useEffect, useState } from "react";
import { Job, Service, UserProfile, SalaryTransaction } from "../types";
import { db, auth } from "../lib/firebase";
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, 
  query, orderBy, addDoc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";

interface AppContextType {
  services: Service[];
  jobs: Job[];
  users: UserProfile[];
  transactions: SalaryTransaction[];
  centralBalance: number;
  currentUser: UserProfile | null;
  authLoading: boolean;

  addService: (service: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, service: Omit<Service, "id">) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  addJob: (job: Omit<Job, "id">) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;

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

  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<SalaryTransaction[]>([]);
  const [centralBalance, setCentralBalance] = useState<number>(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user profile
        const unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setCurrentUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setCurrentUser(null);
          }
          setAuthLoading(false);
        });
        return () => unsubProfile();
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubServices = onSnapshot(collection(db, "services"), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const unsubJobs = onSnapshot(jobsQuery, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
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
      unsubServices();
      unsubJobs();
      unsubUsers();
      unsubTx();
      unsubBalance();
    };
  }, [currentUser]);

  const addService = async (service: Omit<Service, "id">) => {
    await addDoc(collection(db, "services"), { ...service, createdAt: serverTimestamp() });
  };

  const updateService = async (id: string, updatedService: Omit<Service, "id">) => {
    await updateDoc(doc(db, "services", id), updatedService);
  };

  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, "services", id));
  };

  const addJob = async (job: Omit<Job, "id">) => {
    await addDoc(collection(db, "jobs"), { ...job, createdAt: serverTimestamp() });
  };

  const deleteJob = async (id: string) => {
    await deleteDoc(doc(db, "jobs", id));
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
    await firebaseSignOut(auth);
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
        addService,
        updateService,
        deleteService,
        addJob,
        deleteJob,
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
