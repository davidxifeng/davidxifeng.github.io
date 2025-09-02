import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Star, Heart, Zap, Sparkles, ArrowRight, RotateCcw } from 'lucide-react'

export const Route = createFileRoute('/showcase')({
  component: Showcase,
})

function Showcase() {
  const [counter, setCounter] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [pulseCards, setPulseCards] = useState(false)
  const [text, setText] = useState('')
  const [floatingElements, setFloatingElements] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLoadingDemo = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  const triggerPulse = () => {
    setPulseCards(true)
    setTimeout(() => setPulseCards(false), 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Component Showcase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Interactive demonstrations of beautiful UI components, animations, and effects
          </p>
        </div>

        {/* Floating Elements */}
        {floatingElements && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-20 left-10 animate-bounce text-blue-400">
              <Star className="h-6 w-6" />
            </div>
            <div className="absolute top-40 right-20 animate-pulse text-pink-400">
              <Heart className="h-5 w-5" />
            </div>
            <div className="absolute bottom-40 left-20 animate-spin text-yellow-400" style={{ animationDuration: '3s' }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="absolute bottom-20 right-10 animate-bounce text-green-400" style={{ animationDelay: '1s' }}>
              <Zap className="h-6 w-6" />
            </div>
          </div>
        )}

        <div className="relative z-10">
          {/* Animation Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Animation Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={triggerPulse} variant="outline">
                  Trigger Pulse Animation
                </Button>
                <Button onClick={handleLoadingDemo} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Demo Loading State'
                  )}
                </Button>
                <Button onClick={() => setFloatingElements(!floatingElements)}>
                  {floatingElements ? 'Hide' : 'Show'} Floating Elements
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Counter Animation */}
            <Card className={`transition-all duration-300 hover:shadow-lg hover:scale-105 ${pulseCards ? 'animate-pulse' : ''}`}>
              <CardHeader>
                <CardTitle>Auto Counter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2 font-mono">
                    {counter.toString().padStart(3, '0')}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seconds since page load</p>
                </div>
              </CardContent>
            </Card>

            {/* Gradient Card */}
            <Card className={`bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 ${pulseCards ? 'animate-pulse' : ''}`}>
              <CardHeader>
                <CardTitle>Gradient Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Beautiful gradient backgrounds with smooth hover transitions</p>
                <div className="mt-4">
                  <Button variant="secondary" size="sm">
                    Click me
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Input */}
            <Card className={`transition-all duration-300 hover:shadow-lg ${pulseCards ? 'animate-pulse' : ''}`}>
              <CardHeader>
                <CardTitle>Live Input</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Type something..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mb-3"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {text ? (
                    <span className="text-green-600 dark:text-green-400">You typed: "{text}"</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">Start typing to see live updates</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Spinning Icon */}
            <Card className={`transition-all duration-300 hover:shadow-lg ${pulseCards ? 'animate-pulse' : ''}`}>
              <CardHeader>
                <CardTitle>Animated Icons</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                  <div className="animate-bounce text-purple-500">
                    <ArrowRight className="h-6 w-6 mx-auto" />
                  </div>
                  <div className="animate-pulse text-pink-500">
                    <Heart className="h-6 w-6 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hover Effects */}
            <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 ${pulseCards ? 'animate-pulse' : ''}`}>
              <CardHeader>
                <CardTitle className="group-hover:text-purple-600 transition-colors">
                  Hover Effects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                  Hover over this card to see smooth transitions
                </p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                    Hidden Button
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Animation */}
            <Card className={`transition-all duration-300 hover:shadow-lg ${pulseCards ? 'animate-pulse' : ''}`}>
              <CardHeader>
                <CardTitle>Progress Animation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(counter % 100)}%` }}
                    ></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((counter * 2) % 100)}%` }}
                    ></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((counter * 3) % 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CSS Animation Showcase */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>CSS Animation Showcase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-2 animate-pulse"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pulse</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2 animate-bounce"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bounce</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-purple-500 rounded-lg mx-auto mb-2 animate-spin"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spin</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-pink-500 rounded-lg mx-auto mb-2 animate-ping"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ping</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Animations */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Keyframe Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mx-auto mb-2 animate-[wiggle_1s_ease-in-out_infinite] shadow-lg"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wiggle</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mx-auto mb-2 hover:animate-[pulse_0.5s_ease-in-out] shadow-lg transition-all duration-300 hover:scale-110"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hover to Pulse</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mx-auto mb-2 animate-[bounce_2s_infinite] shadow-lg"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Slow Bounce</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Built with Tailwind CSS animations and custom keyframes</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Explore the code to see how these effects are implemented</p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes wiggle {
            0%, 7% {
              transform: rotateZ(0);
            }
            15% {
              transform: rotateZ(-15deg);
            }
            20% {
              transform: rotateZ(10deg);
            }
            25% {
              transform: rotateZ(-10deg);
            }
            30% {
              transform: rotateZ(6deg);
            }
            35% {
              transform: rotateZ(-4deg);
            }
            40%, 100% {
              transform: rotateZ(0);
            }
          }
        `}
      </style>
    </div>
  )
}