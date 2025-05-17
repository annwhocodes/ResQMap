import React, { useState } from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  name,
  disabled = false,
  variant = 'primary',
  className = '',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600';
      case 'danger':
        return 'bg-danger-600';
      case 'warning':
        return 'bg-warning-600';
      case 'success':
        return 'bg-success-600';
      default:
        return 'bg-primary-600';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          disabled={disabled}
          name={name}
          aria-label={label}
        />
        <div
          className={`
            w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-2 
            peer-focus:ring-primary-300 rounded-full peer 
            peer-checked:after:translate-x-full peer-checked:after:border-white 
            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
            after:bg-white after:border-gray-300 after:border after:rounded-full 
            after:h-5 after:w-5 after:transition-all
            peer-checked:${getVariantClasses()}
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
          `}
        ></div>
        <span className="ml-3 text-sm font-medium text-gray-900 select-none">
          {label}
        </span>
      </label>
    </div>
  );
};

export default Toggle;