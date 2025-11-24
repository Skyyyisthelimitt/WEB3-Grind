"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import login1 from "../images/login1.jpg";
import login2 from "../images/login2.jpg";
import login3 from "../images/login3.jpg";

const loginImages = [login1, login2, login3];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  // Auto-slide carousel every 2 seconds
  useEffect(() => {
    if (loginImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % loginImages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Main Login Container */}
      <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50">
        <div className="flex min-h-[600px]">
          {/* Left Section - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90">
            <div className="w-full max-w-md">
              {/* Logo */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 border-2 border-blue-500/50 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500/60"></div>
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">Web3 Manager</span>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-zinc-100 mb-2">Welcome Back!</h1>
                <p className="text-zinc-400 text-base">Please enter login details below</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-3 pr-12 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      onClick={() => {
                        const input = document.getElementById("password") as HTMLInputElement;
                        if (input) {
                          input.type = input.type === "password" ? "text" : "password";
                        }
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl text-base font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Section - Image Carousel */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-zinc-900 via-black to-zinc-950 overflow-hidden">
            {/* Image Carousel */}
            <div className="absolute inset-0">
              {loginImages.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={img}
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
            <div className="relative z-10 flex flex-col justify-end h-full p-12">
              <div className="max-w-md">
                <h2 className="text-4xl font-bold text-white mb-4">Manage your WEB3 Journey</h2>
                <p className="text-zinc-300 text-lg">
                  Track your whitelists and collaborations all in one place
                </p>
              </div>

              {/* Pagination Dots */}
              <div className="flex gap-2 mt-8">
                {loginImages.map((_, index) => (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

