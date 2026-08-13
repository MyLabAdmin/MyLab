import Image from "next/image";
import { brand } from "@/styles/brand";

type LogoSize = keyof typeof brand.assets.logo.sizes;

type LogoProps = {
  size?: LogoSize;
  priority?: boolean;
  className?: string;
};

export function Logo({
  size = "md",
  priority = false,
  className,
}: LogoProps) {
  const dimension = brand.assets.logo.sizes[size];

  return (
    <Image
      src={brand.assets.logo.src}
      alt={brand.assets.logo.alt}
      width={dimension}
      height={dimension}
      priority={priority}
      className={className}
    />
  );
}
