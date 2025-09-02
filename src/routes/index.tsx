import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
            Welcome to Playground
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            A modern React application showcasing the power of TanStack Router, 
            React 19, and cutting-edge UI components with beautiful animations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/todo"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Try Todo App
            </Link>
            <Link
              to="/showcase"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-6 rounded-lg border-2 border-blue-600 transition-colors duration-200"
            >
              View Showcase
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="text-blue-600 text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Built with Vite and optimized for performance</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="text-cyan-600 text-3xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Beautiful UI</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Crafted with Tailwind CSS and Shadcn/ui</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="text-purple-600 text-3xl mb-4">🔥</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Modern Stack</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">React 19, TypeScript, and TanStack Router</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Animations</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Stunning effects with Aceternity UI</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/about"
            className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-400 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              About Project
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Learn about the technologies and architecture</p>
          </Link>
          <Link
            to="/todo"
            className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-400 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Todo Manager
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">A full-featured todo application demo</p>
          </Link>
          <Link
            to="/showcase"
            className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-400 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Component Showcase
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Interactive demos of UI components</p>
          </Link>
          <Link
            to="/player"
            className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-400 transition-all duration-200"
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Music Player
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Immersive player with stunning visuals</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
