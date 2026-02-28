'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from './Button'
import { Menu, X, Briefcase, User, LogOut, ChevronDown } from 'lucide-react'

interface NavbarProps {
  userRole?: 'company' | 'candidate' | null
  userName?: string
  profilePictureUrl?: string | null
}

export function Navbar({ userRole, userName, profilePictureUrl }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-[#111111] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Ansora</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-[#999] hover:text-white font-medium transition-colors text-sm">
              Stillinger
            </Link>
            {userRole === 'company' && (
              <Link href="/dashboard/company" className="text-[#999] hover:text-white font-medium transition-colors text-sm">
                Dashboard
              </Link>
            )}
            {userRole === 'candidate' && (
              <Link href="/dashboard/candidate" className="text-[#999] hover:text-white font-medium transition-colors text-sm">
                Mine søknader
              </Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {userRole ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Profilbilde" className="w-8 h-8 rounded-full object-cover" />
                    ) : userRole === 'company' ? (
                      <Briefcase className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[120px] truncate">
                    {userName || (userRole === 'company' ? 'Bedrift' : 'Kandidat')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#666]" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-xl border border-white/10 py-1">
                    <Link
                      href={userRole === 'company' ? '/dashboard/company' : '/dashboard/candidate'}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Briefcase className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <hr className="my-1 border-white/10" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Logg ut
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Logg inn</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrer deg</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#999] hover:bg-white/5"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/10">
            <Link
              href="/jobs"
              className="block px-4 py-2.5 text-sm text-[#999] hover:text-white hover:bg-white/5 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              Stillinger
            </Link>
            {userRole && (
              <Link
                href={userRole === 'company' ? '/dashboard/company' : '/dashboard/candidate'}
                className="block px-4 py-2.5 text-sm text-[#999] hover:text-white hover:bg-white/5 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {userRole ? (
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                Logg ut
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" className="w-full">Logg inn</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">Registrer deg</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
