"use client";

import React, { useState, useEffect } from "react";

interface SlotMachineProps {
  items: string[];
  isSpinning: boolean;
  finalItem?: string;
  slotIndex: number;
}

const SlotMachine: React.FC<SlotMachineProps> = ({
  items,
  isSpinning,
  finalItem,
  slotIndex,
}) => {
  const [currentItem, setCurrentItem] = useState<string>("");
  const [spinCount, setSpinCount] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        setCurrentItem(randomItem);
        setSpinCount((prev) => prev + 1);
      }, 100);

      return () => clearInterval(interval);
    } else if (finalItem) {
      setCurrentItem(finalItem);
    } else {
      // Clear the item when finalItem is undefined
      setCurrentItem("");
    }
  }, [isSpinning, finalItem, items]);

  return (
    <div
      className={`
        relative h-32 w-full rounded-lg border-4 
        ${isSpinning ? "border-orange-500 animate-pulse" : "border-purple-600"}
        bg-gradient-to-br from-purple-900/50 to-black/50
        flex items-center justify-center
        overflow-hidden
        transition-all duration-300
      `}
      style={{
        animationDelay: `${slotIndex * 0.1}s`,
      }}
    >
      {/* Lightning effect when spinning */}
      {isSpinning && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent animate-pulse" />
      )}

      {/* Content */}
      <div className="relative z-10 px-4 text-center">
        {currentItem ? (
          <p
            className={`
              text-lg font-bold
              ${isSpinning ? "text-orange-400 animate-bounce" : "text-green-400"}
              transition-all duration-300
            `}
          >
            {currentItem}
          </p>
        ) : (
          <p className="text-gray-500 text-sm">???</p>
        )}
      </div>

      {/* Slot number indicator */}
      <div className="absolute top-2 left-2 text-xs text-purple-400 font-mono">
        #{slotIndex + 1}
      </div>
    </div>
  );
};

interface ItemWithDetails {
  name: string;
  description?: string;
  category?: string;
}

interface FrankensteinSlotMachineProps {
  allItems: string[];
  selectedItems: string[];
  isSpinning: boolean;
  slotCount: number;
  itemsWithDetails?: ItemWithDetails[];
}

import { useLocale } from "@/features/locale/context/LocaleContext";

export const FrankensteinSlotMachine: React.FC<
  FrankensteinSlotMachineProps
> = ({ allItems, selectedItems, isSpinning, slotCount, itemsWithDetails }) => {
  const { t } = useLocale();
  
  // Find details for a selected item
  const getItemDetails = (itemName: string): ItemWithDetails | undefined => {
    return itemsWithDetails?.find(item => item.name === itemName);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-orange-500 mb-2">
          🧪 {t('frankensteinLaboratory') || 'Frankenstein Laboratory'} 🧪
        </h3>
        <p className="text-purple-300 text-sm">
          {isSpinning
            ? `⚡ ${t('combiningTechnologies') || 'Combining technologies...'} ⚡`
            : selectedItems.length > 0
            ? `✨ ${t('combinationReady') || 'Combination ready!'} ✨`
            : t('awaitingActivation') || 'Awaiting activation...'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: slotCount }).map((_, index) => {
          const selectedItem = selectedItems[index];
          const itemDetails = selectedItem ? getItemDetails(selectedItem) : undefined;
          const showDetails = !isSpinning && selectedItem && itemDetails;

          return showDetails ? (
            // Enhanced card with link button when not spinning
            <div
              key={index}
              className="relative"
            >
              <div
                className="relative h-32 w-full rounded-lg border-4 border-purple-600 bg-gradient-to-br from-purple-900/50 to-black/50 flex items-center justify-center overflow-hidden transition-all duration-300"
              >
                {/* Slot number indicator */}
                <div className="absolute top-2 left-2 text-xs text-purple-400 font-mono bg-black/50 px-2 py-1 rounded">
                  #{index + 1}
                </div>

                {/* Link button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedItem)}`;
                    window.open(searchUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-purple-700/90 rounded-full flex items-center justify-center text-xs border border-orange-500/40 hover:bg-orange-500 hover:border-orange-400 hover:scale-110 transition-all z-10"
                  aria-label={`Learn more about ${selectedItem}`}
                  title="Learn more"
                >
                  <span className="opacity-80 hover:opacity-100">🔗</span>
                </button>

                {/* Content */}
                <div className="relative z-10 px-4 text-center">
                  <p className="text-lg font-bold text-green-400 transition-all duration-300 line-clamp-2">
                    {selectedItem}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Regular slot machine when spinning or no details
            <SlotMachine
              key={index}
              items={allItems}
              isSpinning={isSpinning}
              finalItem={selectedItems[index]}
              slotIndex={index}
            />
          );
        })}
      </div>
    </div>
  );
};
