import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { listBots, Bot as BotType } from '@/lib/bots';
import { useAuth } from '@clerk/clerk-react';
export function HomePage() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const startNewSession = useChatStore((state) => state.startNewSession);
  const { isSignedIn } = useAuth();
  useEffect(() => {
    const fetchBots = async () => {
      setLoading(true);
      const allBots = await listBots();
      // For the home page, we'll feature the first 4 bots.
      setBots(allBots.slice(0, 4));
      setLoading(false);
    };
    fetchBots();
  }, []);
  const handleChatNow = async (bot: BotType) => {
    if (!isSignedIn) {
      navigate('/signin');
      return;
    }
    const sessionId = await startNewSession(bot);
    if (sessionId) {
      navigate(`/chat/${sessionId}`);
    }
  };
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-gray-50">
      {/* Aurora Background */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 [--aurora:repeating-linear-gradient(100deg,var(--purple-500)_10%,var(--purple-600)_15%,var(--purple-700)_20%,var(--purple-800)_25%,var(--purple-900)_30%)] [background-image:var(--aurora)] [background-size:300%_300%] animate-aurora"
        style={{ filter: 'blur(50px) opacity(0.15)' }}
      />
      <div className="absolute inset-0 bg-gray-950/50" />
      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <main className="flex-1 w-full max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center py-24 sm:py-32"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-50 to-gray-400">
              Step into New Realities
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              Discover and chat with unique AI characters. Create your own, and bring your stories to life in Aetherium, an immersive AI role-playing platform.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-purple-glow">
                <Link to="/explore">Start Chatting</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/forge">Create a Character</Link>
              </Button>
            </div>
          </motion.section>
          {/* Featured Characters Section */}
          <section className="py-16">
            <h3 className="text-3xl font-bold text-center mb-12">Featured Characters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-purple-950/10 border border-purple-500/10">
                    <CardHeader className="flex-row items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-[100px]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))
              ) : (
                bots.map((bot, index) => (
                  <motion.div
                    key={bot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full flex flex-col bg-purple-950/10 backdrop-blur-lg border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-purple-glow">
                      <CardHeader className="flex-row items-center gap-4">
                        <Avatar>
                          <AvatarImage src={bot.avatar} alt={bot.name} />
                          <AvatarFallback>{bot.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{bot.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground text-sm">{bot.description}</p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => handleChatNow(bot)}
                        >
                          Chat Now
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </main>
        <footer className="w-full max-w-7xl mx-auto py-6 text-center text-muted-foreground text-sm">
          <p>Built with ❤️ at Cloudflare</p>
        </footer>
      </div>
    </div>
  );
}