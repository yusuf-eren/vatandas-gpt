import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Car,
  Newspaper,
  UtensilsCrossed,
  ChevronDown,
  Globe,
} from 'lucide-react';

export interface Tool {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

interface ToolSelectorProps {
  selectedTool: string;
  onToolSelect: (toolId: string) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  selectedTool,
  onToolSelect,
  showDropdown,
  onToggleDropdown,
}) => {
  const { t } = useTranslation();

  const tools: Tool[] = [
    {
      id: 'general',
      icon: Globe,
      label: t('tools.general'),
      description: t('tools.generalDescription'),
    },
    {
      id: 'property',
      icon: Home,
      label: t('tools.property'),
      description: t('tools.propertyDescription'),
    },
    {
      id: 'cars',
      icon: Car,
      label: t('tools.cars'),
      description: t('tools.carsDescription'),
    },
    {
      id: 'news',
      icon: Newspaper,
      label: t('tools.news'),
      description: t('tools.newsDescription'),
    },
    {
      id: 'restaurants',
      icon: UtensilsCrossed,
      label: t('tools.restaurants'),
      description: t('tools.restaurantsDescription'),
    },
  ];

  const getSelectedToolIcon = () => {
    const selectedToolObj = tools.find((tool) => tool.id === selectedTool);
    return selectedToolObj ? selectedToolObj.icon : Globe;
  };

  const getSelectedToolLabel = () => {
    const selectedToolObj = tools.find((tool) => tool.id === selectedTool);
    return selectedToolObj ? selectedToolObj.label : t('tools.general');
  };

  return (
    <div className="flex items-center">
      {/* Desktop: Grouped tool buttons */}
      <div className="hidden md:flex items-center">
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 h-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onToolSelect(tool.id)}
                className={`flex items-center justify-center h-6 px-1.5 rounded-md transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border-[1px] border-blue-300 dark:border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 border-2 border-transparent'
                }`}
                aria-label={tool.label}
                style={{ outline: 'none', boxShadow: 'none' }}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile dropdown selector */}
      <div className="md:hidden relative" data-dropdown-container>
        <button
          type="button"
          onClick={onToggleDropdown}
          className={`flex items-center gap-2 px-3 h-8 rounded-lg border transition-colors outline-none focus:outline-none focus-visible:outline-none ${
            selectedTool !== 'general'
              ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
          style={{ outline: 'none', boxShadow: 'none' }}
        >
          {React.createElement(getSelectedToolIcon(), { className: 'w-4 h-4' })}
          <span className="text-sm font-medium">{getSelectedToolLabel()}</span>
          <ChevronDown className="w-3 h-3 ml-auto" />
        </button>

        {/* Mobile dropup menu */}
        {showDropdown && (
          <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-2xl py-3 z-30 min-w-[220px] max-w-[280px]">
            <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t('tools.selectService')}
              </p>
            </div>
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onToolSelect(tool.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-all outline-none focus:outline-none focus-visible:outline-none ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-3 border-blue-500 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  } ${index === 0 ? 'rounded-t-lg' : ''} ${
                    index === tools.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-800/50'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">{tool.label}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {tool.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolSelector;
