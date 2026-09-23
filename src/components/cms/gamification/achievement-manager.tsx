/* eslint-disable */
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetchJSON } from '@/lib/api-client'
import { Trophy, Award, Medal } from 'lucide-react'
import { toast } from 'sonner'

export default function AchievementManager() {
  const [achievements, setAchievements] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [achRes, leadRes] = await Promise.all([
        apiFetchJSON<{success: boolean, data: any[]}>('/api/teacher/gamification/achievements'),
        apiFetchJSON<{success: boolean, data: any[]}>('/api/teacher/gamification/leaderboard')
      ])

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
        <h1 className="text-2xl font-bold tracking-tight">Gamification & Engagement</h1>
        <p className="text-sm text-muted-foreground">Monitor student leaderboards and manage unlockable achievements.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Top Students (Leaderboard)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No points recorded yet.
                </div>
              ) : (
                <div className="divide-y">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          #{idx + 1}
                        </div>
                        <span className="font-medium">{entry.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-mono bg-indigo-50 text-indigo-700 border-indigo-200">
                        {entry.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-indigo-500" /> Platform Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map(ach => (
                  <div key={ach.id} className="p-4 rounded-lg border bg-slate-50 flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{ach.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs bg-white text-slate-500">
                        Criteria: {ach.criteria}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}
