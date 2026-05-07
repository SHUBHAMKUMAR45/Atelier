import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Typography } from './Typography';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends TextInputProps {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: { label: string; onPress: () => void };
  error?: string;
  className?: string;
}

export const Input = ({
  label,
  leftIcon,
  rightIcon,
  rightAction,
  error,
  className,
  ...props
}: InputProps) => {
  return (
    <View className={cn('mb-4', className)}>
      {label && (
        <View className="flex-row justify-between mb-2 ml-1">
          <Typography variant="bodyBold" className="text-secondary">{label}</Typography>
          {rightAction && (
            <Typography 
              variant="bodyBold" 
              className="text-primary" 
              onPress={rightAction.onPress}
            >
              {rightAction.label}
            </Typography>
          )}
        </View>
      )}
      <View className={cn(
        'h-14 rounded-2xl border bg-white flex-row items-center px-4',
        error ? 'border-error' : 'border-border'
      )}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 font-dmsans text-base text-primary h-full"
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && (
        <Typography variant="caption" className="text-error mt-1 ml-1">{error}</Typography>
      )}
    </View>
  );
};
