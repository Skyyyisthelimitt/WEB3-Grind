"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import login1 from "../images/login1.png";
import login2 from "../images/login2.png";
import login3 from "../images/login3.png";
import login4 from "../images/login4.png";
import logo from "../images/login-logo.png";

const slides = [
  {
    image: login1,
    title: "Manage your WEB3 Journey",
    description: "Track your whitelists and collaborations all in one place",
  },
  {
    image: login2,
    title: "Effortlessly Track All Your Whitelist Spots",
    description: "Stay organized with real-time updates, quick search, and mint dates.",
  },
  {
    image: login3,
    title: "Stay On Top of Every Collaboration",
    description: "Clear deadlines. Clean tracking. Zero confusion.",
  },
  {
    image: login4,
    title: "Inspire Your Journey",
    description: "Display Bible verses and quotes that guide your daily grind.",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Auto-slide carousel every 3 seconds
  useEffect(() => {
    if (slides.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  const currentSlide = slides[currentImageIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-grid-bg min-h-screen flex items-center justify-center p-4">
      {/* Main Login Container */}
      <div className="login-card-glow relative z-[1] w-full max-w-6xl rounded-2xl border border-white/15 shadow-[0_0_70px_rgba(255,255,255,0.2)]">
        <div className="rounded-2xl overflow-hidden bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex min-h-[600px]">
            {/* Left Section - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white">
              <div className="w-full max-w-sm">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative w-40 h-24">
                  <Image 
                    src={logo} 
                    alt="Logo" 
                    fill 
                    className="object-contain" 
                    priority
                  />
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-zinc-800 mb-2">Welcome back!</h1>
                <p className="text-zinc-500 text-base">Please enter your details</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                      placeholder="name@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 pr-10 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                      onClick={() => {
                        const input = document.getElementById("password") as HTMLInputElement;
                        if (input) {
                          input.type = input.type === "password" ? "text" : "password";
                        }
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-zinc-700 border-zinc-300 rounded focus:ring-zinc-500"
                    />
                    <span className="text-sm text-zinc-700">Remember for 30 days</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-zinc-500 hover:text-zinc-700"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-base font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
                <div className="text-center text-sm text-zinc-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="font-semibold text-zinc-800 hover:text-zinc-600">
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </div>
 
            {/* Right Section - Image Carousel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-zinc-900 via-black to-zinc-950 overflow-hidden">
              {/* Image Carousel */}
              <div className="absolute inset-0">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      src={slide.image}
                      alt={`Login image ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 flex flex-col h-full p-12 pt-10 gap-4">
                <div className="max-w-md">
                  <h2 className="text-4xl font-bold text-white mb-3">{currentSlide.title}</h2>
                  <p className="text-zinc-300 text-lg">{currentSlide.description}</p>
                </div>

                <div className="flex gap-2 mt-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "w-8 bg-white"
                          : "w-2 bg-zinc-600 hover:bg-zinc-500"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="mt-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

