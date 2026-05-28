import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
} from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, deleteDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        return sendEmailVerification(userCredential.user).then(() => userCredential)
      })
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  function sendVerificationEmail() {
    if (currentUser) {
      return sendEmailVerification(currentUser)
    }
    return Promise.reject(new Error('No user logged in'))
  }

  async function deleteAccount() {
    if (!currentUser) {
      throw new Error('No user logged in')
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid)
      await deleteDoc(userDocRef)
      await deleteUser(currentUser)
    } catch (error) {
      console.error('Error deleting account:', error)
      throw new Error(`Failed to delete account: ${error.message}`)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    sendVerificationEmail,
    deleteAccount,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
