import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Landmark, Shield, Heart, Sparkles, ArrowLeft,
  Loader2, Lock, Percent, Calendar, Users, BadgeCheck,
} from 'lucide-react'
import { useUserData } from '../contexts/UserDataContext'
import { getSchemeAdvice } from '../utils/geminiApi'
import governmentSchemes from '../data/governmentSchemes'
import PageHeader from '../components/ui/PageHeader'

function SchemeCard({ scheme, highlighted }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card relative overflow-hidden ${
        highlighted
          ? 'border-blush-200 dark:border-blush-700'
          : ''
      }`}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blush-400 to-lavender-400" />
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{scheme.name}</h3>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            scheme.womenSpecific
              ? 'bg-blush-100 dark:bg-blush-900/30 text-blush-600 dark:text-blush-400'
              : 'bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400'
          }`}>
            {scheme.category}
          </span>
        </div>
        {scheme.womenSpecific && (
          <div className="w-8 h-8 rounded-xl bg-blush-100 dark:bg-blush-900/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-blush-500 fill-blush-500" />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
        {scheme.description}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Percent className="w-3 h-3 text-mint-500" />
          <span className="text-gray-600 dark:text-gray-300 font-medium">{scheme.interestRate}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <Lock className="w-3 h-3 text-peach-500" />
          <span className="text-gray-600 dark:text-gray-300">{scheme.lockIn}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <Calendar className="w-3 h-3 text-lavender-500" />
          <span className="text-gray-600 dark:text-gray-300">Min: {scheme.minInvestment}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <Users className="w-3 h-3 text-blush-500" />
          <span className="text-gray-600 dark:text-gray-300 truncate">{scheme.eligibility}</span>
        </div>
      </div>

      {scheme.taxBenefit && scheme.taxBenefit !== 'No tax benefit' && scheme.taxBenefit !== 'No tax benefit on investment' && scheme.taxBenefit !== 'Interest taxable' && (
        <div className="flex items-center gap-1.5 mb-3">
          <BadgeCheck className="w-3.5 h-3.5 text-mint-500" />
          <span className="text-[11px] text-mint-600 dark:text-mint-400 font-semibold">{scheme.taxBenefit}</span>
        </div>
      )}

      <div className="p-3 rounded-xl bg-gradient-to-br from-lavender-50/50 to-blush-50/50 dark:from-lavender-900/10 dark:to-blush-900/10 border border-lavender-100/30 dark:border-lavender-800/20">
        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
          <span className="font-semibold text-lavender-600 dark:text-lavender-400">Why for women: </span>
          {scheme.whyForWomen}
        </p>
      </div>
    </motion.div>
  )
}

export default function GovernmentSchemesPage() {
  const { profile, goals } = useUserData()
  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lifeStage, setLifeStage] = useState('')

  const womenSchemes = governmentSchemes.filter(s => s.womenSpecific)
  const generalSchemes = governmentSchemes.filter(s => !s.womenSpecific)

  async function handleGetAdvice() {
    setLoading(true)
    try {
      const result = await getSchemeAdvice({ profile, lifeStage, goals })
      setAdvice(result)
    } catch (err) {
      console.error('Scheme advice error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        icon={Landmark}
        title="Government Investment Schemes"
        subtitle="Secure, guaranteed-return investment options backed by the Government of India"
        action={
          <Link to="/investments" className="btn-secondary text-xs flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Investments
          </Link>
        }
      />

      {/* Women's Picks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-blush-500 fill-blush-500" />
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Women-Exclusive Schemes</h2>
          <span className="px-2 py-0.5 rounded-full bg-blush-100 dark:bg-blush-900/30 text-blush-600 dark:text-blush-400 text-[10px] font-bold">
            Special
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {womenSchemes.map(scheme => (
            <SchemeCard key={scheme.name} scheme={scheme} highlighted />
          ))}
        </div>
      </div>

      {/* All Schemes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-lavender-500" />
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">All Government Schemes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generalSchemes.map(scheme => (
            <SchemeCard key={scheme.name} scheme={scheme} />
          ))}
        </div>
      </div>

      {/* AI Scheme Advisor */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">AI Scheme Advisor</h3>
            <p className="text-[11px] text-gray-400">Which scheme is right for you?</p>
          </div>
        </div>

        {!advice && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Get personalized scheme recommendations based on your profile
            </p>
            <button onClick={handleGetAdvice} className="btn-primary text-sm flex items-center gap-2 mx-auto">
              <Sparkles className="w-4 h-4" /> Find My Best Schemes
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-8 h-8 text-lavender-500 animate-spin mb-3" />
            <p className="text-sm text-gray-400">Analyzing best schemes for you...</p>
          </div>
        )}

        {advice && !loading && (
          <div className="bg-gradient-to-br from-lavender-50/50 to-mint-50/50 dark:from-lavender-900/20 dark:to-mint-900/10 rounded-2xl p-5">
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {advice}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="card bg-gradient-to-br from-lavender-50 to-mint-50 dark:from-lavender-900/20 dark:to-mint-900/10 text-center py-8">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">
          Ready to invest?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Track your government scheme investments alongside your portfolio
        </p>
        <Link to="/investments" className="btn-primary text-sm inline-flex items-center gap-2">
          Add to Portfolio <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>
    </div>
  )
}
