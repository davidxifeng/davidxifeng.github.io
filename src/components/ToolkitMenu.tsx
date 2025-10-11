import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wrench, Music, BookOpen, Check, Server } from 'lucide-react';

const toolkitItems = [
  {
    to: '/jpad',
    icon: BookOpen,
    label: 'Japanese Reader',
    description: '日本語を読もう！',
  },
  {
    to: '/test',
    icon: Server,
    label: 'API test',
    description: 'OpenAPI client',
  },
  {
    to: '/player',
    icon: Music,
    label: 'Player',
    description: '音乐播放器',
  },
];

export default function ToolkitMenu() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent data-[state=open]:bg-accent data-[state=open]:text-primary"
        >
          <Wrench className="h-4 w-4 mr-2" />
          Toolkit
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[200px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200 dark:border-slate-700"
        sideOffset={8}
      >
        {toolkitItems.map(item => {
          const IconComponent = item.icon;
          const isActive = currentPath === item.to;

          return (
            <DropdownMenuItem key={item.to} asChild className="p-0">
              <Link
                to={item.to}
                className={`
                  flex items-center gap-3 px-3 py-3 cursor-pointer w-full
                  transition-all duration-200
                  hover:bg-accent hover:text-accent-foreground
                  focus:bg-accent focus:text-accent-foreground
                  ${isActive ? 'bg-accent/50' : ''}
                  group
                `}
              >
                <div className="relative flex items-center justify-center w-4 h-4">
                  <IconComponent className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  {isActive && (
                    <Check className="h-3 w-3 absolute -top-1 -right-2 text-primary animate-in zoom-in-75 duration-200" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </div>
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
