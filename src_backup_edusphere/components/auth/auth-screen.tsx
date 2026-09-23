'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Users, BookOpen, Loader2, Sparkles, TrendingUp, Award, ChevronLeft } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/lib/store'
import { toast } from 'sonner'

export function AuthScreen() {
  const setAuthMode = useUIStore((s) => s.setAuthMode)
  const [mode, setMode] = useState<'login' | 'register'>(() => {
    return useUIStore.getState().authMode === 'register' ? 'register' : 'login'
  })
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name || data.user.username}!`)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          username: regUsername,
          password: regPassword,
          role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }
      setUser(data.user)
      toast.success('Account created successfully!')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillAdminCreds = () => {
    setMode('login')
    setLoginIdentifier('admin')
    setLoginPassword('admin123')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">EduSphere</h1>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            The Complete SaaS Platform for Educators
          </h2>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Sell courses, test series, and notes. Every teacher gets their own CMS portal, 
            website, and student management system — all in one place.
          </p>
          <div className="space-y-4">
            {[
              { icon: BookOpen, title: 'Course Management', desc: 'Create and sell structured courses with video lessons' },
              { icon: Award, title: 'Test Series', desc: 'Build MCQ tests with auto-grading and analytics' },
              { icon: Users, title: 'Student Management', desc: 'Track enrollments, progress, and performance' },
              { icon: TrendingUp, title: 'Revenue Analytics', desc: 'Monitor your earnings with detailed insights' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-muted/30 relative">
        <Button variant="ghost" size="sm" onClick={() => setAuthMode('landing')} className="absolute top-4 left-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
        </Button>
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Join EduSphere and start learning or teaching'}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sign In</CardTitle>
                  <CardDescription>Enter your email/username and password</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-identifier">Email or Username</Label>
                      <Input
                        id="login-identifier"
                        type="text"
                        placeholder="admin or you@example.com"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Sign In
                    </Button>
                    <button
                      type="button"
                      onClick={fillAdminCreds}
                      className="text-xs text-muted-foreground hover:text-emerald-600 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Use admin demo credentials
                    </button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Account</CardTitle>
                  <CardDescription>Choose your role and get started</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('STUDENT')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          role === 'STUDENT'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-border hover:border-emerald-400'
                        }`}
                      >
                        <GraduationCap className={`w-6 h-6 mb-2 ${role === 'STUDENT' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <p className="font-semibold text-sm">Student</p>
                        <p className="text-xs text-muted-foreground">Learn & enroll</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('TEACHER')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          role === 'TEACHER'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-border hover:border-emerald-400'
                        }`}
                      >
                        <Users className={`w-6 h-6 mb-2 ${role === 'TEACHER' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <p className="font-semibold text-sm">Teacher</p>
                        <p className="text-xs text-muted-foreground">Teach & earn</p>
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">Username</Label>
                        <Input
                          id="reg-username"
                          type="text"
                          placeholder="johndoe"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Min 6 chars"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create {role === 'STUDENT' ? 'Student' : 'Teacher'} Account
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
