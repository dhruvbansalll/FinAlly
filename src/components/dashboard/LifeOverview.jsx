import {
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  MapPin,
} from 'lucide-react'
import { useUserData } from '../../contexts/UserDataContext'

export default function LifeOverview() {
  const { profile } = useUserData()
  const name = profile?.name || 'User'
  const location = profile?.location || 'Not set'
  const age = profile?.age || ''
  const job = profile?.job || 'Not set'
  const skills = profile?.skills || 'Not set'
  const experience = profile?.experience || 'Not set'
  const qualification = profile?.qualification || ''
  const certifications = qualification ? qualification.split(',').map((c) => c.trim()).filter(Boolean) : []

  return (
    <div className="card bg-gradient-to-br from-white to-lavender-50/50 relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-lavender-200/30 to-blush-200/20 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-mint-200/20 to-lavender-200/20 rounded-full blur-2xl" />

      <div className="relative flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center shadow-soft-lg relative">
            <span className="text-3xl">👩‍💼</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-mint-400 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-900">{name}</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5" /> {location}{age ? ` • Age ${age}` : ''}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoChip icon={Briefcase} label="Role" value={job} color="lavender" />
            <InfoChip icon={GraduationCap} label="Skills" value={skills} color="blush" />
            <InfoChip icon={Award} label="Experience" value={experience} color="mint" />
          </div>

          {certifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="px-2.5 py-1 rounded-xl bg-peach-50 text-peach-700 text-[11px] font-medium border border-peach-100"
                >
                  🏅 {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value, color }) {
  const colorMap = {
    lavender: 'bg-lavender-50 text-lavender-700 border-lavender-100',
    blush: 'bg-blush-50 text-blush-700 border-blush-100',
    mint: 'bg-mint-50 text-mint-700 border-mint-100',
  }
  const iconColorMap = {
    lavender: 'text-lavender-400',
    blush: 'text-blush-400',
    mint: 'text-mint-400',
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border ${colorMap[color]}`}>
      <Icon className={`w-4 h-4 ${iconColorMap[color]} flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide opacity-60">{label}</p>
        <p className="text-xs font-semibold truncate">{value}</p>
      </div>
    </div>
  )
}
