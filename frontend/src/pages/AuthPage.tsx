import { useState } from "react";
import logo from "../assets/logo/logo.png";
import { motion, AnimatePresence } from "framer-motion";
import ParticleBackground from "../components/ParticleBackground.tsx";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = () => {
    console.log({ isLogin, email, password, username });
  };

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden font-[Inter]">

      {/* LEFT SIDE - AUTH */}
      <div className="w-full lg:w-1/2 flex flex-col">

        {/* BRAND TOP BAR */}
        <div className="flex items-center gap-3 px-10 py-6">
          <img
            src={logo}
            alt="SignalPH Logo"
            className="w-40 h-40 object-contain"
           />
        </div>

        {/* FORM */}
        <div className="flex-1 flex items-center justify-center px-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <h2 className="text-3xl font-semibold text-gray-900">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>

            <p className="text-gray-500 mt-2">
              {isLogin
                ? "Sign in to continue your journey"
                : "Join SignalPH and stay connected anywhere"}
            </p>

            <div className="mt-8 space-y-4">

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.input
                    key="username"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />
                )}
              </AnimatePresence>

              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
              />

              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-md transition"
              >
                {isLogin ? "Login" : "Create account"}
              </button>

              <button
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-sm text-sky-600 hover:text-sky-800 transition"
              >
                {isLogin
                  ? "New here? Create account"
                  : "Already have an account? Login"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-sky-600">

        {/* PARTICLES BACKGROUND - FULL COVER */}
        <div className="absolute inset-0 z-0">
          <ParticleBackground />
        </div>

        {/* BLUE OVERLAY (controls visibility) */}
        <div className="absolute inset-0 bg-sky-500/30 backdrop-blur-2xl z-10" />

        {/* CONTENT */}
        <div className="relative z-20 flex flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-semibold leading-tight">
            Smarter connectivity<br />for every journey
          </h2>

          <p className="mt-4 text-sky-100">
            SignalPH maps real-world network strength using geospatial intelligence.
          </p>

          <div className="mt-10 bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-md">
            <div className="h-40 rounded-xl bg-white/10" />
          </div>
        </div>

      </div>
    </div>
  );
}