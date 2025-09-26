# Aetherium
An immersive, AI-powered role-playing platform for creating, discovering, and interacting with unique digital characters.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/90renrocraftcracksblogspotcom/rizzbeta)
Aetherium is a sophisticated, visually stunning, and immersive AI-powered role-playing platform. It allows users to create, discover, and interact with unique digital characters in a rich chat-based environment. The platform is designed with a 'less is more' philosophy, focusing on clean layouts, atmospheric design, and intuitive user flows. The entire experience is wrapped in a breathtaking black and purple, mobile-first interface, leveraging modern design principles like glassmorphism, subtle gradients, and fluid animations to create a premium user experience.
## Key Features
-   **User Authentication:** Secure sign-up, sign-in, and user management powered by Clerk.
-   **Immersive AI Chat:** Engage in rich, streaming conversations with unique AI characters.
-   **Character Hub:** Discover, browse, and search a gallery of public AI bots.
-   **Character Forge:** A user-friendly interface to create and customize your own AI characters, defining their name, avatar, persona, and system prompts.
-   **Secure Backend:** Powered by Cloudflare Workers, which securely proxy requests to the NVIDIA API, ensuring API keys are never exposed on the client-side.
-   **Stunning Visuals:** A beautiful black and purple theme with glassmorphism effects, subtle gradients, and fluid animations.
-   **User Personalization:** A dedicated settings area to manage your application preferences and even use your own proxied API keys.
-   **Responsive Perfection:** Flawless layouts and interactions across all device sizes, from mobile to desktop.
## Technology Stack
-   **Frontend:** React, Vite, TypeScript
-   **Authentication:** Clerk
-   **Styling:** Tailwind CSS, shadcn/ui
-   **Animation:** Framer Motion
-   **State Management:** Zustand
-   **Backend:** Cloudflare Workers, Hono
-   **Icons:** Lucide React
-   **Schema Validation:** Zod
## Getting Started
Follow these instructions to get a local copy of the project up and running for development and testing purposes.
### Prerequisites
-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/) package manager
-   A Cloudflare account
-   A Clerk account
### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/aetherium_rp.git
    cd aetherium_rp
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```
3.  **Configure Environment Variables:**
    Create a `.dev.vars` file in the root of the project for local development. This file is used by Wrangler to load environment variables.
    ```ini
    # .dev.vars
    # Clerk Authentication Keys (get from your Clerk dashboard)
    VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
    CLERK_SECRET_KEY="sk_test_..."
    # NVIDIA API Key (serves as the platform's default key)
    NVIDIA_API_KEY="YOUR_NVIDIA_API_KEY"
    ```
    -   **Clerk:** Sign up for a free account at [Clerk.dev](https://clerk.com/) and create a new application. You will find your Publishable Key and Secret Key in the API Keys section of your dashboard.
    -   **NVIDIA:** Get an API key from the [NVIDIA API catalog](https://build.nvidia.com/explore/discover). This key is used as the default for users who do not provide their own.
## Development
To start the local development server, which includes both the Vite frontend and the Cloudflare Worker backend, run the following command:
```bash
bun run dev
```
This will start the application, typically on `http://localhost:3000`. The frontend will auto-update as you edit the files. The worker backend also supports hot-reloading.
## Deployment
This project is designed for seamless deployment to Cloudflare Pages.
1.  **Login to Cloudflare:**
    If you haven't already, authenticate Wrangler with your Cloudflare account.
    ```bash
    bunx wrangler login
    ```
2.  **Deploy the application:**
    Run the deploy script. This command will build the frontend application and deploy it along with the Worker to your Cloudflare account.
    ```bash
    bun run deploy
    ```
3.  **Configure Production Secrets:**
    After deploying, you must add your production secrets to the Cloudflare dashboard.
    -   Go to your Cloudflare Dashboard.
    -   Navigate to **Workers & Pages** and select your deployed application.
    -   Go to **Settings** > **Environment variables**.
    -   Under **Worker secrets**, click **Add secret** for each of the following:
        -   `NVIDIA_API_KEY`: Your NVIDIA API key.
        -   `CLERK_SECRET_KEY`: Your **production** Clerk Secret Key.
    -   Under **Environment variables**, click **Add variable** for the following:
        -   `VITE_CLERK_PUBLISHABLE_KEY`: Your **production** Clerk Publishable Key.
4.  **Deploy with a single click:**
    [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/90renrocraftcracksblogspotcom/rizzbeta)
## Project Structure
-   `src/`: Contains the frontend React application source code.
    -   `pages/`: Page components for each view (Home, Chat, etc.).
    -   `components/`: Reusable React components, including shadcn/ui components.
    -   `lib/`: Client-side utility functions and API services.
-   `worker/`: Contains the backend Cloudflare Worker source code built with Hono.
    -   `userRoutes.ts`: Defines the API endpoints for the application.
    -   `auth.ts`: Contains the Clerk authentication middleware.
    -   `index.ts`: The entry point for the Cloudflare Worker.
## Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
## License
Distributed under the MIT License. See `LICENSE` for more information.