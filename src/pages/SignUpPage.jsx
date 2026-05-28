import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Eye, EyeOff, ChevronRight, ChevronLeft } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { motion } from 'framer-motion'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    location: '',
    job: '',
    company: '',
    experience: '',
    qualification: '',
    skills: '',
    salary: '',
    monthlySavingsTarget: '',
  })

  function handleProfileChange(e) {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  function validatePassword(pw) {
    if (pw.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter.'
    if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter.'
    if (!/[0-9]/.test(pw)) return 'Password must contain a number.'
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain a special character.'
    return ''
  }

  function handleStep1(e) {
    e.preventDefault()
    const pwError = validatePassword(password)
    if (pwError) { toast.error(pwError); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return }
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!profileData.name.trim()) { toast.error('Name is required.'); return }

    try {
      setLoading(true)
      const cred = await signup(email, password)

      await setDoc(doc(db, 'users', cred.user.uid), {
        name: profileData.name.trim(),
        age: profileData.age ? parseInt(profileData.age, 10) : '',
        location: profileData.location.trim(),
        job: profileData.job.trim(),
        company: profileData.company.trim(),
        experience: profileData.experience.trim(),
        qualification: profileData.qualification.trim(),
        skills: profileData.skills.trim(),
        salary: profileData.salary ? parseFloat(profileData.salary) : 0,
        monthlySavingsTarget: profileData.monthlySavingsTarget ? parseFloat(profileData.monthlySavingsTarget) : 0,
        email: email,
        profileComplete: true,
        createdAt: serverTimestamp(),
      })

      navigate('/')
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--app-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <BrandMark size="lg" className="mb-8" />

        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2} aria-label={`Step ${step} of 2`}>
            <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-lavender-400' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-lavender-400' : 'bg-gray-200'}`} />
          </div>

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Create your account</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Start your financial wellness journey 🌸</p>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Tell us about yourself</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">This helps personalize your dashboard ✨</p>
            </>
          )}

          {/* Step 1: Email & Password */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="Min 8 chars, upper, lower, number, special" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lavender-500 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Re-enter your password" />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Profile Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input type="text" name="name" required value={profileData.name} onChange={handleProfileChange} className="input-field text-sm" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                  <input type="number" name="age" min="16" max="120" value={profileData.age} onChange={handleProfileChange} className="input-field text-sm" placeholder="Age" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input type="text" name="location" value={profileData.location} onChange={handleProfileChange} className="input-field text-sm" placeholder="City, Country" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                  <input type="text" name="job" value={profileData.job} onChange={handleProfileChange} className="input-field text-sm" placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                  <input type="text" name="company" value={profileData.company} onChange={handleProfileChange} className="input-field text-sm" placeholder="Company name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
                  <input type="text" name="experience" value={profileData.experience} onChange={handleProfileChange} className="input-field text-sm" placeholder="e.g. 3 years" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qualification</label>
                  <input type="text" name="qualification" value={profileData.qualification} onChange={handleProfileChange} className="input-field text-sm" placeholder="e.g. B.Tech, MBA" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Skills</label>
                <input type="text" name="skills" value={profileData.skills} onChange={handleProfileChange} className="input-field text-sm" placeholder="e.g. React, Finance, Design" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Salary (₹)</label>
                  <input type="number" name="salary" min="0" value={profileData.salary} onChange={handleProfileChange} className="input-field text-sm" placeholder="e.g. 80000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Savings Target (₹/mo)</label>
                  <input type="number" name="monthlySavingsTarget" min="0" value={profileData.monthlySavingsTarget} onChange={handleProfileChange} className="input-field text-sm" placeholder="e.g. 20000" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex items-center gap-1 text-sm flex-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <Spinner size="sm" /> : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-lavender-500 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
