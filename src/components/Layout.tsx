import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bot, Home, Settings, Sparkles, Menu, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatHistory } from './ChatHistory';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Sparkles, label: 'Explore' },
  { href: '/forge', icon: Bot, label: 'Forge' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];
export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith('/chat');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const mainNavLinks = (
    <TooltipProvider>
      {navItems.map(item => (
        <Tooltip key={item.label} delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={item.href}
              className={({ isActive }) => cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                isActive ? "bg-accent text-accent-foreground" : ""
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
  const mobileNavLinks = (
    <>
      {navItems.map(item => (
        <NavLink
          key={item.label}
          to={item.href}
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => cn(
            "flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
            isActive && "bg-muted text-foreground"
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </>
  );
  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-50">
      <div className="flex">
        {/* Desktop Main Navigation */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-purple-500/10 bg-gray-950/50 backdrop-blur-lg sm:flex w-16">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <NavLink
              to="/"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Bot className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">Aetherium</span>
            </NavLink>
            {mainNavLinks}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Button variant="ghost" size="icon" onClick={() => navigate('/signin')}>
                <LogIn className="h-5 w-5" />
              </Button>
            </SignedOut>
          </nav>
        </aside>
        {/* Desktop Chat History Sidebar */}
        <SignedIn>
          {isChatPage && (
            <aside className="fixed inset-y-0 left-16 z-10 hidden w-72 sm:block">
              <ChatHistory />
            </aside>
          )}
        </SignedIn>
        {/* Mobile Header */}
        <header className={cn(
          "sm:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-purple-500/10 bg-gray-950/80 px-4 backdrop-blur-lg",
          isChatPage ? 'justify-start gap-4' : 'justify-between'
        )}>
          <SignedIn>
            {isChatPage ? (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open conversations</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 border-r-purple-500/20">
                  <ChatHistory />
                </SheetContent>
              </Sheet>
            ) : (
              <NavLink to="/" className="flex items-center gap-2 font-semibold">
                <Bot className="h-6 w-6 text-primary" />
                <span>Aetherium</span>
              </NavLink>
            )}
          </SignedIn>
          <SignedOut>
             <NavLink to="/" className="flex items-center gap-2 font-semibold">
                <Bot className="h-6 w-6 text-primary" />
                <span>Aetherium</span>
              </NavLink>
          </SignedOut>
          <Sheet open={isSidebarOpen && !isChatPage} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn(isChatPage && 'hidden')}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <NavLink to="/" className="flex items-center gap-2 mb-4" onClick={() => setIsSidebarOpen(false)}>
                  <Bot className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">Aetherium</span>
                </NavLink>
                {mobileNavLinks}
              </nav>
              <div className="mt-auto">
                <SignedIn>
                  <UserButton showName afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Button className="w-full" onClick={() => { navigate('/signin'); setIsSidebarOpen(false); }}>
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Button>
                </SignedOut>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className={cn(
          "flex-1 transition-all duration-300 sm:pl-16",
          isChatPage ? 'sm:pl-[22rem]' : '',
          "sm:pt-0 pt-14"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}