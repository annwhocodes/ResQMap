import React from 'react';
import { Loader2 } from 'lucide-react';  // spinner icon

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  active?: boolean;
  loading?: boolean;   // spinner flag
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  icon,
  type = 'button',
  active = false,
  loading = false,
}) => {
  // When loading, we still want the button to look normal and enabled (unless disabled=true)
  const isDisabled = disabled;

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `${active ? 'bg-primary-700' : 'bg-primary-600'} hover:bg-primary-700 text-white focus:ring-primary-500`;
      case 'danger':
        return `${active ? 'bg-danger-700' : 'bg-danger-600'} hover:bg-danger-700 text-white focus:ring-danger-500`;
      case 'warning':
        return `${active ? 'bg-warning-700' : 'bg-warning-600'} hover:bg-warning-700 text-white focus:ring-warning-500`;
      case 'success':
        return `${active ? 'bg-success-700' : 'bg-success-600'} hover:bg-success-700 text-white focus:ring-success-500`;
      case 'outline':
        return `border ${active ? 'bg-neutral-100 border-neutral-400' : 'border-neutral-300 bg-white'} hover:bg-neutral-50 text-neutral-700 focus:ring-primary-500`;
      default:
        return `${active ? 'bg-primary-700' : 'bg-primary-600'} hover:bg-primary-700 text-white focus:ring-primary-500`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-2.5 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2.5 text-base';
    }
  };

  return (
    <button
      type={type}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${active ? 'shadow-inner' : ''}
        rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
        transition duration-150 ease-in-out
        flex items-center justify-center
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isDisabled}
      onClick={onClick}
      aria-pressed={active}
    >
      {/* Spinner (if loading), but do NOT hide text or icon */}
      {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}

      {/* Your usual icon */}
      {!loading && icon && <span className="mr-2">{icon}</span>}

      {/* Always show the button text */}
      {children}
    </button>
  );
};

export default Button;
