'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { GridCorner } from "@/components/ui/grid-corner";
import {
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Users,
  Bot,
  Sparkles,
  BarChart3,
  Shield
} from "lucide-react";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5]">
      {/* Navigation */}
      <nav className="relative border-b border-neutral-800">
        <GridCorner corner="top-left" />
        <GridCorner corner="top-right" />
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-neutral-800 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-serif text-xl">CreatorPulse</span>
          </div>

          <div className="flex items-center gap-6">
            {session ? (
              <Link href="/dashboard">
                <button className="flex items-center gap-2 bg-[#e5e5e5] text-[#0f0f0f] px-4 py-2 hover:bg-white transition-colors text-sm font-medium">
                  Go to Dashboard
                  <ArrowRight size={14} />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-2 bg-[#e5e5e5] text-[#0f0f0f] px-4 py-2 hover:bg-white transition-colors text-sm font-medium">
                  Sign In
                  <ArrowRight size={14} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
                YouTube Analytics Platform
              </p>
              <h1 className="font-serif text-5xl lg:text-6xl leading-tight mb-6">
                Understand Your <br />
                <span className="text-neutral-400">Audience</span> Better
              </h1>
              <p className="text-neutral-400 text-lg max-w-md mb-8">
                AI-powered sentiment analysis and insights from your YouTube comments.
                Know what your viewers think, want, and feel.
              </p>
              <div className="flex items-center gap-4">
                <Link href={session ? "/dashboard" : "/login"}>
                  <button className="flex items-center gap-2 bg-[#e5e5e5] text-[#0f0f0f] px-6 py-3 hover:bg-white transition-colors font-medium">
                    Get Started Free
                    <ArrowRight size={16} />
                  </button>
                </Link>
                <span className="text-[10px] uppercase tracking-widest text-neutral-600">
                  No credit card required
                </span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative border border-neutral-800 p-8">
              <GridCorner corner="top-left" />
              <GridCorner corner="top-right" />
              <GridCorner corner="bottom-left" />
              <GridCorner corner="bottom-right" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-600">Sentiment Overview</span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-600">Live Demo</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-neutral-800 p-4 text-center">
                    <p className="font-serif text-2xl text-[#e5e5e5]">78%</p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-1">Positive</p>
                  </div>
                  <div className="border border-neutral-800 p-4 text-center">
                    <p className="font-serif text-2xl text-neutral-400">15%</p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-1">Neutral</p>
                  </div>
                  <div className="border border-neutral-800 p-4 text-center">
                    <p className="font-serif text-2xl text-neutral-500">7%</p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-1">Negative</p>
                  </div>
                </div>

                <div className="h-32 flex items-end gap-1">
                  {[40, 55, 45, 70, 85, 60, 75, 90, 65, 80, 70, 85].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-neutral-700 transition-all hover:bg-neutral-500"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="flex justify-between text-[10px] uppercase tracking-widest text-neutral-600">
                  <span>Jan</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
              Powerful Features
            </p>
            <h2 className="font-serif text-4xl">Everything You Need</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-neutral-800">
            {[
              {
                icon: MessageSquare,
                title: "Comment Analysis",
                description: "Automatically analyze thousands of comments with AI-powered sentiment detection."
              },
              {
                icon: TrendingUp,
                title: "Trend Insights",
                description: "Track sentiment trends over time and identify what content resonates."
              },
              {
                icon: Users,
                title: "Community Insights",
                description: "Discover your most engaged fans, repeat commenters, and community patterns."
              },
              {
                icon: Bot,
                title: "AI Chat",
                description: "Ask questions about your comments in natural language and get instant insights."
              },
              {
                icon: BarChart3,
                title: "Rich Analytics",
                description: "Detailed breakdowns by video, tag, sentiment, and time period."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is encrypted and never shared. GDPR compliant."
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`relative p-8 hover:bg-white/[0.02] transition-colors
                  ${index < 3 ? 'lg:border-b border-neutral-800' : ''}
                  ${index % 3 !== 2 ? 'lg:border-r border-neutral-800' : ''}
                  ${index % 2 !== 1 ? 'md:border-r lg:border-r-0 border-neutral-800' : 'md:border-r-0'}
                  ${index < 4 ? 'md:border-b lg:border-b-0 border-neutral-800' : 'md:border-b-0'}
                `}
              >
                {index === 0 && <GridCorner corner="top-left" />}
                {index === 2 && <GridCorner corner="top-right" />}
                {index === 3 && <GridCorner corner="bottom-left" />}
                {index === 5 && <GridCorner corner="bottom-right" />}

                <div className="h-10 w-10 border border-neutral-800 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-neutral-500" />
                </div>
                <h3 className="font-serif text-xl mb-2">{feature.title}</h3>
                <p className="text-neutral-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="relative border border-neutral-800 p-12 text-center">
            <GridCorner corner="top-left" />
            <GridCorner corner="top-right" />
            <GridCorner corner="bottom-left" />
            <GridCorner corner="bottom-right" />

            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
              Ready to start?
            </p>
            <h2 className="font-serif text-4xl mb-4">Start Analyzing Today</h2>
            <p className="text-neutral-400 max-w-md mx-auto mb-8">
              Connect your YouTube channel and get insights in minutes. No complex setup required.
            </p>
            <Link href={session ? "/dashboard" : "/login"}>
              <button className="inline-flex items-center gap-2 bg-[#e5e5e5] text-[#0f0f0f] px-8 py-4 hover:bg-white transition-colors font-medium">
                Get Started Free
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative">
        <GridCorner corner="bottom-left" />
        <GridCorner corner="bottom-right" />
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 border border-neutral-800 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-serif text-xl">CreatorPulse</span>
            </div>

            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
              © 2025 CreatorPulse / All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
