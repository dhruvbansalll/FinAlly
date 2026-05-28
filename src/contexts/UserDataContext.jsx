import { createContext, useContext, useState, useEffect } from 'react'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const UserDataContext = createContext()

export function useUserData() {
  return useContext(UserDataContext)
}

const DEFAULT_PROFILE = {
  name: '',
  age: '',
  location: '',
  job: '',
  company: '',
  experience: '',
  qualification: '',
  skills: '',
  salary: 0,
  monthlySavingsTarget: 0,
  monthlyBudget: 0,
  profileComplete: false,
}

export function UserDataProvider({ children }) {
  const { currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [goals, setGoals] = useState([])
  const [savings, setSavings] = useState([])
  const [investments, setInvestments] = useState([])
  const [taxEntries, setTaxEntries] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch user profile
  useEffect(() => {
    if (!currentUser) {
      setProfile(null)
      setExpenses([])
      setGoals([])
      setSavings([])
      setInvestments([])
      setTaxEntries([])
      setDocuments([])
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', currentUser.uid)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() })
      } else {
        setProfile({ id: currentUser.uid, ...DEFAULT_PROFILE, email: currentUser.email })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [currentUser])

  // Real-time expenses listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setExpenses(items)
    })
    return unsub
  }, [currentUser])

  // Real-time goals listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'goals'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [currentUser])

  // Real-time savings listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'savings'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setSavings(items)
    })
    return unsub
  }, [currentUser])

  // Real-time investments listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'investments'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setInvestments(items)
    })
    return unsub
  }, [currentUser])

  // Real-time tax entries listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'taxEntries'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setTaxEntries(items)
    })
    return unsub
  }, [currentUser])

  // Real-time documents listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'documents'), where('userId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.uploadedAt?.toDate?.() || new Date()) - (a.uploadedAt?.toDate?.() || new Date()))
      setDocuments(items)
    })
    return unsub
  }, [currentUser])

  // Save / update profile
  async function saveProfile(data) {
    if (!currentUser) return
    const docRef = doc(db, 'users', currentUser.uid)
    const snap = await getDoc(docRef)
    const payload = { ...data, email: currentUser.email, updatedAt: serverTimestamp() }
    if (snap.exists()) {
      await updateDoc(docRef, payload)
    } else {
      await setDoc(docRef, { ...payload, createdAt: serverTimestamp() })
    }
    setProfile((prev) => ({ ...prev, ...payload }))
  }

  // Add expense
  async function addExpense(expense) {
    if (!currentUser) return
    await addDoc(collection(db, 'expenses'), {
      userId: currentUser.uid,
      ...expense,
      createdAt: serverTimestamp(),
    })
  }

  // Delete expense
  async function removeExpense(id) {
    await deleteDoc(doc(db, 'expenses', id))
  }

  // Add goal
  async function addGoal(goal) {
    if (!currentUser) return
    await addDoc(collection(db, 'goals'), {
      userId: currentUser.uid,
      ...goal,
      createdAt: serverTimestamp(),
    })
  }

  // Delete goal
  async function removeGoal(id) {
    await deleteDoc(doc(db, 'goals', id))
  }

  // Update goal (e.g. update current saved amount)
  async function updateGoal(id, data) {
    await updateDoc(doc(db, 'goals', id), data)
  }

  // Add savings entry
  async function addSaving(saving) {
    if (!currentUser) return
    await addDoc(collection(db, 'savings'), {
      userId: currentUser.uid,
      ...saving,
      createdAt: serverTimestamp(),
    })
  }

  // Delete savings entry
  async function removeSaving(id) {
    await deleteDoc(doc(db, 'savings', id))
  }

  // Add investment
  async function addInvestment(investment) {
    if (!currentUser) return
    await addDoc(collection(db, 'investments'), {
      userId: currentUser.uid,
      ...investment,
      createdAt: serverTimestamp(),
    })
  }

  // Delete investment
  async function removeInvestment(id) {
    await deleteDoc(doc(db, 'investments', id))
  }

  // Add tax entry
  async function addTaxEntry(entry) {
    if (!currentUser) return
    await addDoc(collection(db, 'taxEntries'), {
      userId: currentUser.uid,
      ...entry,
      createdAt: serverTimestamp(),
    })
  }

  // Delete tax entry
  async function removeTaxEntry(id) {
    await deleteDoc(doc(db, 'taxEntries', id))
  }

  // Add document metadata
  async function addDocument(docData) {
    if (!currentUser) return
    await addDoc(collection(db, 'documents'), {
      userId: currentUser.uid,
      ...docData,
      createdAt: serverTimestamp(),
    })
  }

  // Delete document
  async function removeDocument(id) {
    await deleteDoc(doc(db, 'documents', id))
  }

  // Computed values
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0)
  const totalGoalTarget = goals.reduce((sum, g) => sum + (g.target || 0), 0)
  const totalGoalSaved = goals.reduce((sum, g) => sum + (g.current || 0), 0)

  const totalInvested = investments.reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalCurrentValue = investments.reduce((sum, i) => sum + (i.currentValue || i.amount || 0), 0)

  const totalTaxableIncome = taxEntries.reduce((sum, e) => sum + (e.grossIncome || 0), 0)
  const totalTaxDeductions = taxEntries.reduce(
    (sum, e) => sum + (e.deductions80C || 0) + (e.deductions80D || 0) + (e.hra || 0) + (e.homeLoanInterest || 0) + (e.otherDeductions || 0),
    0,
  )

  // Current month expenses for budget tracking
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonthExpenses = expenses
    .filter((e) => e.date && e.date.startsWith(currentMonthKey))
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const value = {
    profile,
    expenses,
    goals,
    savings,
    investments,
    taxEntries,
    documents,
    loading,
    totalExpenses,
    totalSavings,
    totalGoalTarget,
    totalGoalSaved,
    totalInvested,
    totalCurrentValue,
    totalTaxableIncome,
    totalTaxDeductions,
    currentMonthExpenses,
    saveProfile,
    addExpense,
    removeExpense,
    addGoal,
    removeGoal,
    updateGoal,
    addSaving,
    removeSaving,
    addInvestment,
    removeInvestment,
    addTaxEntry,
    removeTaxEntry,
    addDocument,
    removeDocument,
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}
