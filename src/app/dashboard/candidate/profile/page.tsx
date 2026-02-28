'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  ArrowLeft, User, Upload, FileText, Linkedin, Phone,
  CheckCircle2, Loader2, Camera, Pencil, X,
} from 'lucide-react'
import Link from 'next/link'

interface CandidateProfile {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  skills?: string
  linkedin_url?: string
  cv_url?: string
  profile_picture_url?: string
}

export default function CandidateProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [linkedin, setLinkedin] = useState('')

  const photoInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.candidate) {
          const c = data.candidate as CandidateProfile
          setProfile(c)
          setName(c.name || '')
          setPhone(c.phone || '')
          setBio(c.bio || '')
          setSkills(c.skills || '')
          setLinkedin(c.linkedin_url || '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSaveText = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, bio, skills, linkedin_url: linkedin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile(data.candidate)
      showSuccess('Profil oppdatert!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved lagring')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Kun JPG, PNG og WebP er støttet for profilbilde')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profilbilde kan maks være 5 MB')
      return
    }
    setUploadingPhoto(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('profile_picture', file)
      const res = await fetch('/api/profile', { method: 'PATCH', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile(data.candidate)
      showSuccess('Profilbilde oppdatert!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved opplasting')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCVUpload = async (file: File) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('CV må være en PDF-fil')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('CV kan maks være 10 MB')
      return
    }
    setUploadingCV(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('cv', file)
      const res = await fetch('/api/profile', { method: 'PATCH', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile(data.candidate)
      showSuccess('CV lastet opp!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved opplasting av CV')
    } finally {
      setUploadingCV(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06070E] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06070E]">
      <Navbar userRole="candidate" userName={profile?.name} profilePictureUrl={profile?.profile_picture_url} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/candidate" className="inline-flex items-center gap-2 text-sm text-[#7a8a7d] hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tilbake til dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Min profil</h1>
          <p className="text-[#94A187] mt-1 text-sm">Informasjonen din er synlig for bedrifter som vurderer søknaden din</p>
        </div>

        {/* Feedback */}
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Profile picture */}
        <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-white" />
            Profilbilde
          </h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profilbilde"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#94A187]/25"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1a2c24] border-2 border-[#94A187]/25 flex items-center justify-center">
                  <User className="w-8 h-8 text-[#3a5248]" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#94A187] mb-3">JPG, PNG eller WebP – maks 5 MB</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="inline-flex items-center gap-2 border border-white/[0.12] hover:border-white/[0.25] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingPhoto ? 'Laster opp...' : 'Last opp bilde'}
              </button>
            </div>
          </div>
        </div>

        {/* CV */}
        <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" />
            CV
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              {profile?.cv_url ? (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-900/30 border border-green-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">CV lastet opp</p>
                    <a
                      href={profile.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white hover:underline"
                    >
                      Se CV
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#94A187] mb-2">Ingen CV lastet opp ennå</p>
              )}
              <p className="text-xs text-[#4a6358]">PDF – maks 10 MB</p>
            </div>
            <div>
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleCVUpload(e.target.files[0])}
              />
              <button
                onClick={() => cvInputRef.current?.click()}
                disabled={uploadingCV}
                className="inline-flex items-center gap-2 border border-white/[0.12] hover:border-white/[0.25] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploadingCV ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {uploadingCV ? 'Laster opp...' : profile?.cv_url ? 'Erstatt CV' : 'Last opp CV'}
              </button>
            </div>
          </div>
        </div>

        {/* Text fields */}
        <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-white" />
            Personlig informasjon
          </h2>

          <div className="space-y-5">
            <Input
              label="Fullt navn *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt navn"
            />

            <Input
              label="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+47 000 00 000"
              type="tel"
            />

            <Textarea
              label="Om meg"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Skriv litt om deg selv, din erfaring og hva du søker etter..."
              helperText="Synlig for bedrifter som vurderer søknaden din"
            />

            <Textarea
              label="Ferdigheter og kompetanse"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              rows={3}
              placeholder="F.eks. JavaScript, React, Node.js, prosjektledelse, kundeservice..."
              helperText="Liste over relevante ferdigheter atskilt med komma"
            />

            <div className="relative">
              <Input
                label="LinkedIn-profil"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/ditt-navn"
                type="url"
              />
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-8 text-white hover:opacity-80"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveText} loading={saving} size="lg">
                {saving ? 'Lagrer...' : 'Lagre profil'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
