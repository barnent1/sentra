"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  Eye,
  Clock,
  DollarSign,
  Users,
  Terminal,
  Brain,
  GitBranch,
  Play,
  Pause,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const [activePain, setActivePain] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Rotate through pain points
    const interval = setInterval(() => {
      setActivePain((prev) => (prev + 1) % painPoints.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const painPoints = [
    {
      icon: Terminal,
      pain: "Babysitting AI in terminals",
      solution: "Visual dashboard with real-time progress",
    },
    {
      icon: Eye,
      pain: "No idea what AI is doing",
      solution: "See every file change as it happens",
    },
    {
      icon: DollarSign,
      pain: "Surprise API bills",
      solution: "Budget caps and cost tracking per project",
    },
    {
      icon: Clock,
      pain: "Context switching kills flow",
      solution: "All projects in one mission control",
    },
    {
      icon: Shield,
      pain: "AI making unseen mistakes",
      solution: "Approve specs before execution",
    },
    {
      icon: Users,
      pain: "Can't share with team",
      solution: "Collaborative web dashboard",
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "Voice-First Interface",
      description:
        "Just speak. Describe features naturally and let AI architect them. No more writing specs.",
    },
    {
      icon: Eye,
      title: "Real-Time Visibility",
      description:
        "Watch AI agents work in real-time. See file changes, test results, and PR creation as it happens.",
    },
    {
      icon: Shield,
      title: "Spec Approval Flow",
      description:
        "AI creates detailed specs. You review and approve before a single line of code is written.",
    },
    {
      icon: GitBranch,
      title: "GitHub Integration",
      description:
        "Issues become PRs automatically. Quality gates ensure only good code gets merged.",
    },
    {
      icon: DollarSign,
      title: "Cost Control",
      description:
        "Set monthly budgets per project. Never get surprised by API costs again.",
    },
    {
      icon: Zap,
      title: "Parallel Execution",
      description:
        "Run multiple AI agents across projects simultaneously. Scale your development capacity.",
    },
  ];

  const stats = [
    { value: "10x", label: "Faster prototyping" },
    { value: "90%", label: "Less context switching" },
    { value: "$0", label: "Until you ship" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/quetrex-logo.png"
              alt="Quetrex"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold">Quetrex</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-400 hover:text-white transition text-sm">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition text-sm">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition text-sm">
              Pricing
            </a>
            <Link
              href="/login"
              className="text-gray-400 hover:text-white transition text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium transition text-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-3xl opacity-30" />

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Pain point rotator */}
          <div
            className={`mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Stop {painPoints[activePain].pain.toLowerCase()}
            </span>
          </div>

          <h1
            className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Your AI Agents.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600 bg-clip-text text-transparent">
              Under Control.
            </span>
          </h1>

          <p
            className={`text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Mission control for AI-powered development. Voice interface, real-time visibility,
            and approval workflows that let you ship faster without losing control.
          </p>

          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link
              href="/signup"
              className="group px-8 py-4 bg-violet-500 hover:bg-violet-600 rounded-lg font-semibold text-lg transition flex items-center gap-2"
            >
              Start Building Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] rounded-lg font-semibold text-lg transition flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              See It Work
            </a>
          </div>

          {/* Stats */}
          <div
            className={`flex justify-center gap-12 transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-violet-400">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-500" />
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-6 bg-[#0F0F10]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sound familiar?
            </h2>
            <p className="text-gray-400 text-lg">
              Every developer using AI tools hits these walls.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {painPoints.map((point, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border transition-all duration-300 ${
                  index === activePain
                    ? "bg-violet-500/10 border-violet-500/30"
                    : "bg-[#18181B] border-[#27272A] hover:border-[#3F3F46]"
                }`}
              >
                <point.icon
                  className={`w-8 h-8 mb-4 ${
                    index === activePain ? "text-violet-400" : "text-gray-500"
                  }`}
                />
                <p className="text-red-400 text-sm font-medium mb-2">THE PROBLEM</p>
                <p className="text-white font-semibold mb-4">{point.pain}</p>
                <p className="text-green-400 text-sm font-medium mb-2">QUETREX FIX</p>
                <p className="text-gray-300">{point.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From idea to deployed in 3 steps
            </h2>
            <p className="text-gray-400 text-lg">
              No terminal babysitting. No context switching. Just results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Speak your feature",
                description:
                  "Open voice chat, describe what you want in plain language. AI architect asks clarifying questions and creates a detailed spec.",
                highlight: "30 seconds to spec",
              },
              {
                step: "2",
                title: "Review & approve",
                description:
                  "Read the generated spec. Make edits if needed. One click to approve and create a GitHub issue automatically.",
                highlight: "You stay in control",
              },
              {
                step: "3",
                title: "AI builds it",
                description:
                  "Quetrex agents write tests, implement code, and create PRs. Watch progress in real-time or get notified when done.",
                highlight: "Quality gates enforced",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div className="pt-8 pl-8">
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-400 mb-4">{item.description}</p>
                  <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full">
                    {item.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-[#0F0F10]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to ship faster
            </h2>
            <p className="text-gray-400 text-lg">
              Built by developers who were tired of the same problems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-[#18181B] border border-[#27272A] rounded-xl hover:border-violet-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Social Proof Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Built for developers who value their time
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                quote:
                  "Finally, I can see what the AI is doing instead of hoping it doesn't break everything.",
                author: "Sarah K.",
                role: "Senior Developer",
              },
              {
                quote:
                  "The spec approval flow saved us from so many bad implementations. Game changer.",
                author: "Mike R.",
                role: "Tech Lead",
              },
              {
                quote:
                  "I manage 4 projects now with less stress than I used to have with 1.",
                author: "Alex T.",
                role: "Indie Hacker",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-[#18181B] border border-[#27272A] rounded-xl text-left"
              >
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Free tier forever
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Setup in 2 minutes
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-[#0F0F10]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Free until you're hooked
            </h2>
            <p className="text-gray-400 text-lg">
              Start building. Pay only when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "For indie hackers and side projects",
                features: [
                  "1 project",
                  "100 agent minutes/month",
                  "Basic voice interface",
                  "GitHub integration",
                  "Community support",
                ],
                cta: "Get Started",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$49",
                period: "/month",
                description: "For professional developers",
                features: [
                  "Unlimited projects",
                  "1,000 agent minutes/month",
                  "Advanced voice features",
                  "Priority execution",
                  "Email support",
                  "Team sharing (coming soon)",
                ],
                cta: "Start Free Trial",
                highlight: true,
              },
              {
                name: "Team",
                price: "$199",
                period: "/month",
                description: "For development teams",
                features: [
                  "Everything in Pro",
                  "5,000 agent minutes/month",
                  "5 team members",
                  "Custom runners",
                  "Priority support",
                  "SSO (coming soon)",
                ],
                cta: "Contact Sales",
                highlight: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-xl border ${
                  plan.highlight
                    ? "bg-violet-500/10 border-violet-500/30 scale-105"
                    : "bg-[#18181B] border-[#27272A]"
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block px-3 py-1 bg-violet-500 text-white text-xs font-medium rounded-full mb-4">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-400">{plan.period}</span>}
                </div>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full py-3 text-center rounded-lg font-medium transition ${
                    plan.highlight
                      ? "bg-violet-500 hover:bg-violet-600 text-white"
                      : "bg-[#27272A] hover:bg-[#3F3F46] text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Stop babysitting. Start shipping.
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join developers who've taken back control of their AI-powered workflow.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 rounded-lg font-semibold text-lg transition group"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#27272A]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/quetrex-logo.png"
              alt="Quetrex"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold">Quetrex</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Docs
            </a>
            <a href="https://github.com/barnent1/quetrex" className="hover:text-white transition">
              GitHub
            </a>
          </div>
          <p className="text-sm text-gray-500">
            2025 Quetrex. Built with Claude.
          </p>
        </div>
      </footer>
    </div>
  );
}
