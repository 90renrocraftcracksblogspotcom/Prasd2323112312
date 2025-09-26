import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Wand2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBot, getMyBots, Bot as BotType } from "@/lib/bots";
import { Toaster, toast } from "sonner";
import { useChatStore } from "@/stores/chat-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(50, {
    message: "Name must not be longer than 50 characters.",
  }),
  avatar: z.string().url({ message: "Please enter a valid URL." }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(200, {
    message: "Description must not be longer than 200 characters.",
  }),
  greeting: z.string().min(10, {
    message: "Greeting must be at least 10 characters.",
  }).max(500, {
    message: "Greeting must not be longer than 500 characters.",
  }),
  persona: z.string().min(20, {
    message: "Persona must be at least 20 characters.",
  }).max(2000, {
    message: "Persona must not be longer than 2000 characters.",
  }),
});
export function ForgePage() {
  const navigate = useNavigate();
  const startNewSession = useChatStore((state) => state.startNewSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myBots, setMyBots] = useState<BotType[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      avatar: "",
      description: "",
      greeting: "",
      persona: "",
    },
  });
  const fetchMyBots = async () => {
    setIsLoadingBots(true);
    const bots = await getMyBots();
    setMyBots(bots);
    setIsLoadingBots(false);
  };
  useEffect(() => {
    fetchMyBots();
  }, []);
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    toast.loading("Forging your character...");
    const newBot = await createBot(values);
    if (newBot) {
      toast.success(`${newBot.name} has been created!`);
      await fetchMyBots(); // Refresh the list of user's bots
      form.reset();
      const sessionId = await startNewSession(newBot);
      if (sessionId) {
        setTimeout(() => {
          navigate(`/chat/${sessionId}`);
        }, 1000);
      } else {
        toast.error("Could not start a chat session. Please find your character in your list below.");
        setIsSubmitting(false);
      }
    } else {
      toast.error("Failed to create character. Please try again.");
      setIsSubmitting(false);
    }
  }
  return (
    <>
      <Toaster theme="dark" position="bottom-right" />
      <div className="relative min-h-screen w-full bg-gray-950 text-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Wand2 className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-5xl font-bold tracking-tighter">The Character Forge</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Breathe life into a new entity. Define its name, appearance, and the very essence of its being.
            </p>
          </motion.header>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="bg-purple-950/10 backdrop-blur-lg border border-purple-500/10">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Your Creations
                </CardTitle>
                <CardDescription>
                  A list of all the characters you have forged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBots ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                ) : myBots.length > 0 ? (
                  <div className="space-y-2">
                    {myBots.map(bot => (
                      <div key={bot.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={bot.avatar} />
                            <AvatarFallback>{bot.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{bot.name}</p>
                            <p className="text-sm text-muted-foreground">{bot.description}</p>
                          </div>
                        </div>
                        <Button variant="secondary" onClick={async () => {
                          const sessionId = await startNewSession(bot);
                          if (sessionId) navigate(`/chat/${sessionId}`);
                        }}>Chat</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">You haven't created any characters yet. Forge one below!</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-purple-950/10 backdrop-blur-lg border border-purple-500/10 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bot className="h-6 w-6" />
                  Character Blueprint
                </CardTitle>
                <CardDescription>
                  Fill in the details below to create your new AI companion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Luna, the Astral Seer" {...field} className="bg-gray-900" />
                            </FormControl>
                            <FormDescription>Your character's public name.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Avatar URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/avatar.png" {...field} className="bg-gray-900" />
                            </FormControl>
                            <FormDescription>A direct link to an image for your character.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="A one-sentence summary that appears on character cards."
                              className="resize-none bg-gray-900"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>This will be shown in the explore page.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="greeting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Greeting Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="The first thing your character says to a user."
                              className="resize-y bg-gray-900"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Make a strong first impression.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="persona"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Persona (System Prompt)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your character's personality, backstory, speaking style, and any rules they must follow. This is the most important part!"
                              className="resize-y bg-gray-900 min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This is the core instruction set for the AI. Be detailed and specific.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting} size="lg">
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                            Creating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Create Character
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}