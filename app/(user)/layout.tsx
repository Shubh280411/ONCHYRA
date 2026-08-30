'use client';

import { ReactNode } from 'react';
import UserLayout from '@/components/user/UserLayout';

export default function UserGroupLayout({ children }: { children: ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
