const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || ''
const BASE_URL = 'https://www.alphavantage.co/query'

function getCacheKey(fn, param) {
  return `av_${fn}_${param || 'default'}`
}

function getFromCache(key, maxAgeMs = 3600000) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts < maxAgeMs) return data
  } catch { /* ignore */ }
  return null
}

function setToCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

const FALLBACK_MARKET = {
  topGainers: [
    { ticker: 'TATAMOTORS.BSE', price: '742.50', change: '+5.23%', volume: '12,345,678' },
    { ticker: 'INFY.BSE', price: '1,523.80', change: '+3.15%', volume: '8,234,567' },
    { ticker: 'HDFCBANK.BSE', price: '1,687.30', change: '+2.41%', volume: '6,789,012' },
  ],
  topLosers: [
    { ticker: 'RELIANCE.BSE', price: '2,456.70', change: '-2.18%', volume: '9,876,543' },
    { ticker: 'WIPRO.BSE', price: '412.30', change: '-1.95%', volume: '5,432,109' },
    { ticker: 'SBIN.BSE', price: '598.40', change: '-1.67%', volume: '7,654,321' },
  ],
  mostActive: [
    { ticker: 'TCS.BSE', price: '3,456.90', change: '+0.82%', volume: '15,678,901' },
    { ticker: 'ICICIBANK.BSE', price: '987.60', change: '+1.12%', volume: '11,234,567' },
  ],
}

const FALLBACK_INDICES = {
  nifty: { value: '22,456.80', change: '+0.85%', direction: 'up' },
  sensex: { value: '73,891.45', change: '+0.72%', direction: 'up' },
}

const FALLBACK_SECTORS = [
  { sector: 'Information Technology', changePercent: '+2.34%' },
  { sector: 'Financial Services', changePercent: '+1.52%' },
  { sector: 'Healthcare', changePercent: '+0.98%' },
  { sector: 'Consumer Goods', changePercent: '+0.45%' },
  { sector: 'Energy', changePercent: '-0.67%' },
  { sector: 'Automobile', changePercent: '-1.23%' },
]

export async function getMarketOverview() {
  const key = getCacheKey('market_overview')
  const cached = getFromCache(key)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`)
    const data = await res.json()

    if (data.Information || data.Note || !data.top_gainers) {
      return FALLBACK_MARKET
    }

    const result = {
      topGainers: (data.top_gainers || []).slice(0, 3).map(s => ({
        ticker: s.ticker,
        price: s.price,
        change: s.change_percentage,
        volume: Number(s.volume).toLocaleString(),
      })),
      topLosers: (data.top_losers || []).slice(0, 3).map(s => ({
        ticker: s.ticker,
        price: s.price,
        change: s.change_percentage,
        volume: Number(s.volume).toLocaleString(),
      })),
      mostActive: (data.most_actively_traded || []).slice(0, 2).map(s => ({
        ticker: s.ticker,
        price: s.price,
        change: s.change_percentage,
        volume: Number(s.volume).toLocaleString(),
      })),
    }

    setToCache(key, result)
    return result
  } catch (err) {
    console.error('Alpha Vantage market overview error:', err)
    return FALLBACK_MARKET
  }
}

export async function getStockQuote(symbol) {
  const key = getCacheKey('quote', symbol)
  const cached = getFromCache(key)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`)
    const data = await res.json()

    if (data.Information || data.Note || !data['Global Quote']) {
      return null
    }

    const q = data['Global Quote']
    const result = {
      symbol: q['01. symbol'],
      price: q['05. price'],
      change: q['09. change'],
      changePercent: q['10. change percent'],
      volume: Number(q['06. volume']).toLocaleString(),
    }

    setToCache(key, result)
    return result
  } catch (err) {
    console.error('Alpha Vantage quote error:', err)
    return null
  }
}

export async function getSectorPerformance() {
  const key = getCacheKey('sectors')
  const cached = getFromCache(key)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}?function=SECTOR&apikey=${API_KEY}`)
    const data = await res.json()

    if (data.Information || data.Note || !data['Rank A: Real-Time Performance']) {
      return FALLBACK_SECTORS
    }

    const realtime = data['Rank A: Real-Time Performance']
    const result = Object.entries(realtime).map(([sector, pct]) => ({
      sector: sector.replace('Information Technology', 'IT'),
      changePercent: pct,
    }))

    setToCache(key, result)
    return result
  } catch (err) {
    console.error('Alpha Vantage sector error:', err)
    return FALLBACK_SECTORS
  }
}

export function getMarketIndices() {
  const key = getCacheKey('indices')
  const cached = getFromCache(key, 1800000)
  if (cached) return Promise.resolve(cached)

  return Promise.resolve(FALLBACK_INDICES)
}
