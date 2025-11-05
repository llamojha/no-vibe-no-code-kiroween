'use client';

import React from 'react';
import { LocaleProvider } from '@/features/locale/context/LocaleContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
};
