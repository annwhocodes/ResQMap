import React, { useState, useRef, useEffect } from 'react';
import { SHADOWS } from '../../constants/theme';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <div
        ref={dropdownRef}
        className={`
          relative w-full cursor-default rounded-lg bg-white py-2.5 pl-3 pr-10 text-left 
          border border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-1 
          focus:ring-primary-500 shadow-sm
          ${disabled ? 'bg-neutral-100 opacity-75 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="block truncate">
          {selectedOption ? (
            <div className="flex items-center">
              {selectedOption.icon && <span className="mr-2">{selectedOption.icon}</span>}
              {selectedOption.label}
            </div>
          ) : (
            <span className="text-neutral-500">{placeholder}</span>
          )}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="h-5 w-5 text-neutral-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M7 7l3 3 3-3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg
            max-h-60 overflow-auto focus:outline-none py-1
          `}
          style={{ boxShadow: SHADOWS.lg }}
        >
          <div className="py-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`
                  flex items-center px-3 py-2 text-sm cursor-pointer 
                  hover:bg-primary-100 
                  ${value === option.value ? 'bg-primary-50 text-primary-900' : 'text-neutral-900'}
                `}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;