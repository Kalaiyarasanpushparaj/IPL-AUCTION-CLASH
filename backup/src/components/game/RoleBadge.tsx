'use client';

import { Badge } from '@/components/ui/badge';
import type { Player } from '@/lib/types';
import { cn, getRoleStyles } from '@/lib/utils';

type RoleBadgeProps = {
  role: Player['role'];
  className?: string;
};

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleStyles = getRoleStyles(role);

  return (
    <Badge className={cn(roleStyles.badge, className)}>
      {role}
    </Badge>
  );
}
