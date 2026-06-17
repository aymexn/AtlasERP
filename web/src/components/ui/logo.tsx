'use client';

import Image from 'next/image';
import { Link } from '@/navigation';

interface LogoProps {
  variant?: 'full' | 'icon-only';
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ variant = 'full', width, height, className = '' }: LogoProps) {
  if (variant === 'icon-only') {
    return (
      <Link href="/dashboard" className={`flex items-center ${className}`}>
        <Image
          src="/assets/brand/atlas-icon.png"
          alt="Atlas Icon"
          width={width || 40}
          height={height || 40}
          priority
        />
      </Link>
    );
  }

  return (
    <Link href="/dashboard" className={`flex items-center ${className}`}>
      <Image
        src="/assets/brand/LOGO_2.png"
        alt="AtlasERP Logo"
        width={width || 130}
        height={height || 36}
        priority
        className="object-contain"
      />
    </Link>
  );
}
