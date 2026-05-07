import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { Typography } from './Typography';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  loading?: boolean;
  className?: string;
  labelClassName?: string;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  label,
  loading,
  className,
  labelClassName,
  disabled,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-primary',
    secondary: 'bg-muted',
    outline: 'border border-border bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-8 py-4',
    lg: 'px-10 py-5',
  };

  const labelVariants = {
    primary: 'text-white',
    secondary: 'text-primary',
    outline: 'text-primary',
    ghost: 'text-primary',
  };

  return (
    <TouchableOpacity
      className={cn(
        'rounded-full flex-row items-center justify-center',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50',
        className
      )}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#111111'} size="small" />
      ) : (
        <Typography 
          variant="label" 
          className={cn(labelVariants[variant], labelClassName)}
        >
          {label}
        </Typography>
      )}
    </TouchableOpacity>
  );
};
