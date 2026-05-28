import { useState, useRef, useEffect, useMemo } from 'react'
import { MessageCircleHeart, Send, Sparkles, Bot } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useUserData } from '../contexts/UserDataContext'
import { compareRegimes, formatINR } from '../utils/taxEngine'
import { getAllyChatResponse } from '../utils/geminiApi'

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Math.round(n).toLocaleString()}`
}

const CHART_COLORS = ['#a78bfa', '#f9a8d4', '#86efac', '#fcd34d', '#93c5fd', '#fca5a5', '#c4b5fd', '#a5f3fc']

function detectChartRequest(text) {
  const lower = text.toLowerCase()
  const wantsChart = lower.match(/chart|graph|pie|donut|bar chart|visual|plot|diagram|breakdown.*chart|show.*chart|draw/)
  if (!wantsChart) return null

  if (lower.match(/spend|expense|category/)) return 'expense-pie'
  if (lower.match(/invest|portfolio|holding/)) return 'investment-pie'
  if (lower.match(/goal|target|progress/)) return 'goals-bar'
  if (lower.match(/saving|save/)) return 'savings-bar'
  if (lower.match(/income|salary|budget/)) return 'budget-bar'
  return 'expense-pie'
}

function buildChartData(type, userData) {
  const { expenses, investments, goals, savings, profile, currentMonthExpenses } = userData

  if (type === 'expense-pie') {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthExpenses = (expenses || []).filter(e => e.date && e.date.startsWith(monthKey))
    const catTotals = {}
    monthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0) })
    const data = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
    return data.length ? { chartType: 'pie', data, title: 'Spending by Category (This Month)' } : null
  }

  if (type === 'investment-pie') {
    const types = {}
    ;(investments || []).forEach(i => { types[i.type] = (types[i.type] || 0) + (i.amount || 0) })
    const data = Object.entries(types).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
    return data.length ? { chartType: 'pie', data, title: 'Investment Portfolio Breakdown' } : null
  }

  if (type === 'goals-bar') {
    const data = (goals || []).map(g => ({
      name: (g.title || g.name || 'Goal').slice(0, 12),
      saved: g.current || 0,
      target: g.target || 0,
    }))
    return data.length ? { chartType: 'bar', data, title: 'Goals Progress', keys: ['saved', 'target'] } : null
  }

  if (type === 'savings-bar') {
    const data = (savings || []).slice(0, 8).map(s => ({
      name: (s.name || s.source || 'Savings').slice(0, 12),
      value: s.amount || 0,
    }))
    return data.length ? { chartType: 'bar-simple', data, title: 'Savings Breakdown' } : null
  }

  if (type === 'budget-bar') {
    const salary = profile?.salary || 0
    const budget = profile?.monthlyBudget || 0
    const data = [
      { name: 'Income', value: salary },
      { name: 'Budget', value: budget },
      { name: 'Spent', value: currentMonthExpenses || 0 },
    ].filter(d => d.value > 0)
    return data.length ? { chartType: 'bar-simple', data, title: 'Budget Overview' } : null
  }

  return null
}

const initialMessages = [
  {
    id: 1,
    from: 'bot',
    text: "Hi there! 💜 I'm Ally, your personal financial companion. How can I help you today?",
    time: '10:00 AM',
  },
]

const quickPrompts = [
  '💰 How can I save more?',
  '📊 Analyze my spending',
  '📊 Show spending pie chart',
  '🎯 How are my goals?',
  '💳 Budget check',
  '💡 Which tax regime is better for me?',
  '📈 Show investment chart',
  '💼 Am I being paid fairly?',
  '📁 What documents have I uploaded?',
  '🌱 Investment suggestions',
]

function findAmountsInText(text) {
  const patterns = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/gi,
  ]
  const amounts = []
  for (const pat of patterns) {
    let m
    while ((m = pat.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(/,/g, ''))
      if (val > 0 && !amounts.includes(val)) amounts.push(val)
    }
  }
  return amounts.sort((a, b) => b - a)
}

const FINANCIAL_KEYWORDS = [
  'total income', 'gross total income', 'gross salary', 'net salary',
  'tax deducted', 'tds', 'tax payable', 'taxable income',
  'deduction', '80c', '80d', 'hra', 'interest',
  'salary', 'pension', 'profit', 'loss', 'capital gain',
  'rent', 'premium', 'dividend', 'maturity', 'balance',
  'pan', 'assessment year', 'financial year',
]

function extractFinancialHighlights(text) {
  const lower = text.toLowerCase()
  const highlights = []
  for (const kw of FINANCIAL_KEYWORDS) {
    const idx = lower.indexOf(kw)
    if (idx === -1) continue
    const start = Math.max(0, idx - 30)
    const end = Math.min(text.length, idx + kw.length + 60)
    let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet += '...'
    highlights.push({ keyword: kw, snippet })
    if (highlights.length >= 8) break
  }
  return highlights
}

function findDocByQuery(docs, query) {
  const lower = query.toLowerCase()
  const words = lower.split(/\s+/).filter((w) => w.length > 2)
  let best = null
  let bestScore = 0
  for (const d of docs) {
    const name = (d.name || '').toLowerCase()
    let score = 0
    for (const w of words) {
      if (name.includes(w)) score += 2
    }
    if (lower.includes(name.replace(/\.[^.]+$/, ''))) score += 3
    if (score > bestScore) { bestScore = score; best = d }
  }
  return bestScore > 0 ? best : null
}

function buildAllyResponse(text, data) {
  const lower = text.toLowerCase()
  const {
    profile, expenses, goals, savings,
    investments, taxEntries, documents,
    totalExpenses, totalSavings, totalGoalTarget, totalGoalSaved,
    totalInvested, totalCurrentValue,
    totalTaxableIncome, totalTaxDeductions,
    currentMonthExpenses,
  } = data

  const salary = profile?.salary || 0
  const budget = profile?.monthlyBudget || 0
  const savingsTarget = profile?.monthlySavingsTarget || 0
  const name = profile?.name || ''
  const greeting = name ? `${name}, ` : ''

  // --- BUDGET CHECK ---
  if (lower.includes('budget') || lower.includes('wallet') || lower.includes('limit') || lower.includes('remaining')) {
    if (budget <= 0) {
      return `${greeting}you haven't set a monthly spending limit yet. Would you like to head over to your Profile and set one? It's a great way to stay in control of your spending — no stress, just clarity. 🌸`
    }
    const spent = currentMonthExpenses
    const remaining = Math.max(budget - spent, 0)
    const pct = Math.round((spent / budget) * 100)
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - now.getDate() + 1
    const dailyAllowance = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0

    let remark = ''
    if (pct > 100) remark = "You've gone over your budget this month — but that's okay, we can adjust together. Maybe we can find a few areas to cut back for the rest of the month? 💜"
    else if (pct >= 90) remark = "You're very close to your limit. Maybe hold off on non-essentials for the next few days? You've got this! 🌸"
    else if (pct >= 70) remark = "You're at the 70% mark — staying mindful now will pay off. You're doing great! 🌿"
    else if (pct >= 50) remark = "You've used about half your budget. You're right on track — keep it up! ✨"
    else remark = "You're spending mindfully this month — wonderful job! 🌱"

    return `Here's your budget snapshot for this month:\n\n• Monthly Limit: ${fmt(budget)}\n• Spent So Far: ${fmt(spent)} (${pct}%)\n• Remaining: ${fmt(remaining)}\n• Daily Allowance: ~${fmt(dailyAllowance)}/day (${daysLeft} days left)\n\n${remark}`
  }

  // --- EXPENSE ANALYSIS ---
  if (lower.includes('spend') || lower.includes('expense') || lower.includes('analyz')) {
    if (expenses.length === 0) {
      return `${greeting}you haven't logged any expenses yet. Head over to the Expenses page and start tracking — even small entries help build a clear picture. I'll be here to help you spot patterns! 🌼`
    }
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(monthKey))
    const catTotals = {}
    monthExpenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0) })
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1])

    if (sorted.length === 0) {
      return `${greeting}no expenses recorded for this month yet. Once you start logging, I can give you a full breakdown by category. 🌸`
    }

    let breakdown = sorted.map(([cat, amt]) => `• ${cat}: ${fmt(amt)}`).join('\n')
    const topCat = sorted[0]
    let tip = ''
    if (topCat[0] === 'Shopping') tip = "\n\nYour biggest spend is Shopping — maybe try a 24-hour rule before impulse buys? It really helps! 🛍️"
    else if (topCat[0] === 'Food') tip = "\n\nFood is your top category — meal prepping even 2-3 times a week could save quite a bit. You could try it if you'd like! 🍱"
    else if (topCat[0] === 'Self-care') tip = "\n\nSelf-care is important and you deserve it! 💜 If you'd like to optimize, maybe look for subscription deals or at-home alternatives for some treatments."
    else tip = `\n\n${topCat[0]} is your biggest category this month. If you'd like, I can suggest ways to optimize there. 🌿`

    return `Here's your spending breakdown for ${now.toLocaleString('default', { month: 'long' })}:\n\n${breakdown}\n\nTotal this month: ${fmt(currentMonthExpenses)}${tip}`
  }

  // --- FINANCIAL HEALTH ---
  if (lower.includes('financial health') || lower.includes('overview') || lower.includes('how am i doing') || lower.includes('summary')) {
    let parts = [`${greeting}here's a quick look at your financial picture:\n`]
    if (salary > 0) parts.push(`• Monthly Income: ${fmt(salary)}`)
    parts.push(`• Total Expenses: ${fmt(totalExpenses)}`)
    parts.push(`• Total Savings: ${fmt(totalSavings)}`)
    if (salary > 0) {
      const rate = Math.round((totalSavings / salary) * 100)
      parts.push(`• Savings Rate: ${rate}%`)
      if (rate >= 20) parts.push("\nYou're saving 20%+ of your income — that's amazing! You're building real financial security. ✨")
      else if (rate >= 10) parts.push("\nYou're off to a good start! If you can nudge savings up to 20%, you'll build a solid safety net even faster. 🌱")
      else parts.push("\nYour savings rate is a bit low right now — but that's okay, every journey starts somewhere. Could you try setting aside even a small fixed amount each month? 💛")
    }
    if (goals.length > 0) {
      const goalPct = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0
      parts.push(`\n• Goals Progress: ${goalPct}% (${fmt(totalGoalSaved)} of ${fmt(totalGoalTarget)})`)
    }
    if ((investments || []).length > 0) {
      const gain = totalCurrentValue - totalInvested
      parts.push(`\n• Investments: ${fmt(totalInvested)} invested → ${fmt(totalCurrentValue)} current (${gain >= 0 ? '+' : ''}${fmt(gain)})`)
    }
    if ((taxEntries || []).length > 0) {
      parts.push(`• Tax Records: ${taxEntries.length} entries, ${fmt(totalTaxableIncome)} total income logged`)
    }
    if ((documents || []).length > 0) {
      parts.push(`• Documents: ${documents.length} file${documents.length !== 1 ? 's' : ''} uploaded`)
    }
    return parts.join('\n')
  }

  // --- GOALS ---
  if (lower.includes('goal')) {
    if (goals.length === 0) {
      return `${greeting}you haven't set any financial goals yet. Head to the Goals page and let's dream together! Whether it's a vacation, emergency fund, or a big purchase — having a target makes saving so much easier. 🌟`
    }
    let lines = [`${greeting}here's how your goals are looking:\n`]
    goals.forEach((g) => {
      const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
      const label = g.title || g.name || 'Untitled'
      lines.push(`• ${label}: ${fmt(g.current || 0)} / ${fmt(g.target || 0)} (${pct}%)`)
      if (savingsTarget > 0 && g.target > (g.current || 0)) {
        const remaining = g.target - (g.current || 0)
        const months = Math.ceil(remaining / savingsTarget)
        lines.push(`  → At your current savings rate, ~${months} month${months !== 1 ? 's' : ''} to go`)
      }
    })
    const overallPct = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0
    if (overallPct >= 75) lines.push("\nYou're so close to your goals — keep going, you've got this! 🎉")
    else if (overallPct >= 50) lines.push("\nHalfway there! You're making real progress. ✨")
    else lines.push("\nEvery bit counts — you're building something wonderful. Stay consistent! 🌱")
    return lines.join('\n')
  }

  // --- PAY PARITY ---
  if (lower.includes('pay') || lower.includes('salary') || lower.includes('paid fairly') || lower.includes('underpaid') || lower.includes('parity')) {
    const job = profile?.job || ''
    const exp = profile?.experience || ''
    const skills = profile?.skills || ''
    if (!job && salary <= 0) {
      return `${greeting}I'd love to help you assess your pay, but I need a bit more info. Could you update your profile with your job title, experience, and current salary? Then I can give you a better picture. 🌼`
    }
    let response = `Based on what you've shared:\n\n• Role: ${job || 'Not specified'}\n• Experience: ${exp || 'Not specified'}\n• Current Salary: ${salary > 0 ? fmt(salary) + '/month' : 'Not set'}`
    if (skills) response += `\n• Skills: ${skills}`

    response += "\n\nPay fairness depends on many factors — industry, location, company size, and negotiation. Here are some tips:\n\n"
    response += "1. Research salary ranges on sites like Glassdoor, LinkedIn Salary, or AmbitionBox for your specific role and city.\n"
    response += "2. If you feel your pay is below market, consider documenting your achievements and impact — they're your strongest negotiation tools.\n"
    response += "3. Upskilling in high-demand areas can significantly boost your earning potential.\n\n"
    response += "You deserve to be compensated fairly for your work. Don't hesitate to advocate for yourself — I'm here to support you! 💜"
    return response
  }

  // --- SAVINGS ---
  if (lower.includes('save') || lower.includes('saving')) {
    if (salary <= 0) {
      return `${greeting}I'd love to help you save more! Could you share your monthly income in your Profile so I can give you personalized advice? 🌸`
    }
    const rate = totalSavings > 0 ? Math.round((totalSavings / salary) * 100) : 0
    let tips = `${greeting}here's where you stand with savings:\n\n• Total Saved: ${fmt(totalSavings)}\n• Savings Rate: ${rate}% of monthly income`
    if (savingsTarget > 0) tips += `\n• Monthly Target: ${fmt(savingsTarget)}`

    tips += "\n\nHere are a few gentle tips that really work:\n\n"
    tips += "• Try the 50-30-20 rule: 50% needs, 30% wants, 20% savings\n"
    tips += "• Automate a fixed transfer to savings right after payday — 'pay yourself first'\n"
    tips += "• Round up daily spends and save the difference\n"
    if (budget > 0 && currentMonthExpenses > 0) {
      const couldSave = budget - currentMonthExpenses
      if (couldSave > 0) tips += `\n• You have ${fmt(couldSave)} left in this month's budget — if you can save even half of that, it adds up! ✨`
    }
    tips += "\n\nSmall, consistent steps build real wealth over time. You're already on the right path! 🌱"
    return tips
  }

  // --- TAX (personalized with user data) ---
  if (lower.includes('tax') || lower.includes('deduction') || lower.includes('80c') || lower.includes('80d') || lower.includes('regime')) {
    const entries = taxEntries || []
    const latestEntry = entries.length > 0 ? entries[0] : null

    if (lower.match(/which regime|better regime|compare|recommend/) && latestEntry) {
      const gross = latestEntry.grossIncome || 0
      if (gross > 0) {
        const c = compareRegimes(gross, latestEntry)
        let msg = `${greeting}based on your latest tax record (${formatINR(gross)} income):\n\n`
        msg += `• Old Regime Tax: ${formatINR(c.old.totalTax)} (effective ${c.old.effectiveRate}%)\n`
        msg += `• New Regime Tax: ${formatINR(c.new.totalTax)} (effective ${c.new.effectiveRate}%)\n\n`
        msg += `${c.summary}\n\n`

        const ded80C = latestEntry.deductions80C || 0
        const ded80D = latestEntry.deductions80D || 0
        if (ded80C < 150000 && c.recommended === 'old') {
          msg += `Tip: Your 80C deductions are ${formatINR(ded80C)} — you can claim up to ₹1.5L. Consider PPF, ELSS, or EPF to maximize this.\n`
        }
        if (ded80D === 0) {
          msg += `Tip: You have no 80D deductions logged. Do you have health insurance? You could save up to ₹25K on premiums.\n`
        }
        return msg
      }
    }

    if (entries.length > 0) {
      let response = `${greeting}here's what I know from your tax records:\n\n`
      response += `• ${entries.length} tax record${entries.length !== 1 ? 's' : ''} saved\n`
      response += `• Total Income Logged: ${fmt(totalTaxableIncome)}\n`
      response += `• Total Deductions: ${fmt(totalTaxDeductions)}\n`
      if (latestEntry) {
        response += `• Latest Entry: FY ${latestEntry.financialYear}, ${latestEntry.regime === 'old' ? 'Old' : 'New'} Regime, ${fmt(latestEntry.grossIncome || 0)} income\n`
      }
      response += "\nTax-saving options:\n\n"
      response += "• Section 80C (up to ₹1.5L): PPF, ELSS, EPF, life insurance, NSC\n"
      response += "• Section 80D: Health insurance premiums (₹25K self + ₹50K parents)\n"
      response += "• HRA Exemption: If you pay rent and receive HRA\n\n"
      response += "Head to the Taxation page for a detailed regime comparison with your numbers! 💡"
      return response
    }

    let response = `${greeting}here's a simple overview of tax-saving options:\n\n`
    response += "Section 80C (up to ₹1.5L/year):\n• PPF, ELSS mutual funds, EPF, life insurance, tuition fees, NSC\n\n"
    response += "Section 80D (health insurance):\n• Up to ₹25K for self/family, +₹50K for senior citizen parents\n\n"
    response += "HRA Exemption: If you pay rent and get HRA, a portion can be tax-free\n\n"
    response += "Old vs New Regime:\n• Old: More deductions available (80C, 80D, HRA, etc.)\n• New: Lower tax rates but fewer deductions\n• If your deductions are > ₹2-3L, the old regime usually saves more\n\n"
    response += "Head to the Taxation page to compute your tax and find which regime works best! 💡"
    return response
  }

  // --- INVESTMENT (personalized with user data) ---
  if (lower.includes('invest') || lower.includes('sip') || lower.includes('mutual') || lower.includes('stock') || lower.includes('portfolio')) {
    const invs = investments || []

    if (invs.length > 0) {
      const gain = totalCurrentValue - totalInvested
      const gainPct = totalInvested > 0 ? Math.round((gain / totalInvested) * 100) : 0
      let response = `${greeting}here's your investment portfolio summary:\n\n`
      response += `• Total Invested: ${fmt(totalInvested)}\n`
      response += `• Current Value: ${fmt(totalCurrentValue)}\n`
      response += `• Overall Return: ${gain >= 0 ? '+' : ''}${fmt(gain)} (${gain >= 0 ? '+' : ''}${gainPct}%)\n`
      response += `• Holdings: ${invs.length}\n\n`

      const types = {}
      invs.forEach((i) => { types[i.type] = (types[i.type] || 0) + (i.amount || 0) })
      response += "By type:\n"
      Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([type, amt]) => {
        response += `• ${type}: ${fmt(amt)}\n`
      })

      const hasELSS = invs.some((i) => (i.name || '').toLowerCase().includes('elss'))
      const hasPPF = invs.some((i) => i.type === 'PPF')
      if (!hasELSS && !hasPPF) {
        response += "\nTip: You don't have ELSS or PPF yet — both offer tax benefits under 80C along with decent returns! 🌱"
      }
      if (gain < 0) {
        response += "\nYour portfolio is currently at a loss — but don't panic! Markets fluctuate. Stay invested for the long term and avoid selling during dips. 💜"
      } else if (gainPct > 15) {
        response += "\nGreat returns! Consider rebalancing if one asset type has grown much more than others. 🌿"
      }
      return response
    }

    let response = `${greeting}investing is one of the best things you can do for your future self! Here's a simple starting guide:\n\n`
    response += "For beginners:\n• Start a SIP (Systematic Investment Plan) in an index fund — even ₹500/month\n• PPF is great for safe, tax-free returns\n• ELSS gives tax benefits under 80C + market-linked growth\n\n"
    response += "If you're already investing:\n• Diversify across equity, debt, and gold\n• Review your portfolio every 6 months\n• Don't panic-sell during market dips — stay the course\n\n"
    if (salary > 0) {
      const idealInvest = Math.round(salary * 0.2)
      response += `With your income, you could consider investing around ${fmt(idealInvest)}/month (roughly 20%). But even smaller amounts are a great start!\n\n`
    }
    response += "Head to the Investments page to track your portfolio. Remember, the best time to start was yesterday — the second best is today! 🌱"
    return response
  }

  // --- DOCUMENTS ---
  if (lower.includes('document') || lower.includes('file') || lower.includes('upload') || lower.includes('proof')) {
    const docs = documents || []
    if (docs.length === 0) {
      return `${greeting}you haven't uploaded any documents yet. Head to the Documents page to upload tax forms, investment proofs, insurance policies, or receipts — keeping everything organized in one place makes life easier! 📁`
    }

    const docsWithContent = docs.filter((d) => d.textContent && d.textContent.length > 0)
    const wantsAnalysis = lower.match(/analy[sz]|summar|read|what does|what.*(say|contain|show)|tell me about|review|check my|look at|examine/)
    const mentionsSpecific = lower.match(/form.?16|itr|salary.?slip|pay.?slip|receipt|invoice|insurance|statement|certificate|pan.?card/)

    if (wantsAnalysis || mentionsSpecific) {
      const matchedDoc = findDocByQuery(docsWithContent, text)

      if (matchedDoc && matchedDoc.textContent) {
        const content = matchedDoc.textContent
        const highlights = extractFinancialHighlights(content)
        const amounts = findAmountsInText(content)

        let response = `${greeting}here's what I found in "${matchedDoc.name}":\n\n`

        if (amounts.length > 0) {
          response += "Key amounts found:\n"
          amounts.slice(0, 6).forEach((a) => {
            response += `• ${fmt(a)}\n`
          })
          response += "\n"
        }

        if (highlights.length > 0) {
          response += "Relevant sections:\n"
          highlights.forEach((h) => {
            response += `• ${h.snippet}\n`
          })
          response += "\n"
        }

        if (amounts.length === 0 && highlights.length === 0) {
          const preview = content.slice(0, 500).replace(/\s+/g, ' ').trim()
          response += `Document preview:\n${preview}${content.length > 500 ? '...' : ''}\n\n`
        }

        response += "Ask me a specific question about this document and I'll try to find the answer! 📄"
        return response
      }

      if (docsWithContent.length > 0) {
        let response = `${greeting}here's an analysis of your ${docsWithContent.length} readable document${docsWithContent.length !== 1 ? 's' : ''}:\n\n`

        for (const d of docsWithContent.slice(0, 5)) {
          const amounts = findAmountsInText(d.textContent)
          const highlights = extractFinancialHighlights(d.textContent)
          response += `📄 ${d.name}:\n`
          if (amounts.length > 0) {
            response += `  Amounts: ${amounts.slice(0, 3).map((a) => fmt(a)).join(', ')}${amounts.length > 3 ? ` (+${amounts.length - 3} more)` : ''}\n`
          }
          if (highlights.length > 0) {
            response += `  Contains: ${highlights.map((h) => h.keyword).join(', ')}\n`
          }
          if (amounts.length === 0 && highlights.length === 0) {
            response += `  ${d.textContent.slice(0, 100).replace(/\s+/g, ' ').trim()}...\n`
          }
          response += "\n"
        }

        if (docsWithContent.length > 5) {
          response += `...and ${docsWithContent.length - 5} more readable document${docsWithContent.length - 5 !== 1 ? 's' : ''}.\n\n`
        }

        response += "Ask about a specific document by name for a deeper look!"
        return response
      }

      return `${greeting}I can see you have ${docs.length} document${docs.length !== 1 ? 's' : ''} uploaded, but none of them have readable text content (images and non-PDF files can't be analyzed yet). Try uploading PDF or text files for full analysis! 📄`
    }

    let response = `${greeting}here's a summary of your uploaded documents:\n\n`
    response += `• Total Files: ${docs.length}\n`
    if (docsWithContent.length > 0) {
      response += `• Readable (analyzable): ${docsWithContent.length}\n`
    }
    response += "\n"
    const typeGroups = {}
    docs.forEach((d) => { typeGroups[d.type] = (typeGroups[d.type] || 0) + 1 })
    response += "By type:\n"
    Object.entries(typeGroups).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      response += `• ${type}: ${count} file${count !== 1 ? 's' : ''}\n`
    })
    response += "\nRecent uploads:\n"
    docs.slice(0, 5).forEach((d) => {
      response += `• ${d.name} (${d.size})${d.textContent ? ' ✓ readable' : ''}\n`
    })
    if (docs.length > 5) response += `• ...and ${docs.length - 5} more\n`
    response += "\nTip: Try \"Analyze my documents\" or ask about a specific document by name to see what's inside! 📄"
    return response
  }

  // --- STRESS / EMOTIONAL ---
  if (lower.includes('stress about money') || lower.includes('financial stress') || lower.includes('money stress') || lower.includes('debt stress')) {
    return `${greeting}I hear you, and it's completely okay to feel this way. 💛 Financial stress is real, and you're not alone in this.\n\nTake a deep breath with me. Here are a few things that might help:\n\n• Start with just knowing where you stand — awareness reduces anxiety\n• Focus on one small step today: log an expense, set a tiny goal, or check your budget\n• Remember: your worth isn't defined by your bank balance\n• Progress isn't always linear — every good choice counts\n\nYou're already taking a brave step by being here and thinking about your finances. That takes courage! 🌸\n\nWant me to help you with something specific? I'm here for you.`
  }

  // --- CASUAL / EMOTIONAL / SMALL TALK ---

  if (lower.match(/^(hi|hello|hey|good morning|good evening|good afternoon|hii+|hola|yo|sup)[\s!.]*$/)) {
    const greetings = [
      `Hey ${name || 'there'}! 💜 How are you doing today?`,
      `Hi ${name || 'there'}! 🌸 Good to see you. What's on your mind?`,
      `Hello ${name || 'there'}! 💛 How's your day going?`,
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  if (lower.match(/^(thanks?|thank you|ty|thx|appreciate it)[\s!.]*$/)) {
    return `You're welcome! 💜 I'm always here if you need me.`
  }

  if (lower.match(/^(good|great|fine|i'm good|i'm fine|i'm great|doing good|doing well|doing great|pretty good|all good|not bad|i'm okay|i'm ok)[\s!.]*$/)) {
    return `That's lovely to hear! 🌸 I'm here whenever you need anything.`
  }

  if (lower.match(/^(not so great|not good|bad|sad|tired|meh|ugh|blah|not well|not okay|not great|could be better|rough day|tough day|bad day)[\s!.]*$/)) {
    return `I'm sorry to hear that. 💛 I hope things get better soon. I'm here if you want to talk or if there's anything I can help with.`
  }

  if (lower.match(/^(okay|ok|k|hmm|hm|mm|ah|oh|alright|sure|yep|yup|yeah|ya|right|cool|nice|lol|haha|gotcha|got it|i see|ohh|ooh)[\s!.]*$/)) {
    return `😊 I'm here whenever you need me!`
  }

  if (lower.match(/how are you|how('re| are) (you|u)|how do you do|what('s| is) up/)) {
    return `I'm doing great, thank you for asking! 💜 Always happy to be here with you. How about you?`
  }

  if (lower.match(/what can you (do|help)|what do you do|help me|what('s| are) your (feature|capabilit)/) || lower.match(/^help[\s!.]*$/)) {
    return `${greeting}I'm Ally, your financial companion! I can help you with:\n\n• 💳 Budget tracking & spending limits\n• 📊 Expense analysis & patterns\n• 🎯 Goals progress & planning\n• 💰 Savings tips & strategies\n• 📈 Investment portfolio review\n• 💡 Tax regime comparison & advice\n• 📁 Document overview\n• 💼 Pay parity insights\n\nI know your profile, expenses, savings, goals, investments, tax records, and uploaded documents — so ask me anything specific! 💜`
  }

  if (lower.match(/^(bye|goodbye|good night|gn|see you|see ya|ttyl|later|cya)[\s!.]*$/)) {
    return `Take care, ${name || 'lovely'}! 💜 See you soon. You're doing amazing!`
  }

  // --- FALLBACK ---
  return `${greeting}I'm here for you! 🌸 I know about your profile, expenses, savings, goals, investments, tax records, and documents — so feel free to ask me anything specific. Or we can simply chat!`
}

function ChatChart({ chart }) {
  if (!chart || !chart.data?.length) return null

  return (
    <div className="mt-3 p-3 rounded-xl bg-lavender-50/50 dark:bg-lavender-900/10 border border-lavender-100/50 dark:border-lavender-800/30">
      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-2">{chart.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        {chart.chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
          </PieChart>
        ) : chart.chartType === 'bar' ? (
          <BarChart data={chart.data}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="saved" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Saved" />
            <Bar dataKey="target" fill="#f9a8d4" radius={[4, 4, 0, 0]} name="Target" />
          </BarChart>
        ) : (
          <BarChart data={chart.data}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chart.data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default function ChatbotPage() {
  const userData = useUserData()
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim()) return

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const chartType = detectChartRequest(text)
    let chartData = null
    if (chartType) {
      chartData = buildChartData(chartType, userData)
    }

    try {
      const aiResponse = await getAllyChatResponse(text, {
        name: userData.profile?.name,
        salary: userData.profile?.salary,
        totalExpenses: userData.totalExpenses,
        totalSavings: userData.totalSavings,
        totalInvested: userData.totalInvested,
        totalCurrentValue: userData.totalCurrentValue,
        goalsCount: userData.goals?.length,
        investmentsCount: userData.investments?.length,
        documentsCount: userData.documents?.length,
      })

      const responseText = aiResponse || buildAllyResponse(text, userData)

      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: chartData ? (responseText + (chartData ? '' : '')) : responseText,
        chart: chartData,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: buildAllyResponse(text, userData),
        chart: chartData,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center shadow-soft">
          <MessageCircleHeart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            Ally <Sparkles className="w-4 h-4 text-lavender-400" />
          </h1>
          <p className="text-[11px] text-gray-400">Your AI financial companion • Always here for you</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-mint-50 border border-mint-100">
          <div className="w-2 h-2 bg-mint-400 rounded-full animate-pulse-soft" />
          <span className="text-[11px] text-mint-600 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2.5 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.from === 'bot' && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.from === 'user'
                  ? 'bg-gradient-to-r from-lavender-400 to-lavender-500 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-800/80 border border-lavender-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-md shadow-soft'
              }`}
            >
              {msg.text}
              {msg.chart && <ChatChart chart={msg.chart} />}
              <p className={`text-[10px] mt-1.5 ${msg.from === 'user' ? 'text-white/60' : 'text-gray-300'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800/80 border border-lavender-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-soft">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-lavender-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-lavender-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-lavender-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800/80 border border-lavender-100 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-lavender-300 hover:text-lavender-600 dark:hover:text-lavender-300 hover:shadow-soft transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to Ally about anything…"
            className="input-field pr-12"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gradient-to-r from-lavender-400 to-blush-400 flex items-center justify-center text-white shadow-soft hover:shadow-soft-md transition-all disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-gray-300 mt-2">
        Ally provides general guidance. For professional advice, consult a certified financial planner.
      </p>
    </div>
  )
}
