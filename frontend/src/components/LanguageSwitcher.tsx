import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'tr',
    name: 'Türkçe',
    flag: '🇹🇷',
  },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'sidebar';
}

export function LanguageSwitcher({
  variant = 'default',
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div 
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 h-8 min-h-[32px] cursor-pointer transition-colors outline-none focus:outline-none focus-visible:outline-none"
            role="button"
            tabIndex={0}
            style={{ outline: 'none', boxShadow: 'none' }}
          >
            <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {currentLanguage.name}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`flex items-center gap-3 cursor-pointer ${
                i18n.language === language.code
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : ''
              }`}
            >
              <span className="text-sm">{language.name}</span>
              {i18n.language === language.code && (
                <div className="ml-auto w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors outline-none focus:outline-none focus-visible:outline-none"
          role="button"
          tabIndex={0}
          style={{ outline: 'none', boxShadow: 'none' }}
        >
          <Globe className="w-4 h-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              i18n.language === language.code
                ? 'bg-slate-100 dark:bg-slate-800'
                : ''
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="text-sm">{language.name}</span>
            {i18n.language === language.code && (
              <div className="ml-auto w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
