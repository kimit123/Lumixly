'use client'
import Link from 'next/link'
import { Check, Zap, Shield, Clock, Upload, Image, Download } from 'lucide-react'

const FEATURES = [
  { icon: Zap,    title: 'AI Background Removal',   desc: 'Perfect cutouts every time using BiRefNet AI' },
  { icon: Shield, title: 'Headless Crop',            desc: 'Smart face detection removes heads precisely at the lip line' },
  { icon: Clock,  title: 'Body-Aware Cropping',      desc: 'Full body, knees, upper half — AI detects the right cut' },
  { icon: Image,  title: '2 Output Sizes',           desc: '2500×2500 eBay + 2011×2564 portrait — ready to upload' },
]

const PLANS = [
  {
    name: 'Free Trial',
    price: 0,
    period: '',
    desc: 'Try before you buy',
    images: '10 free images',
    perImage: null,
    features: ['Background removal', 'Headless crop', '2 output sizes', 'No credit card required'],
    cta: 'Start Free',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Starter',
    price: 19,
    period: '/month',
    desc: 'For growing sellers',
    images: '100 images included',
    perImage: '£0.40 per extra image',
    features: ['Everything in Free', 'Body-aware crop', 'Bulk upload', 'Email support'],
    cta: 'Get Started',
    href: '/auth/signup?plan=starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 49,
    period: '/month',
    desc: 'For studios & agencies',
    images: '500 images included',
    perImage: '£0.25 per extra image',
    features: ['Everything in Starter', 'Priority processing', '1000 bulk upload', 'Priority support'],
    cta: 'Go Pro',
    href: '/auth/signup?plan=pro',
    highlight: true,
  },
]

const STEPS = [
  { n: '1', title: 'Upload',  desc: 'Drag & drop your product photos',     icon: Upload },
  { n: '2', title: 'Process', desc: 'AI removes background & crops smartly', icon: Zap    },
  { n: '3', title: 'Download', desc: 'Get eBay + portrait sizes instantly',  icon: Download },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-bold text-sky-600">Lumixly</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</Link>
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Login</Link>
            <Link href="/auth/signup" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-sky-100 text-sky-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            10 free images — no credit card needed
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Professional ecommerce photos
            <span className="text-sky-600"> in seconds</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            AI-powered background removal, headless crop, and body-aware cropping.
            Upload your photos — get eBay-ready results instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-sky-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-sky-700 transition shadow-lg shadow-sky-200">
              Start editing for free →
            </Link>
            <Link href="/pricing" className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-300 transition">
              View pricing
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">10 free images • No credit card required</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14">Three simple steps to perfect product photos</p>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7 text-sky-600" />
                </div>
                <div className="text-4xl font-black text-sky-100 mb-2">{s.n}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need</h2>
          <p className="text-center text-gray-500 mb-14">Built specifically for ecommerce product photography</p>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 flex gap-4">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple pricing</h2>
          <p className="text-center text-gray-500 mb-14">Start free, pay as you grow</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`rounded-2xl p-8 border ${plan.highlight ? 'border-sky-500 bg-sky-600 text-white shadow-xl shadow-sky-200' : 'border-gray-200 bg-white'}`}>
                {plan.highlight && (
                  <div className="text-xs font-bold bg-white text-sky-600 px-3 py-1 rounded-full inline-block mb-4">MOST POPULAR</div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlight ? 'text-sky-200' : 'text-gray-500'}`}>{plan.desc}</p>
                <div className="mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price === 0 ? 'Free' : `£${plan.price}`}
                  </span>
                  {plan.period && <span className={`text-sm ${plan.highlight ? 'text-sky-200' : 'text-gray-500'}`}>{plan.period}</span>}
                </div>
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-sky-100' : 'text-sky-600'}`}>{plan.images}</div>
                {plan.perImage && <div className={`text-xs mb-6 ${plan.highlight ? 'text-sky-200' : 'text-gray-400'}`}>{plan.perImage}</div>}
                {!plan.perImage && <div className="mb-6" />}
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-sky-200' : 'text-sky-500'}`} />
                      <span className={plan.highlight ? 'text-sky-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center py-3 rounded-xl font-bold transition ${
                  plan.highlight
                    ? 'bg-white text-sky-600 hover:bg-sky-50'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-sky-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to save hours every week?</h2>
          <p className="text-sky-200 mb-8">Join hundreds of ecommerce sellers using Lumixly</p>
          <Link href="/auth/signup" className="bg-white text-sky-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-sky-50 transition inline-block">
            Start editing for free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xl font-bold text-white">Lumixly</span>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/auth/login" className="hover:text-white transition">Login</Link>
            <Link href="/auth/signup" className="hover:text-white transition">Sign Up</Link>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Lumixly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
