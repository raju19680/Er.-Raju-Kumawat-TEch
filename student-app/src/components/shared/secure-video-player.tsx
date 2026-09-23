'use client'

import React, { useRef, useState, useEffect } from 'react'
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  Settings2, Subtitles, ListVideo, AudioLines, RotateCcw, RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TranslationTrack {
  languageCode: string
  languageName: string
  subtitleVttUrl: string | null
  audioTrackUrl: string | null
}

interface SecureVideoPlayerProps {
  url: string
  title: string
  translations?: TranslationTrack[]
  teacherName?: string
  watermarkText?: string
  initialTime?: number
  onTimeUpdate?: (time: number) => void
}

const mockTranslations = [
  {
    languageCode: "hi",
    languageName: "Hindi",
    subtitleVttUrl: "data:text/vtt;base64,V0VCVlRUDQoNCjAwOjAwOjAwLjAwMCAtLT4gMDA6MDA6MTAuMDAwDQpIaW5kaSBNb2NrIFN1YnRpdGxlcw==",
    audioTrackUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    languageCode: "en",
    languageName: "English",
    subtitleVttUrl: "data:text/vtt;base64,V0VCVlRUDQoNCjAwOjAwOjAwLjAwMCAtLT4gMDA6MDA6MTAuMDAwDQpFbmdsaXNoIE1vY2sgU3VidGl0bGVz",
    audioTrackUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
]

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function SecureVideoPlayer({ 
  url, 
  title, 
  translations = mockTranslations,
  teacherName = 'Institute', 
  watermarkText,
  initialTime,
  onTimeUpdate
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null)
  const [activeAudio, setActiveAudio] = useState<string | null>(null)
  
  const [phone, setPhone] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [floatingPos, setFloatingPos] = useState({ x: 20, y: 25 })
  const userName = useAppStore(s => s.userName)
  const userEmail = useAppStore(s => s.userEmail)
  const userRole = useAppStore(s => s.userRole)

  // Fetch verified phone and email for watermark from DB
  useEffect(() => {
    async function fetchVerifiedProfile() {
      try {
        if (userRole === 'student') {
          const res = await apiFetchJSON<{ success: boolean; student?: { phone: string; email: string } }>('/api/student/profile')
          if (res.success && res.student) {
            if (res.student.phone) setPhone(res.student.phone)
            if (res.student.email) setEmail(res.student.email)
          }
        } else {
          // Teacher or admin side
          const res = await apiFetchJSON<{ authenticated: boolean; user?: { email: string; phone?: string } }>('/api/auth/me')
          if (res.user) {
            if (res.user.email) setEmail(res.user.email)
            if (res.user.phone) setPhone(res.user.phone)
          }
        }
      } catch (e) {
        console.error('Failed to fetch watermark profile:', e)
      }
    }
    fetchVerifiedProfile()
  }, [userRole])

  // Randomly re-position floating watermark badge every 5 seconds to thwart screen recording
  useEffect(() => {
    const interval = setInterval(() => {
      const randomX = Math.floor(Math.random() * 60) + 10 // 10% to 70%
      const randomY = Math.floor(Math.random() * 55) + 15 // 15% to 70%
      setFloatingPos({ x: randomX, y: randomY })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Student side: show only email + phone for security identification
  // Teacher/Admin side: no watermark needed
  const displayWatermark = userRole === 'student' 
    ? [phone, email || userEmail].filter(Boolean).join(' • ') || 'Student'
    : ''

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, 3000)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false)
      })
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', () => {})
      }
      clearTimeout(timeout)
    }
  }, [isPlaying])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Handle Muting the video if an external audio track is active
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = activeAudio !== null
    }
  }, [activeAudio])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        if (activeAudio && audioRef.current) audioRef.current.pause()
      } else {
        videoRef.current.play()
        if (activeAudio && audioRef.current) {
          audioRef.current.currentTime = videoRef.current.currentTime
          audioRef.current.play()
        }
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      
      // Notify parent every 5 seconds or so
      if (onTimeUpdate && Math.floor(videoRef.current.currentTime) % 5 === 0) {
        onTimeUpdate(videoRef.current.currentTime)
      }
      
      // Sync external audio if it drifts too far from video
      if (activeAudio && audioRef.current && isPlaying) {
        const drift = Math.abs(audioRef.current.currentTime - videoRef.current.currentTime)
        if (drift > 0.3) {
          audioRef.current.currentTime = videoRef.current.currentTime
        }
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      if (initialTime && initialTime > 0 && initialTime < videoRef.current.duration) {
        videoRef.current.currentTime = initialTime
      }
      // Initialize all subtitle tracks as hidden - user selects from settings
      const tracks = videoRef.current.textTracks
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'hidden'
      }
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      if (activeAudio && audioRef.current) audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      let newTime = videoRef.current.currentTime + 10
      if (newTime > duration) newTime = duration
      videoRef.current.currentTime = newTime
      if (activeAudio && audioRef.current) audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const skipBackward = () => {
    if (videoRef.current) {
      let newTime = videoRef.current.currentTime - 10
      if (newTime < 0) newTime = 0
      videoRef.current.currentTime = newTime
      if (activeAudio && audioRef.current) audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0] / 100
    if (videoRef.current) videoRef.current.volume = newVol
    if (audioRef.current) audioRef.current.volume = newVol
    
    setVolume(newVol)
    setIsMuted(newVol === 0)
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    const vol = newMuted ? 0 : (volume || 1)
    
    if (videoRef.current) videoRef.current.volume = vol
    if (audioRef.current) audioRef.current.volume = vol
    
    setIsMuted(newMuted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate
    if (audioRef.current) audioRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const handleSubtitleChange = (langCode: string | null) => {
    setActiveSubtitle(langCode)
    if (videoRef.current && videoRef.current.textTracks) {
      const tracks = videoRef.current.textTracks
      for (let i = 0; i < tracks.length; i++) {
        if (langCode && tracks[i].language === langCode) {
          tracks[i].mode = 'showing'
        } else {
          tracks[i].mode = 'hidden'
        }
      }
    }
  }

  const handleAudioChange = (audioUrl: string | null) => {
    setActiveAudio(audioUrl)

    // Robustly update and play the external audio track.
    // Ensure video is muted before attempting to play to avoid audible overlap.
    if (audioRef.current) {
      try {
        if (audioUrl) {
          // Mute video immediately to avoid original audio overlap
          if (videoRef.current) videoRef.current.muted = true

          audioRef.current.src = audioUrl
          // Ensure the browser loads the new source
          audioRef.current.load()
          if (videoRef.current) {
            audioRef.current.currentTime = videoRef.current.currentTime
          }
          audioRef.current.playbackRate = playbackRate
          audioRef.current.volume = isMuted ? 0 : volume

          // Attempt to play and log any errors
          const playPromise = audioRef.current.play()
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(err => {
              console.error('Failed to play external audio track:', err)
            })
          }
        } else {
          audioRef.current.pause()
          audioRef.current.src = ''
          // Unmute video when external audio is removed
          if (videoRef.current) videoRef.current.muted = false
        }
      } catch (err) {
        console.error('handleAudioChange error:', err)
      }
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (audioRef.current) audioRef.current.pause()
  }

  // Filter valid translation tracks
  const subtitleTracks = translations.filter(t => t.subtitleVttUrl !== null)
  const audioTracks = translations.filter(t => t.audioTrackUrl !== null)

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group select-none"
      onContextMenu={(e) => e.preventDefault()} // Disable right click
    >
      {/* Dynamic Watermark Overlay - only student side */}
      {userRole === 'student' && displayWatermark && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden opacity-[0.10]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-24 -rotate-30 my-20 whitespace-nowrap">
              {Array.from({ length: 3 }).map((_, j) => (
                <span key={j} className="text-xl md:text-2xl font-semibold text-white drop-shadow-lg">
                  {displayWatermark}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Floating Dynamic Moving Anti-Screen Recording Badge - only student side */}
      {userRole === 'student' && displayWatermark && (
        <div 
          className="pointer-events-none absolute z-20 transition-all duration-[2000ms] ease-in-out select-none"
          style={{ top: `${floatingPos.y}%`, left: `${floatingPos.x}%` }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/15 text-white/80 font-mono text-xs shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{displayWatermark}</span>
          </div>
        </div>
      )}

      {/* Hidden External Audio Element */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      {/* Video Element */}
      <video
        ref={videoRef}
        src={url}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        controlsList="nodownload"
      >
        {subtitleTracks.map((t, idx) => (
          t.subtitleVttUrl ? (
            <track
              key={idx}
              kind="subtitles"
              srcLang={t.languageCode}
              src={t.subtitleVttUrl}
              label={t.languageName}
            />
          ) : null
        ))}
      </video>

      {/* Big Play Button Overlay (when paused) */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity duration-300"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-600/90 text-white shadow-xl backdrop-blur-md transform transition-transform hover:scale-110">
            <Play className="w-8 h-8 ml-1" />
          </div>
        </div>
      )}

      {/* Double tap zones for seeking (mobile friendly) */}
      <div 
        className="absolute inset-y-0 left-0 w-1/3 z-10" 
        onDoubleClick={skipBackward}
      />
      <div 
        className="absolute inset-y-0 right-0 w-1/3 z-10" 
        onDoubleClick={skipForward}
      />

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-30 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-col gap-3 max-w-screen-xl mx-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <span className="text-white text-xs font-mono w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer [&>span:first-child]:h-1.5 [&>span:first-child]:bg-white/30 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-0"
            />
            <span className="text-white/70 text-xs font-mono w-12">
              {formatTime(duration)}
            </span>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={skipBackward}
                className="text-white hover:text-amber-500 transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button 
                onClick={togglePlay}
                className="text-white hover:text-amber-500 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button 
                onClick={skipForward}
                className="text-white hover:text-amber-500 transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 group/volume ml-2">
                <button 
                  onClick={toggleMute}
                  className="text-white hover:text-amber-500 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-out origin-left">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-20 cursor-pointer [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-0"
                  />
                </div>
              </div>
              
              <div className="hidden md:block pl-2 border-l border-white/20">
                <span className="text-white/90 text-sm font-medium truncate max-w-[200px] lg:max-w-xs inline-block">
                  {title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Settings / Quality / Speed Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white hover:text-amber-500 transition-colors p-1">
                    <Settings className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10 text-white p-2">
                  <DropdownMenuLabel className="text-xs text-white/50 uppercase tracking-wider">Speed</DropdownMenuLabel>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[0.5, 1, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`text-xs py-1.5 rounded transition-colors ${playbackRate === rate ? 'bg-amber-600 font-bold' : 'hover:bg-white/20'}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                  


                  {subtitleTracks.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuLabel className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-1">
                        <Subtitles className="w-3 h-3" /> Subtitles
                      </DropdownMenuLabel>
                      <button
                        onClick={() => handleSubtitleChange(null)}
                        className={`w-full text-left text-sm py-1.5 px-2 rounded mb-1 transition-colors ${activeSubtitle === null ? 'bg-amber-600/50 text-amber-300' : 'hover:bg-white/10'}`}
                      >
                        Off
                      </button>
                      {subtitleTracks.map(t => (
                        <button
                          key={t.languageCode}
                          onClick={() => handleSubtitleChange(t.languageCode)}
                          className={`w-full text-left text-sm py-1.5 px-2 rounded mb-1 transition-colors ${activeSubtitle === t.languageCode ? 'bg-amber-600/50 text-amber-300' : 'hover:bg-white/10'}`}
                        >
                          {t.languageName}
                        </button>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <button 
                onClick={toggleFullscreen}
                className="text-white hover:text-amber-500 transition-colors p-1"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
