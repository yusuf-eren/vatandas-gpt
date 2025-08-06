import React from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();

  return (
    <ChatProvider>
    <SidebarProvider>
        <div className="mobile-height flex w-full bg-white dark:bg-slate-900 overflow-hidden">
        <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            <header className="h-14 sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger 
                      className="inline-flex rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 active:opacity-50 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                      style={{ outline: 'none', boxShadow: 'none' }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle sidebar (⌘+B)</p>
                  </TooltipContent>
                </Tooltip>
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-gray-800 dark:from-slate-300 dark:to-gray-400 tracking-tight">
                  {t('sidebar.appName')}
                </h1>
            </div>
              <LanguageSwitcher />
          </header>
            <main className="flex-1 min-h-0 relative">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </ChatProvider>
  );
}
