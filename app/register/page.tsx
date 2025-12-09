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

const slides = [
  {
    image: login1,
    title: "Start Your WEB3 Journey",
    description: "Join the community and start tracking your whitelists today.",
  },
  {
    image: login2,
    title: "Effortless Tracking",
    description: "Never miss a mint date again with our automated tracking tools.",
  },
  {
    image: login3,
    title: "Collaborate & share",
    description: "Work together with your team and share opportunities seamlessly.",
  },
  {
    image: login4,
    title: "Stay Inspired",
    description: "Get daily motivation to keep grinding and building.",
  },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                full_name: fullName,
            }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        // Successful registration
        router.push("/"); 
        router.refresh();
      }
    } catch (err) {
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
            {/* Left Section - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white">
              <div className="w-full max-w-sm">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg className="w-15 h-13 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-zinc-800 mb-2">Create an account</h1>
                <p className="text-zinc-500 text-base">Enter your details to get started</p>
              </div>

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                  <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-2">
                    Username
                  </label>
                  <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                      required
                    />
                </div>
                 <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 mb-2">
                    Full Name
                  </label>
                  <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                      required
                    />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-base font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
                
                 <div className="text-center text-sm text-zinc-600 mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-zinc-800 hover:text-zinc-600">
                    Log in
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
                      alt={`Register image ${index + 1}`}
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
                          ? "w-8 bg-blue-500"
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
