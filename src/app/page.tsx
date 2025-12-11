import Link from 'next/link';
import { ArrowRight, Shield, Clock, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
              <span className="text-lg font-bold text-white">HC</span>
            </div>
            <span className="text-xl font-semibold text-slate-800">
              HealthCare
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-800 sm:text-5xl">
            Healthcare Management
            <br />
            <span className="text-emerald-600">Made Simple</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
            A secure platform for managing appointments, patient records, and
            medical prescriptions. Built for healthcare professionals and
            patients.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              Secure & Private
            </h3>
            <p className="mt-2 text-slate-500">
              Your health data is protected with enterprise-grade security and
              strict access controls.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              Easy Scheduling
            </h3>
            <p className="mt-2 text-slate-500">
              Book appointments with your healthcare providers in just a few
              clicks.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              Care Team
            </h3>
            <p className="mt-2 text-slate-500">
              Doctors and nurses work together to provide you with the best
              possible care.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
