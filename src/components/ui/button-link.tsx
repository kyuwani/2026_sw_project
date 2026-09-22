import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  className,
  size = "md",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ variant, size, className })}
      {...props}
    />
  );
}
