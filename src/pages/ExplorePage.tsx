import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bot, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { listBots, Bot as BotType } from '@/lib/bots';
import { useChatStore } from '@/stores/chat-store';
import { useAuth } from '@clerk/clerk-react';
export function ExplorePage() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const startNewSession = useChatStore((state) => state.startNewSession);
  const { isSignedIn } = useAuth();
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
  useEffect(() => {
    const fetchBots = async () => {
      setLoading(true);
      const fetchedBots = await listBots();
      setBots(fetchedBots);
      setLoading(false);
    };
    fetchBots();
  }, []);
  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="relative min-h-screen w-full bg-gray-950 text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">Explore Characters</h1>
            <p className="text-muted-foreground mt-2">Discover new personalities to chat with.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search characters..."
              className="w-full pl-10 bg-gray-900 border-purple-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.header>
        <main>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-purple-950/10 border border-purple-500/10">
                  <CardHeader className="flex-row items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {filteredBots.map((bot) => (
                <motion.div
                  key={bot.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full flex flex-col bg-purple-950/10 backdrop-blur-lg border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-purple-glow">
                    <CardHeader className="flex-row items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={bot.avatar} alt={bot.name} />
                        <AvatarFallback>{bot.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <CardTitle>{bot.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground text-sm line-clamp-3">{bot.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="secondary" onClick={() => handleChatNow(bot)}>
                        <Bot className="mr-2 h-4 w-4" /> Chat Now
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
          {!loading && filteredBots.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No characters found matching your search.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}