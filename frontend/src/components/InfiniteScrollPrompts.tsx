import { Car, Home, UtensilsCrossed, Plane, Newspaper, MapPin, Building2, Hotel, Package, CloudSun, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InfiniteScrollPromptsProps {
  onPromptSelect: (prompt: string) => void;
}

interface Prompt {
  icon: LucideIcon;
  textKey: string;
  category: string;
}

const InfiniteScrollPrompts = ({ onPromptSelect }: InfiniteScrollPromptsProps) => {
  const { t } = useTranslation();

  const prompts: Prompt[] = [
    { icon: Car, textKey: "prompts.carRental", category: "Cars" },
    { icon: Car, textKey: "prompts.carSale", category: "Cars" },
    { icon: Car, textKey: "prompts.usedCars", category: "Cars" },
    { icon: Home, textKey: "prompts.rentApartment", category: "Housing" },
    { icon: Building2, textKey: "prompts.buyHouse", category: "Housing" },
    { icon: Home, textKey: "prompts.studentAccommodation", category: "Housing" },
    { icon: UtensilsCrossed, textKey: "prompts.nearbyRestaurants", category: "Food" },
    { icon: UtensilsCrossed, textKey: "prompts.bestRestaurants", category: "Food" },
    { icon: Package, textKey: "prompts.foodDelivery", category: "Food" },
    { icon: Plane, textKey: "prompts.flightBooking", category: "Travel" },
    { icon: Hotel, textKey: "prompts.hotelReservation", category: "Travel" },
    { icon: MapPin, textKey: "prompts.vacationPackages", category: "Travel" },
    { icon: Newspaper, textKey: "prompts.dailyNews", category: "News" },
    { icon: Newspaper, textKey: "prompts.localNews", category: "News" },
    { icon: CloudSun, textKey: "prompts.weatherUpdate", category: "Weather" },
  ];

  const firstLine = prompts.slice(0, 5);
  const secondLine = prompts.slice(5, 10);
  const thirdLine = prompts.slice(10, 15);

  const PromptButton = ({ prompt, index }: { prompt: Prompt; index: number }) => {
    const Icon = prompt.icon;
    const translatedText = t(prompt.textKey);
    
    return (
      <button
        onClick={() => onPromptSelect(translatedText)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-sm mr-2 last:mr-0"
      >
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-white">{translatedText}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-center text-gray-900 dark:text-white font-semibold text-base md:text-lg mb-6">
        {t('common.whatCanIHelp')}
      </h3>
      
      {/* First line - moving left */}
      <div className="relative overflow-hidden">
        <div className="flex animate-[scroll-left_25s_linear_infinite] will-change-transform">
          {[...firstLine, ...firstLine, ...firstLine, ...firstLine].map((prompt, index) => (
            <PromptButton key={`line1-${index}`} prompt={prompt} index={index} />
          ))}
        </div>
      </div>

      {/* Second line - moving right */}
      <div className="relative overflow-hidden">
        <div className="flex animate-[scroll-right_30s_linear_infinite] will-change-transform">
          {[...secondLine, ...secondLine, ...secondLine, ...secondLine].map((prompt, index) => (
            <PromptButton key={`line2-${index}`} prompt={prompt} index={index} />
          ))}
        </div>
      </div>

      {/* Third line - moving left */}
      <div className="relative overflow-hidden">
        <div className="flex animate-[scroll-left_35s_linear_infinite] will-change-transform">
          {[...thirdLine, ...thirdLine, ...thirdLine, ...thirdLine].map((prompt, index) => (
            <PromptButton key={`line3-${index}`} prompt={prompt} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfiniteScrollPrompts;
