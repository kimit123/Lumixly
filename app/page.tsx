'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = ['Features', 'Pricing', 'FAQ']

const FEATURES = [
  {
    badge: 'HEADLESS CROP',
    title: 'Remove faces automatically',
    desc: 'MediaPipe AI finds the exact nose-to-lip position and cuts with surgical precision. Works on front, side, and back photos — no manual adjustment needed.',
    img: '👗',
    color: '#f0f7ff',
  },
  {
    badge: 'BACKGROUND REMOVAL',
    title: 'Studio-clean cutouts every time',
    desc: 'BiRefNet AI handles hair, lace, transparent fabric, and complex edges that other tools miss. Every photo looks like it was shot on white.',
    img: '✂️',
    color: '#f7f0ff',
  },
  {
    badge: 'BODY-AWARE CROP',
    title: 'Smart body cropping',
    desc: 'Full body, head to knees, upper half, or waist down — AI detects body anatomy and makes the right cut for every garment type.',
    img: '🎯',
    color: '#f0fff4',
  },
  {
    badge: '2 OUTPUT SIZES',
    title: 'eBay + portrait, automatically',
    desc: '2500×2500 square for eBay and 2011×2564 portrait for other marketplaces. Both sizes delivered for every single image you upload.',
    img: '📐',
    color: '#fff7f0',
  },
]

const PLANS = [
  {
    name: 'Free Trial',
    price: 0,
    desc: '10 free image edits. No credit card.',
    images: '10 images',
    per: null,
    features: ['Background removal', 'All crop types', 'Both output sizes'],
    cta: 'Start for free',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Starter',
    price: 19,
    desc: 'For growing ecommerce sellers.',
    images: '100 images/month',
    per: '£0.40 per extra image',
    features: ['Everything in Free', 'Bulk upload up to 500', 'Email support', 'Next-day delivery'],
    cta: 'Get Starter',
    href: '/auth/signup?plan=starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 49,
    desc: 'For studios and agencies.',
    images: '500 images/month',
    per: '£0.25 per extra image',
    features: ['Everything in Starter', 'Bulk upload 1,000 images', 'Priority processing', 'Priority support'],
    cta: 'Get Pro',
    href: '/auth/signup?plan=pro',
    highlight: true,
  },
]

const FAQS = [
  { q: 'How long does processing take?', a: 'Most images are processed in 30–60 seconds each. A batch of 100 images typically takes 1–2 hours depending on complexity.' },
  { q: 'What image formats are supported?', a: 'We support JPG, PNG, WEBP, and BMP. We recommend JPG for fastest processing.' },
  { q: 'Can I process product photos (bags, shoes)?', a: 'Yes! Use Product mode for non-model photos. It removes the background and centres the product with clean margins.' },
  { q: 'Do unused images roll over?', a: 'Monthly images do not roll over. Extra images beyond your plan are billed at your plan rate.' },
  { q: 'Can I cancel any time?', a: 'Yes, cancel any time from your billing page. You keep access until the end of your billing period.' },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); transition: box-shadow 0.2s; }
        .nav.sh { box-shadow: 0 1px 0 #e5e7eb; }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 20px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
        .logo span { color: #2563eb; }
        .nav-links { display: flex; align-items: center; gap: 36px; }
        .nl { font-size: 14px; font-weight: 500; color: #6b7280; transition: color 0.15s; }
        .nl:hover { color: #111; }
        .nav-actions { display: flex; align-items: center; gap: 12px; }
        .btn-outline { font-size: 14px; font-weight: 500; color: #374151; padding: 8px 18px; border: 1.5px solid #d1d5db; border-radius: 8px; transition: all 0.15s; }
        .btn-outline:hover { border-color: #9ca3af; color: #111; }
        .btn-fill { font-size: 14px; font-weight: 600; color: #fff; background: #2563eb; padding: 8px 18px; border-radius: 8px; transition: all 0.15s; }
        .btn-fill:hover { background: #1d4ed8; }

        .hero { padding: 140px 32px 100px; text-align: center; background: linear-gradient(180deg, #f8faff 0%, #fff 100%); border-bottom: 1px solid #f3f4f6; }
        .hero-inner { max-width: 820px; margin: 0 auto; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; padding: 5px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; margin-bottom: 28px; letter-spacing: 0.3px; }
        .hero-title { font-size: clamp(40px, 6vw, 72px); font-weight: 800; line-height: 1.08; letter-spacing: -2px; color: #111; margin-bottom: 20px; }
        .hero-title span { color: #2563eb; }
        .hero-sub { font-size: 18px; color: #6b7280; line-height: 1.65; max-width: 560px; margin: 0 auto 40px; font-weight: 400; }
        .hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .btn-hero { font-size: 16px; font-weight: 700; color: #fff; background: #2563eb; padding: 14px 32px; border-radius: 10px; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .btn-hero:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(37,99,235,0.35); }
        .btn-hero-outline { font-size: 16px; font-weight: 600; color: #374151; padding: 14px 32px; border-radius: 10px; border: 1.5px solid #d1d5db; transition: all 0.15s; }
        .btn-hero-outline:hover { border-color: #9ca3af; }
        .hero-note { font-size: 13px; color: #9ca3af; margin-top: 16px; }

        .logos-bar { padding: 32px; border-bottom: 1px solid #f3f4f6; text-align: center; }
        .logos-bar p { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; font-weight: 600; margin-bottom: 20px; }
        .logos-row { display: flex; justify-content: center; gap: 48px; align-items: center; flex-wrap: wrap; }
        .logo-item { font-size: 18px; font-weight: 800; color: #d1d5db; letter-spacing: -0.5px; }

        .features-section { padding: 100px 32px; max-width: 1200px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-tag { font-size: 13px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .section-title { font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -1px; color: #111; margin-bottom: 12px; line-height: 1.15; }
        .section-sub { font-size: 16px; color: #6b7280; max-width: 460px; margin: 0 auto; line-height: 1.6; }
        .features-list { display: flex; flex-direction: column; gap: 24px; }
        .feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; background: #f9fafb; border-radius: 20px; overflow: hidden; border: 1px solid #f3f4f6; }
        .feature-row.rev { direction: rtl; }
        .feature-row.rev > * { direction: ltr; }
        .feature-content { padding: 48px; }
        .feature-badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #2563eb; background: #eff6ff; padding: 4px 12px; border-radius: 100px; margin-bottom: 16px; }
        .feature-title { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 12px; letter-spacing: -0.3px; line-height: 1.3; }
        .feature-desc { font-size: 15px; color: #6b7280; line-height: 1.7; }
        .feature-visual { display: flex; align-items: center; justify-content: center; min-height: 260px; font-size: 80px; }

        .how-section { padding: 100px 32px; background: #f9fafb; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; }
        .how-inner { max-width: 1000px; margin: 0 auto; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; margin-top: 56px; }
        .step { text-align: center; }
        .step-circle { width: 56px; height: 56px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #fff; margin: 0 auto 20px; }
        .step-title { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 8px; }
        .step-desc { font-size: 14px; color: #6b7280; line-height: 1.6; }

        .pricing-section { padding: 100px 32px; max-width: 1100px; margin: 0 auto; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 56px; }
        .plan-card { border: 1.5px solid #e5e7eb; border-radius: 20px; padding: 36px; background: #fff; position: relative; transition: box-shadow 0.2s; }
        .plan-card:hover { box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
        .plan-card.popular { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }
        .popular-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: #2563eb; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 16px; border-radius: 100px; white-space: nowrap; letter-spacing: 0.3px; }
        .plan-name { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .plan-price { font-size: 44px; font-weight: 800; color: #111; letter-spacing: -1.5px; line-height: 1; }
        .plan-price span { font-size: 16px; font-weight: 500; color: #9ca3af; letter-spacing: 0; }
        .plan-desc { font-size: 14px; color: #9ca3af; margin: 8px 0 20px; }
        .plan-divider { height: 1px; background: #f3f4f6; margin: 20px 0; }
        .plan-images { font-size: 15px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
        .plan-per { font-size: 13px; color: #9ca3af; margin-bottom: 20px; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .plan-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151; }
        .check { width: 18px; height: 18px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #16a34a; font-weight: 700; }
        .plan-cta-btn { display: block; text-align: center; padding: 13px; border-radius: 10px; font-size: 15px; font-weight: 700; transition: all 0.15s; }
        .cta-blue { background: #2563eb; color: #fff; }
        .cta-blue:hover { background: #1d4ed8; }
        .cta-border { border: 1.5px solid #d1d5db; color: #374151; }
        .cta-border:hover { border-color: #9ca3af; }

        .faq-section { padding: 100px 32px; max-width: 760px; margin: 0 auto; }
        .faq-list { margin-top: 48px; display: flex; flex-direction: column; gap: 2px; }
        .faq-item { border: 1px solid #f3f4f6; border-radius: 12px; overflow: hidden; }
        .faq-q { width: 100%; text-align: left; padding: 20px 24px; background: #fff; font-size: 15px; font-weight: 600; color: #111; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border: none; transition: background 0.15s; }
        .faq-q:hover { background: #f9fafb; }
        .faq-a { padding: 0 24px 20px; font-size: 14px; color: #6b7280; line-height: 1.7; }
        .chevron { font-size: 12px; color: #9ca3af; transition: transform 0.2s; }
        .chevron.open { transform: rotate(180deg); }

        .cta-banner { background: #2563eb; padding: 80px 32px; text-align: center; }
        .cta-banner h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 12px; }
        .cta-banner p { font-size: 16px; color: rgba(255,255,255,0.75); margin-bottom: 32px; }
        .btn-white { font-size: 16px; font-weight: 700; color: #2563eb; background: #fff; padding: 14px 36px; border-radius: 10px; transition: all 0.2s; display: inline-block; }
        .btn-white:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }

        .footer { background: #111; padding: 48px 32px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .footer-logo { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .footer-logo span { color: #60a5fa; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: #9ca3af; transition: color 0.15s; }
        .footer-link:hover { color: #fff; }
        .footer-copy { font-size: 12px; color: #6b7280; }

        @media(max-width:768px){
          .nav-links { display: none; }
          .feature-row, .feature-row.rev { grid-template-columns: 1fr; direction: ltr; }
          .steps-grid, .plans-grid { grid-template-columns: 1fr; }
          .footer-inner { flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' sh' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="logo">Lumixly</a>
          <div className="nav-links">
            {NAV_LINKS.map(l => <a key={l} href={`#${l.toLowerCase()}`} className="nl">{l}</a>)}
          </div>
          <div className="nav-actions">
            <a href="/auth/login" className="btn-outline">Sign in</a>
            <a href="/auth/signup" className="btn-fill">Start free →</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">✨ 10 free images — no credit card required</div>
          <h1 className="hero-title">
            Professional product photos,<br />
            <span>edited in seconds</span>
          </h1>
          <p className="hero-sub">
            AI removes backgrounds, crops models, and delivers marketplace-ready images automatically. Upload 1,000 photos — get perfect results every time.
          </p>
          <div className="hero-cta">
            <a href="/auth/signup" className="btn-hero">Start editing for free →</a>
            <a href="#features" className="btn-hero-outline">See how it works</a>
          </div>
          <p className="hero-note">No credit card • 10 free images • Cancel any time</p>
        </div>
      </section>

      {/* LOGOS */}
      <div className="logos-bar">
        <p>Trusted by ecommerce sellers worldwide</p>
        <div className="logos-row">
          {['eBay', 'Shopify', 'Amazon', 'Etsy', 'ASOS'].map(l => (
            <div key={l} className="logo-item">{l}</div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-tag">Features</div>
          <h2 className="section-title">Everything your studio needs</h2>
          <p className="section-sub">Built specifically for ecommerce fashion photography. Every feature designed to save you hours.</p>
        </div>
        <div className="features-list">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-row${i % 2 === 1 ? ' rev' : ''}`} style={{ background: f.color }}>
              <div className="feature-content">
                <div className="feature-badge">{f.badge}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
              <div className="feature-visual">{f.img}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-header">
            <div className="section-tag">How it works</div>
            <h2 className="section-title">Three steps to perfect photos</h2>
            <p className="section-sub">From raw studio shots to marketplace-ready images in minutes.</p>
          </div>
          <div className="steps-grid">
            {[
              { n: '1', t: 'Upload your photos', d: 'Drag & drop up to 1,000 photos at once. We accept JPG, PNG, and WEBP.' },
              { n: '2', t: 'Choose your settings', d: 'Select headless crop, body crop, or product mode. Set your preferences once.' },
              { n: '3', t: 'Download results', d: 'Get both eBay (2500×2500) and portrait (2011×2564) sizes automatically.' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-circle">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <div className="section-tag">Pricing</div>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-sub">Start free. Scale as you grow. No hidden fees.</p>
        </div>
        <div className="plans-grid">
          {PLANS.map(p => (
            <div key={p.name} className={`plan-card${p.highlight ? ' popular' : ''}`}>
              {p.highlight && <div className="popular-badge">Most Popular</div>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                {p.price === 0 ? 'Free' : `£${p.price}`}
                {p.price > 0 && <span>/mo</span>}
              </div>
              <div className="plan-desc">{p.desc}</div>
              <div className="plan-divider" />
              <div className="plan-images">{p.images}</div>
              <div className="plan-per">{p.per || 'No card required'}</div>
              <ul className="plan-features">
                {p.features.map(f => (
                  <li key={f} className="plan-feature">
                    <div className="check">✓</div>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={p.href} className={`plan-cta-btn ${p.highlight ? 'cta-blue' : 'cta-border'}`}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" id="faq">
        <div className="section-header">
          <div className="section-tag">FAQ</div>
          <h2 className="section-title">Common questions</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className="faq-item">
              <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <span className={`chevron${openFaq === i ? ' open' : ''}`}>▼</span>
              </button>
              {openFaq === i && <div className="faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner">
        <h2>Start editing for free today</h2>
        <p>10 free images. No credit card. Ready in seconds.</p>
        <a href="/auth/signup" className="btn-white">Get started free →</a>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Lumixly</div>
          <div className="footer-links">
            <a href="#features" className="footer-link">Features</a>
            <a href="#pricing" className="footer-link">Pricing</a>
            <a href="/auth/login" className="footer-link">Login</a>
            <a href="/auth/signup" className="footer-link">Sign up</a>
          </div>
          <div className="footer-copy">© 2026 Lumixly. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
