// Indian Income Tax Engine — FY 2025-26 (AY 2026-27)
// Based on Union Budget 2025 slabs and existing Income Tax Act provisions.

const NEW_REGIME_SLABS = [
  { upto: 400000, rate: 0 },
  { upto: 800000, rate: 0.05 },
  { upto: 1200000, rate: 0.10 },
  { upto: 1600000, rate: 0.15 },
  { upto: 2000000, rate: 0.20 },
  { upto: 2400000, rate: 0.25 },
  { upto: Infinity, rate: 0.30 },
]

const OLD_REGIME_SLABS = [
  { upto: 250000, rate: 0 },
  { upto: 500000, rate: 0.05 },
  { upto: 1000000, rate: 0.20 },
  { upto: Infinity, rate: 0.30 },
]

const CESS_RATE = 0.04
const NEW_REGIME_STD_DEDUCTION = 75000
const OLD_REGIME_STD_DEDUCTION = 50000
const REBATE_87A_NEW_LIMIT = 1200000
const REBATE_87A_OLD_LIMIT = 500000
const MAX_80C = 150000

function applySlabs(taxableIncome, slabs) {
  let tax = 0
  let prev = 0
  const breakdown = []
  for (const slab of slabs) {
    if (taxableIncome <= prev) break
    const taxable = Math.min(taxableIncome, slab.upto) - prev
    const slabTax = taxable * slab.rate
    breakdown.push({
      from: prev,
      to: Math.min(taxableIncome, slab.upto),
      rate: slab.rate,
      taxable,
      tax: slabTax,
    })
    tax += slabTax
    prev = slab.upto
  }
  return { tax, breakdown }
}

export function computeTaxNewRegime(grossIncome, deductions = {}) {
  const stdDeduction = NEW_REGIME_STD_DEDUCTION
  const npsEmployer = Math.min(parseFloat(deductions.npsEmployer) || 0, grossIncome * 0.14)
  const nps80CCD1B = Math.min(parseFloat(deductions.nps80CCD1B) || 0, 50000)
  const totalExtraDeductions = npsEmployer + nps80CCD1B
  const taxableIncome = Math.max(grossIncome - stdDeduction - totalExtraDeductions, 0)
  const { tax: taxBeforeRebate, breakdown: slabBreakdown } = applySlabs(taxableIncome, NEW_REGIME_SLABS)

  const rebate87A = taxableIncome <= REBATE_87A_NEW_LIMIT ? taxBeforeRebate : 0
  const taxAfterRebate = taxBeforeRebate - rebate87A
  const cess = Math.round(taxAfterRebate * CESS_RATE)
  const totalTax = taxAfterRebate + cess
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0

  return {
    regime: 'new',
    grossIncome,
    stdDeduction,
    totalExtraDeductions,
    totalDeductions: stdDeduction + totalExtraDeductions,
    taxableIncome,
    slabBreakdown,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    cess,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  }
}

export function computeTaxOldRegime(grossIncome, deductions = {}) {
  const stdDeduction = OLD_REGIME_STD_DEDUCTION
  const sec80C = Math.min(parseFloat(deductions.deductions80C) || 0, MAX_80C)
  const sec80D = parseFloat(deductions.deductions80D) || 0
  const hra = parseFloat(deductions.hra) || 0
  const homeLoan = parseFloat(deductions.homeLoanInterest) || 0
  const other = parseFloat(deductions.otherDeductions) || 0

  const totalItemisedDeductions = sec80C + sec80D + hra + homeLoan + other
  const totalDeductions = stdDeduction + totalItemisedDeductions
  const taxableIncome = Math.max(grossIncome - totalDeductions, 0)
  const { tax: taxBeforeRebate, breakdown: slabBreakdown } = applySlabs(taxableIncome, OLD_REGIME_SLABS)

  const rebate87A = taxableIncome <= REBATE_87A_OLD_LIMIT ? taxBeforeRebate : 0
  const taxAfterRebate = taxBeforeRebate - rebate87A
  const cess = Math.round(taxAfterRebate * CESS_RATE)
  const totalTax = taxAfterRebate + cess
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0

  return {
    regime: 'old',
    grossIncome,
    stdDeduction,
    itemisedDeductions: { sec80C, sec80D, hra, homeLoan, other },
    totalItemisedDeductions,
    totalDeductions,
    taxableIncome,
    slabBreakdown,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    cess,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  }
}

export function compareRegimes(grossIncome, deductions = {}) {
  const oldResult = computeTaxOldRegime(grossIncome, deductions)
  const newResult = computeTaxNewRegime(grossIncome, deductions)
  const savings = Math.abs(oldResult.totalTax - newResult.totalTax)
  const recommended = oldResult.totalTax <= newResult.totalTax ? 'old' : 'new'

  return {
    old: oldResult,
    new: newResult,
    savings,
    recommended,
    summary:
      savings === 0
        ? 'Both regimes result in the same tax liability.'
        : recommended === 'old'
          ? `Old Regime saves you ₹${savings.toLocaleString('en-IN')}`
          : `New Regime saves you ₹${savings.toLocaleString('en-IN')}`,
  }
}

export function formatINR(n) {
  if (n == null || isNaN(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function formatINRShort(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}
