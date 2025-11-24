"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import login1 from "../images/login1.jpg";
import login2 from "../images/login2.jpg";
import login3 from "../images/login3.jpg";
import login4 from "../images/login4.jpg";
import login5 from "../images/login5.jpg";

const loginImages = [
  login1,
  login2,
  login3,
  login4,
  login5,
];

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
    <div className="login-grid-bg min-h-screen flex items-center justify-center p-4">
      {/* Main Login Container */}
      <div className="relative z-[1] w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50">
        <div className="flex min-h-[600px]">
          {/* Left Section - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white">
            <div className="w-full max-w-sm">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
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
                  <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent border-0 border-b-2 border-zinc-300 px-0 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors"
                      placeholder=""
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
                      placeholder=""
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

