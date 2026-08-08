"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  category?: string;
}

interface CustomSelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  iconColor?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  iconColor = 'text-accent-400',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {label && (
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-accent-400">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white shadow-lg backdrop-blur-xl transition-all hover:border-accent-500 focus:outline-none"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Sparkles className={`h-4 w-4 shrink-0 ${iconColor}`} />
          <span className="truncate">{selectedOption.label}</span>
          {selectedOption.category && (
            <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-2xs font-semibold text-accent-300">
              {selectedOption.category}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${
            isOpen ? 'rotate-180 text-accent-400' : ''
          }`}
        />
      </button>

      {/* Popover List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-accent-500 text-black font-extrabold shadow-md'
                      : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{opt.label}</span>
                    {opt.category && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                          isSelected
                            ? 'bg-black/20 text-black'
                            : 'bg-accent-500/10 text-accent-300'
                        }`}
                      >
                        {opt.category}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
