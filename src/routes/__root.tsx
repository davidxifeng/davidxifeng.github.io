import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import ThemeProvider from '../components/ThemeProvider'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <div className="grid grid-rows-[auto_1fr] h-screen overflow-hidden">
        <Header />
        <main className="overflow-auto">
          <Outlet />
        </main>
      </div>
      <TanstackDevtools
        config={{
          position: 'bottom-left',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </ThemeProvider>
  ),
})
