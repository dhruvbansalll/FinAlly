const API_KEY = import.meta.env.VITE_GNEWS_API_KEY || ''
const BASE_URL = 'https://gnews.io/api/v4'

const FALLBACK_NEWS = [
  {
    title: 'Women investors in India outperform men in long-term returns',
    description: 'A new study shows that women investors in India tend to hold investments longer and achieve better risk-adjusted returns compared to their male counterparts.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
    source: { name: 'Economic Times' },
    url: 'https://economictimes.com',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'SIP investments hit record high as more women join the market',
    description: 'Systematic Investment Plans see unprecedented growth with a 40% increase in women investors opening new SIP accounts across India.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    source: { name: 'Mint' },
    url: 'https://livemint.com',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Government launches new financial literacy program for women',
    description: 'The initiative aims to empower 10 million women with financial knowledge and investment skills over the next two years.',
    image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400',
    source: { name: 'Business Standard' },
    url: 'https://business-standard.com',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Mutual fund industry sees surge in women investors',
    description: 'The mutual fund industry in India has witnessed a significant increase in women investors, with assets under management growing by 35% year-on-year.',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    source: { name: 'Moneycontrol' },
    url: 'https://moneycontrol.com',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Top 5 investment strategies for women in 2026',
    description: 'Financial experts share their top recommendations for women looking to grow their wealth through smart investing in the current market.',
    image: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=400',
    source: { name: 'Forbes India' },
    url: 'https://forbesindia.com',
    publishedAt: new Date().toISOString(),
  },
]

function getCacheKey(query) {
  return `gnews_${query}`
}

function getFromCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts < 3600000) return data
  } catch { /* ignore */ }
  return null
}

function setToCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

export async function fetchFinanceNews(q = 'women finance investing India') {
  const key = getCacheKey(q)
  const cached = getFromCache(key)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      q,
      lang: 'en',
      country: 'in',
      max: '6',
      apikey: API_KEY,
    })

    const res = await fetch(`${BASE_URL}/search?${params}`)
    const data = await res.json()

    if (!data.articles || data.articles.length === 0) {
      return FALLBACK_NEWS
    }

    const articles = data.articles.map(a => ({
      title: a.title,
      description: a.description,
      image: a.image,
      source: a.source,
      url: a.url,
      publishedAt: a.publishedAt,
    }))

    setToCache(key, articles)
    return articles
  } catch (err) {
    console.error('GNews fetch error:', err)
    return FALLBACK_NEWS
  }
}
