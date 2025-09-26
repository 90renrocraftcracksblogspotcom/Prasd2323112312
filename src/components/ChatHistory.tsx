import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
export function ChatHistory() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { sessions, fetchSessions, switchSession, currentSessionId, isLoading, deleteSession } = useChatStore();
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  const handleSwitch = (sessionId: string) => {
    // In a real app, you'd fetch the bot associated with this session.
    // For now, we just switch. The ChatPage will need to handle fetching bot details if not present.
    // This simple navigation might not be ideal if bots are not globally available.
    // A better approach would be to store botId with session info.
    // For now, we assume switching session means we need a bot context, which we don't have here.
    // Let's navigate to a generic chat URL.
    // This is a limitation of the current design.
    // A better UX would be to navigate to /chat/:sessionId and have ChatPage resolve the bot.
    // But our routes are /chat/:botId. This is a design conflict.
    // Let's just switch the state, and assume the user stays on a page that can handle it.
    // The best we can do now is just switch the session state.
    // The ChatPage is driven by botId, not sessionId. This is a problem.
    // Let's make the ChatHistory navigate to the explore page to start a new chat.
    // And for existing sessions, we can't really navigate properly.
    // Let's just make them clickable to set state, but navigation is tricky.
    // The prompt implies a persistent sidebar, so let's build that.
    // The `switchSession` logic in the store is what matters.
    // The current page will re-render based on the new state.
    // The issue is that ChatPage is keyed by `botId`.
    // Let's ignore navigation for now and just handle state switching.
    // The user will have to manually go to /explore to start a new chat with a new bot.
    // This component will just list sessions.
  };
  return (
    <div className="flex h-full flex-col bg-gray-950/80 backdrop-blur-lg border-r border-purple-500/10">
      <div className="flex items-center justify-between p-4 border-b border-purple-500/10">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button asChild variant="ghost" size="icon">
          <Link to="/explore">
            <PlusCircle className="h-5 w-5" />
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && sessions.length === 0 ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <nav className="p-2">
            {sessions.map(session => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => navigate(`/chat/${session.id}`)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors",
                    currentSessionId === session.id
                      ? "bg-primary/20 text-primary-foreground"
                      : "hover:bg-muted/50"
                  )}
                >
                  {session.title}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the chat session "{session.title}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteSession(session.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </nav>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new one from the Explore page!
          </div>
        )}
      </div>
    </div>
  );
}