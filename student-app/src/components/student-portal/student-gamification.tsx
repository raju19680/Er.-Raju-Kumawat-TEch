/* eslint-disable */
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetchJSON } from '@/lib/api-client'
import { Trophy, Flame, Star, Award, Medal } from 'lucide-react'
import toast from 'react-hot-toast'

interface Streak {
  currentStreak: number
  longestStreak: number
}

interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

interface LeaderboardEntry {
  id: string
  name: string
  points: number
}

export default function StudentGamification() {
  const [streak, setStreak] = useState<Streak | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [streakRes, achRes, leadRes] = await Promise.all([
        apiFetchJSON<{success: boolean, data: Streak}>('/api/student/gamification/streak', { method: 'POST' }),
        apiFetchJSON<{success: boolean, data: Achievement[]}>('/api/student/gamification/achievements'),
        apiFetchJSON<{success: boolean, data: LeaderboardEntry[]}>('/api/student/gamification/leaderboard')
      ])

      if (streakRes.success) setStreak(streakRes.data)
      if (achRes.success) setAchievements(achRes.data)
      if (leadRes.success) setLeaderboard(leadRes.data)
    } catch (err) {
      toast.error('Failed to load gamification data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" /> My Achievements
        </h1>
        <p className="text-sm text-muted-foreground">Track your learning progress and compete with classmates.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Streak & Achievements (Left Column) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-600" /> Learning Streak
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    You've logged in for <strong className="text-lg">{streak?.currentStreak || 0}</strong> consecutive days!
                  </p>
                  <p className="text-xs text-orange-600/70 mt-1">
                    Longest streak: {streak?.longestStreak || 0} days
                  </p>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner text-2xl font-bold text-orange-600 border-4 border-orange-200">
                  {streak?.currentStreak || 0}
                </div>
              </CardContent>
            </Card>

            {/* Badges Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Medal className="w-5 h-5 text-indigo-500" /> Badges & Awards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {achievements.map(ach => (
                    <div 
                      key={ach.id} 
                      className={`p-4 rounded-lg border text-center transition-all ${
                        ach.unlocked 
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                          : 'bg-slate-50 border-dashed opacity-60 grayscale'
                      }`}
                    >
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                        ach.unlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {ach.unlocked ? <Award className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                      </div>
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">{ach.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ach.description}</p>
                      {ach.unlocked && ach.unlockedAt && (
                        <Badge variant="outline" className="mt-2 text-[9px] bg-white">
                          {new Date(ach.unlockedAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Leaderboard (Right Column) */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Class Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No points recorded yet. Submit assignments to earn points!
                  </div>
                ) : (
                  <div className="divide-y">
                    {leaderboard.map((entry, idx) => (
                      <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="font-medium text-sm">{entry.name}</span>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          {entry.points} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  )
}
