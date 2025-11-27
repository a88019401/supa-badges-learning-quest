import React from "react";
import { Button, Card as HeroCard } from "@heroui/react";

export type AppButtonVariant = "solid" | "flat" | "light";
export type AppButtonColor = "primary" | "success" | "danger";

export type AppButtonProps = React.ComponentProps<typeof Button> & {
  variant?: AppButtonVariant;
  color?: AppButtonColor;
  size?: "sm" | "md" | "lg";
};

const colorMap: Record<AppButtonColor, "primary" | "success" | "danger"> = {
  primary: "primary",
  success: "success",
  danger: "danger",
};

export const AppButton: React.FC<AppButtonProps> = ({
  variant = "solid",
  color = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) => (
  <Button
    variant={variant}
    color={colorMap[color as AppButtonColor]}
    size={size}
    className={[
      "transition duration-200 ease-out hover:-translate-y-0.5 active:scale-95",
      "shadow-sm",
      className,
    ].join(" ")}
    {...rest}
  >
    {children}
  </Button>
);

export type AppCardProps = React.ComponentProps<typeof HeroCard> & { hoverable?: boolean };

export const AppCard: React.FC<AppCardProps> = ({ children, className = "", hoverable, ...rest }) => (
  <HeroCard
    className={[
      "rounded-2xl border border-white/60 bg-white/80 shadow-md backdrop-blur-sm p-4",
      hoverable ? "hover:-translate-y-1 hover:shadow-lg transition" : "",
      className,
    ].join(" ")}
    {...rest}
  >
    {children}
  </HeroCard>
);

export type TabButtonProps = {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

export const TabButton: React.FC<TabButtonProps> = ({ active, children, onClick }) => (
  <AppButton
    size="sm"
    variant={active ? "solid" : "flat"}
    color="primary"
    className={`min-w-[96px] ${active ? "shadow" : "shadow-none"}`}
    onClick={onClick}
  >
    {children}
  </AppButton>
);

export type SectionTitleProps = {
  title: string;
  desc?: string;
  className?: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, desc, className = "" }) => (
  <div className={`mb-4 flex flex-col gap-1 ${className}`}>
    <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500 shadow-inner" />
      <span>{title}</span>
    </div>
    {desc && <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>}
  </div>
);

// Backwards compatibility exports
export { AppCard as Card };
