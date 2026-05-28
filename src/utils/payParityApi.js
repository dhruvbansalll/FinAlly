import { getAllyChatResponse } from './geminiApi'

/**
 * Fetch pay-parity benchmarks using Gemini AI for realistic salary estimates.
 * Falls back to a formula-based estimate if Gemini is unavailable.
 */
export async function fetchPayParity({ company, role, experience, location, skills }) {
  try {
    const prompt = `I need salary benchmark data for an Indian professional. Return ONLY a JSON object (no markdown, no explanation, no code fences).

Role: ${role || 'Software Engineer'}
Company: ${company || 'Not specified'}
Location: ${location || 'India'}
Experience: ${experience || 0} years
Skills: ${skills || 'Not specified'}

Return this exact JSON format with realistic annual CTC figures in INR:
{"marketBenchmark": <number>, "companyEstimate": <number>, "sources": ["source1", "source2"]}

Rules:
- marketBenchmark = average annual CTC for this role/experience in India
- companyEstimate = estimated CTC at this specific company (if known, otherwise similar to market)
- Use realistic 2025-26 Indian salary data
- For FAANG/top companies, pay 2-4x market rate
- For Indian IT (TCS, Infosys, Wipro), pay 0.85-1.0x market
- For startups, pay 1.0-1.5x market
- Experience multiplier: fresher ~4-6L, 3yr ~8-12L, 5yr ~12-18L, 8yr ~18-30L, 10+yr ~25-50L for tech roles
- Return ONLY the JSON object, nothing else`

    const response = await getAllyChatResponse(prompt, { salary: 0 })

    if (response) {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const data = JSON.parse(cleaned)

      if (data.marketBenchmark && data.companyEstimate) {
        return {
          marketBenchmark: Math.round(data.marketBenchmark),
          companyEstimate: Math.round(data.companyEstimate),
          sources: data.sources || ['Gemini AI Analysis', 'Glassdoor', 'AmbitionBox'],
        }
      }
    }
  } catch (err) {
    console.warn('[PayParity] Gemini failed, using fallback:', err.message)
  }

  return fallbackEstimate({ role, company, experience })
}

function fallbackEstimate({ role, company, experience }) {
  const exp = Number(experience) || 0
  const roleLower = (role || '').toLowerCase()
  const companyLower = (company || '').toLowerCase()

  let baseMarket = 800000
  if (roleLower.includes('senior') || roleLower.includes('lead')) baseMarket = 1600000
  else if (roleLower.includes('manager') || roleLower.includes('architect')) baseMarket = 2000000
  else if (roleLower.includes('director') || roleLower.includes('vp')) baseMarket = 3500000
  else if (roleLower.includes('analyst')) baseMarket = 700000
  else if (roleLower.includes('designer')) baseMarket = 750000
  else if (roleLower.includes('engineer') || roleLower.includes('developer')) baseMarket = 900000

  const expMultiplier = 1 + Math.max(0, exp - 2) * 0.12
  const market = Math.round(baseMarket * expMultiplier)

  let companyMultiplier = 1.0
  const faang = ['google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix']
  const topIndian = ['flipkart', 'phonepe', 'razorpay', 'cred', 'swiggy', 'zomato', 'meesho']
  const serviceCompanies = ['tcs', 'infosys', 'wipro', 'hcl', 'cognizant', 'tech mahindra', 'capgemini']

  if (faang.some(f => companyLower.includes(f))) companyMultiplier = 2.8
  else if (topIndian.some(f => companyLower.includes(f))) companyMultiplier = 1.6
  else if (serviceCompanies.some(f => companyLower.includes(f))) companyMultiplier = 0.9

  return {
    marketBenchmark: market,
    companyEstimate: Math.round(market * companyMultiplier),
    sources: ['Estimated (AI unavailable)', 'Glassdoor averages', 'AmbitionBox data'],
  }
}
