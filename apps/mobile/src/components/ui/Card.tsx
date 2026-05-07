import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends ViewProps {
  className?: string;
  variant?: 'default' | 'flat' | 'outline';
}

export const Card = ({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) => {
  const variantStyles = {
    default: 'bg-surface shadow-[0_4px_12px_rgba(17,17,17,0.08)]',
    flat: 'bg-surface',
    outline: 'bg-transparent border border-border',
  };

  return (
    <View 
      className={cn(
        'rounded-2xl overflow-hidden', // 16px radius
        variantStyles[variant],
        className
      )} 
      {...props}
    >
      {children}
    </View>
  );
};
