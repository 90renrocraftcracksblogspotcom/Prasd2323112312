import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";
export function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-950 text-gray-50">
      <div
        className="absolute top-0 left-0 right-0 bottom-0 [--aurora:repeating-linear-gradient(100deg,var(--purple-500)_10%,var(--purple-600)_15%,var(--purple-700)_20%,var(--purple-800)_25%,var(--purple-900)_30%)] [background-image:var(--aurora)] [background-size:300%_300%] animate-aurora"
        style={{ filter: 'blur(50px) opacity(0.15)' }}
      />
      <div className="absolute inset-0 bg-gray-950/50" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <SignIn
          path="/signin"
          routing="path"
          signUpUrl="/signup"
          appearance={{
            variables: {
              colorPrimary: '#9333ea',
              colorBackground: '#111827',
              colorText: '#f9fafb',
              colorInputBackground: '#1f2937',
              colorInputText: '#f9fafb',
            },
            elements: {
              card: "bg-gray-950/50 backdrop-blur-lg border border-purple-500/20 shadow-purple-glow",
              socialButtonsBlockButton: "border-purple-500/20 hover:bg-purple-950/20",
              footerActionLink: "text-primary hover:text-primary/80",
            }
          }}
        />
      </motion.div>
    </div>
  );
}