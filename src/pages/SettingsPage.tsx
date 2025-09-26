import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { KeyRound, Save, Settings, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserApiKey } from "@/hooks/use-user-api-key";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
const settingsSchema = z.object({
  apiKey: z.string().refine(val => val === '' || val.startsWith('nvapi-'), {
    message: "Invalid NVIDIA API key format. It should start with 'nvapi-'. Leave empty to use the platform's key.",
  }),
});
export function SettingsPage() {
  const { apiKey, saveApiKey, clearApiKey, isLoaded } = useUserApiKey();
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      apiKey: "",
    },
  });
  useEffect(() => {
    if (isLoaded && apiKey) {
      form.reset({ apiKey });
    }
  }, [isLoaded, apiKey, form]);
  function onSubmit(values: z.infer<typeof settingsSchema>) {
    if (values.apiKey) {
      saveApiKey(values.apiKey);
      toast.success("API Key saved successfully!");
    } else {
      clearApiKey();
      toast.info("API Key cleared. You will now use the platform's default key.");
    }
  }
  const handleClearKey = () => {
    form.setValue('apiKey', '');
    clearApiKey();
    toast.info("API Key cleared.");
  };
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
            <Settings className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-5xl font-bold tracking-tighter">Settings</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Customize your Aetherium experience and manage your API keys.
            </p>
          </motion.header>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-purple-950/10 backdrop-blur-lg border border-purple-500/10 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <KeyRound className="h-6 w-6" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  You can provide your own NVIDIA API key to use for your chat sessions. If left blank, the platform's default key will be used.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Your NVIDIA API Key</span>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full font-semibold",
                              apiKey ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"
                            )}>
                              {apiKey ? "Custom Key Active" : "Platform Key Active"}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="nvapi-..." {...field} className="bg-gray-900" />
                          </FormControl>
                          <FormDescription>
                            {apiKey
                              ? "Your custom key is being used for all requests."
                              : "Leave blank to use the platform's default key. Your key is stored securely in your browser's local storage."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-4">
                      {apiKey && (
                        <Button type="button" variant="destructive" onClick={handleClearKey}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Key
                        </Button>
                      )}
                      <Button type="submit" size="lg">
                        <Save className="h-5 w-5 mr-2" />
                        Save Settings
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