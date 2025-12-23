import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatsProvider } from "@/lib/chat-store/chats/provider"
import { ChatSessionProvider } from "@/lib/chat-store/session/provider"
import { APP_NAME } from "@/lib/config"
import { ModelProvider } from "@/lib/model-store/provider"
import { TanstackQueryProvider } from "@/lib/tanstack-query/tanstack-query-provider"
import { UserPreferencesProvider } from "@/lib/user-preference-store/provider"
import { UserProvider } from "@/lib/user-store/provider"
import { getUserProfile } from "@/lib/user/api"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import "./globals.css"
import { LayoutClient } from "./layout-client"

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} - Co-pilot for your business.`,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const userProfile = await getUserProfile()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <TanstackQueryProvider>
          {/* <Banner
            id="banner-id"
            className="fixed hidden w-full items-center gap-4 bg-white shadow-lg md:flex dark:bg-transparent"
            // buttonClassName="relative top-unset -translate-y-unset"
            variant="rainbow"
            height="3.5rem"
            // rainbowColors={[
            //   "rgba(231,77,255,0.77)",
            //   "rgba(231,77,255,0.77)",
            //   "transparent",
            //   "rgba(231,77,255,0.77)",
            //   "transparent",
            //   "rgba(231,77,255,0.77)",
            //   "transparent",
            // ]}
          >
            🚀 Project evolving more features soon!
          </Banner> */}
          <LayoutClient />
          <SpeedInsights />
          <UserProvider initialUser={userProfile}>
            <ModelProvider>
              <ChatsProvider userId={userProfile?.id}>
                <ChatSessionProvider>
                  <UserPreferencesProvider
                    userId={userProfile?.id}
                    initialPreferences={userProfile?.preferences}
                  >
                    <TooltipProvider
                      delayDuration={200}
                      skipDelayDuration={500}
                    >
                      <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem
                        disableTransitionOnChange
                      >
                        <SidebarProvider defaultOpen>
                          <Toaster position="top-center" />
                          {children}
                        </SidebarProvider>
                      </ThemeProvider>
                    </TooltipProvider>
                  </UserPreferencesProvider>
                </ChatSessionProvider>
              </ChatsProvider>
            </ModelProvider>
          </UserProvider>
        </TanstackQueryProvider>
      </body>
    </html>
  )
}
