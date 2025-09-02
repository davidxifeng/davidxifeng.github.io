import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

const technologies = [
  {
    category: "Frontend Framework",
    items: [
      { name: "React 19", description: "Latest React with concurrent features and improved performance" },
      { name: "TypeScript", description: "Static type checking for better development experience" },
    ]
  },
  {
    category: "Build Tools",
    items: [
      { name: "Vite", description: "Lightning-fast build tool and development server" },
      { name: "Bun", description: "All-in-one JavaScript runtime and package manager" },
    ]
  },
  {
    category: "Routing",
    items: [
      { name: "TanStack Router", description: "Type-safe routing with file-based conventions" },
    ]
  },
  {
    category: "Styling",
    items: [
      { name: "Tailwind CSS v4", description: "Utility-first CSS framework with new Vite plugin" },
      { name: "Shadcn/ui", description: "Beautiful, accessible component library" },
      { name: "Aceternity UI", description: "Stunning animated components and effects" },
    ]
  },
  {
    category: "State Management",
    items: [
      { name: "Zustand", description: "Lightweight state management solution" },
    ]
  },
  {
    category: "Testing",
    items: [
      { name: "Vitest", description: "Fast unit testing framework" },
      { name: "React Testing Library", description: "Testing utilities for React components" },
    ]
  },
]

const features = [
  "🚀 Lightning-fast development with Vite and Bun",
  "🎨 Beautiful UI components with Shadcn/ui and Aceternity UI",
  "🔥 File-based routing with TanStack Router",
  "⚡ Auto-code splitting and performance optimization",
  "🎭 Stunning animations and visual effects",
  "🧪 Comprehensive testing setup with Vitest",
  "📱 Fully responsive design",
  "🎯 Type-safe development experience"
]

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About This Project
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A comprehensive playground showcasing modern React development with cutting-edge tools, 
            beautiful UI components, and best practices for building scalable web applications.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Technology Stack</h2>
          <div className="space-y-12">
            {technologies.map((category) => (
              <div key={category.category} className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-slate-600 pb-2">
                  {category.category}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {category.items.map((tech) => (
                    <div key={tech.name} className="flex items-start space-x-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{tech.name}</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{tech.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Structure */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Project Architecture</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">File-Based Routing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                TanStack Router automatically generates routes based on files in the <code className="bg-gray-100 px-2 py-1 rounded text-sm">src/routes/</code> directory, 
                providing type-safe navigation and excellent developer experience.
              </p>
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100">
                <div>src/routes/</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── __root.tsx</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── index.tsx</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── about.tsx</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── todo.tsx</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── showcase.tsx</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">└── player.tsx</div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Component Organization</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Components are organized by feature and reusability, with UI components from Shadcn/ui 
                providing a consistent design system throughout the application.
              </p>
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100">
                <div>src/components/</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── ui/ (shadcn/ui components)</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">├── Header.tsx</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">└── ...</div>
                <div className="mt-2">src/lib/</div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">└── utils.ts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Development Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
          <p className="text-blue-100 mb-6">
            This project demonstrates best practices for modern React development. 
            Explore the different pages to see various features in action.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <code>bun run dev</code> - Start development server
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <code>bun run test</code> - Run tests
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <code>bun run build</code> - Build for production
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}