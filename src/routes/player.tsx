import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AuroraBackground from '@/components/aceternity/AuroraBackground'
import Sparkles from '@/components/aceternity/Sparkles'
import GlowingCard from '@/components/aceternity/GlowingCard'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  Music,
} from 'lucide-react'

export const Route = createFileRoute('/player')({
  component: Player,
})

const songs = [
  {
    id: 1,
    title: "Stellar Dreams",
    artist: "Cosmic Wanderer",
    album: "Galactic Journey",
    duration: "3:45",
    cover: "🌟",
  },
  {
    id: 2,
    title: "Neon Nights",
    artist: "Synthwave Master",
    album: "Retro Future",
    duration: "4:12",
    cover: "🌃",
  },
  {
    id: 3,
    title: "Aurora Vibe",
    artist: "Electronic Dreams",
    album: "Northern Lights",
    duration: "5:23",
    cover: "🌈",
  },
]

function Player() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(225) // 3:45 in seconds
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [visualizerBars, setVisualizerBars] = useState<number[]>([])

  const intervalRef = useRef<NodeJS.Timeout>()

  // Update duration when song changes
  useEffect(() => {
    const durations = [225, 252, 323] // durations in seconds for each song
    setDuration(durations[currentSong])
    setCurrentTime(0)
  }, [currentSong])

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            handleNext()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, duration])

  // Animated visualizer bars
  useEffect(() => {
    const updateBars = () => {
      if (isPlaying) {
        setVisualizerBars(Array(12).fill(0).map(() => Math.random() * 100))
      } else {
        setVisualizerBars(Array(12).fill(0))
      }
    }
    
    updateBars()
    const interval = setInterval(updateBars, 150)
    return () => clearInterval(interval)
  }, [isPlaying])

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  const handleNext = () => setCurrentSong((prev) => (prev + 1) % songs.length)
  const handlePrev = () => setCurrentSong((prev) => (prev - 1 + songs.length) % songs.length)
  const handleVolumeToggle = () => setIsMuted(!isMuted)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = (currentTime / duration) * 100

  return (
    <AuroraBackground className="flex items-center justify-center p-4">
      <Sparkles particleCount={30} particleColor="#ffffff" />
      
      <div className="w-full max-w-6xl mx-auto">
        {/* Main Player Interface */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Album Art & Song Info */}
          <div className="lg:col-span-1">
            <GlowingCard className="text-center" glowColor="rgba(168, 85, 247, 0.4)">
              <div className="relative mb-6">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center text-8xl shadow-2xl">
                  {songs[currentSong].cover}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                {isPlaying && (
                  <div className="absolute inset-0 animate-pulse bg-white/10 rounded-2xl" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {songs[currentSong].title}
              </h2>
              <p className="text-gray-300 text-lg mb-2">
                {songs[currentSong].artist}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {songs[currentSong].album}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`text-white hover:bg-white/10 ${isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </GlowingCard>
          </div>

          {/* Player Controls & Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visualizer */}
            <GlowingCard glowColor="rgba(34, 197, 94, 0.4)">
              <div className="flex items-end justify-center space-x-2 h-32 mb-6">
                {visualizerBars.map((height, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-green-500 to-cyan-400 w-4 rounded-t-lg transition-all duration-150"
                    style={{ 
                      height: `${Math.max(height, 4)}%`,
                      opacity: isPlaying ? 1 : 0.3 
                    }}
                  />
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`text-white hover:bg-white/10 ${isShuffle ? 'text-green-400' : ''}`}
                >
                  <Shuffle className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handlePrev}
                  className="text-white hover:bg-white/10"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>

                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-16 h-16 rounded-full shadow-2xl"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleNext}
                  className="text-white hover:bg-white/10"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`text-white hover:bg-white/10 ${isRepeat ? 'text-green-400' : ''}`}
                >
                  <Repeat className="h-5 w-5" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVolumeToggle}
                  className="text-white hover:bg-white/10"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="w-24 bg-white/20 h-1 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                </div>
                
                <span className="text-sm text-gray-300 w-8">
                  {isMuted ? 0 : volume}
                </span>
              </div>
            </GlowingCard>

            {/* Playlist */}
            <GlowingCard glowColor="rgba(59, 130, 246, 0.4)">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Music className="h-5 w-5" />
                Now Playing
              </h3>
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => setCurrentSong(index)}
                    className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      index === currentSong
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl">{song.cover}</div>
                    <div className="flex-1">
                      <p className={`font-medium ${index === currentSong ? 'text-white' : 'text-gray-300'}`}>
                        {song.title}
                      </p>
                      <p className="text-sm text-gray-400">{song.artist}</p>
                    </div>
                    <div className="text-sm text-gray-400">{song.duration}</div>
                    {index === currentSong && isPlaying && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-4 bg-green-400 animate-pulse" />
                        <div className="w-1 h-4 bg-green-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-4 bg-green-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlowingCard>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Experience immersive music with stunning visual effects powered by Aceternity UI
          </p>
        </div>
      </div>
    </AuroraBackground>
  )
}