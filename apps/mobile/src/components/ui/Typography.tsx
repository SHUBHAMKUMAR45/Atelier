import React from 'react';
import { Text, TextProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypographyProps extends TextProps {
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'bodyBold' | 'label' | 'caption';
  className?: string;
}

export const Typography = ({ 
  variant = 'body', 
  className, 
  children, 
  ...props 
}: TypographyProps) => {
  const variantStyles = {
    display: 'font-playfair text-3xl leading-10 text-primary',
    heading: 'font-playfair text-2xl leading-8 text-primary',
    subheading: 'font-dmsans-medium text-lg leading-6 text-primary',
    body: 'font-dmsans text-sm leading-5 text-secondary',
    bodyBold: 'font-dmsans-bold text-sm leading-5 text-primary',
    label: 'font-dmsans-bold text-[11px] tracking-[1.2px] uppercase text-primary',
    caption: 'font-dmsans text-xs text-secondary',
  };

  return (
    <Text 
      className={cn(variantStyles[variant], className)} 
      {...props}
    >
      {children}
    </Text>
  );
};
