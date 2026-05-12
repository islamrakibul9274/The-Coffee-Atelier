"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Welcome back to The Coffee Atelier");
      router.push("/");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-background">
      <div className="w-full max-w-md p-12 bg-card border border-cardBorder shadow-2xl">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="font-serif text-2xl text-foreground tracking-tighter">THE COFFEE ATELIER</span>
          </Link>
          <h1 className="font-serif text-4xl text-foreground italic">Welcome Back</h1>
          <p className="mt-4 text-text-muted text-sm uppercase tracking-widest">Sign in to your sanctuary</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold">Email Address</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-4 bg-background border border-cardBorder text-foreground focus:border-accent-gold outline-none transition-all placeholder:text-text-muted/30"
              placeholder="atelier@example.com"
            />
            {errors.email && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full px-4 py-4 bg-background border border-cardBorder text-foreground focus:border-accent-gold outline-none transition-all placeholder:text-text-muted/30"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-accent-gold text-background text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-foreground transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cardBorder"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="px-4 bg-card text-text-muted">Or continue with</span>
          </div>
        </div>

        <GoogleSignInButton />

        <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-text-muted">
          New to the atelier?{" "}
          <Link href="/signup" className="text-accent-gold hover:text-foreground transition-colors">
            Begin Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
