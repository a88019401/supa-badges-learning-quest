import React from "react";

type ButtonVariant = "solid" | "flat" | "light";
type ButtonColor = "primary" | "success" | "danger" | "default";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
  isDisabled?: boolean;
};

const colorMap: Record<ButtonColor, string> = {
  default: "text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50",
  primary:
    "text-white bg-violet-600 border border-violet-500 hover:bg-violet-500 shadow-sm",
  success:
    "text-white bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 shadow-sm",
  danger: "text-white bg-rose-600 border border-rose-500 hover:bg-rose-500 shadow-sm",
};

function variantClass(variant: ButtonVariant, color: ButtonColor) {
  const base = colorMap[color];
  if (variant === "flat") {
    const tone =
      color === "primary"
        ? "text-violet-600 border-violet-300"
        : color === "success"
          ? "text-emerald-600 border-emerald-300"
          : color === "danger"
            ? "text-rose-600 border-rose-300"
            : "text-neutral-700 border-neutral-200";
    return `bg-white/90 ${tone} hover:bg-white`;
  }
  if (variant === "light") {
    const tone =
      color === "primary"
        ? "text-violet-700 border-violet-100"
        : color === "success"
          ? "text-emerald-700 border-emerald-100"
          : color === "danger"
            ? "text-rose-700 border-rose-100"
            : "text-neutral-700 border-neutral-200";
    return `bg-transparent ${tone}`;
  }
  return base;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "solid",
  color = "default",
  size = "md",
  fullWidth,
  isDisabled,
  className = "",
  children,
  ...rest
}) => {
  const sizeClass =
    size === "sm"
      ? "text-sm px-3 py-1.5"
      : size === "lg"
        ? "text-base px-5 py-2.5"
        : "text-sm px-4 py-2";

  const classes = [
    "inline-flex items-center justify-center rounded-xl transition duration-200 ease-out",
    "hover:-translate-y-0.5 active:scale-95",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200",
    sizeClass,
    variantClass(variant, color),
    fullWidth ? "w-full" : "",
    isDisabled || rest.disabled ? "opacity-60 pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest} disabled={isDisabled || rest.disabled}>
      {children}
    </button>
  );
};

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  isHoverable?: boolean;
};

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  isHoverable,
  ...rest
}) => (
  <div
    className={[
      "rounded-2xl border border-white/70 bg-white/80 shadow-md",
      "backdrop-blur-sm",
      isHoverable ? "hover:-translate-y-1 hover:shadow-lg transition" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...rest}
  >
    {children}
  </div>
);

export type TabsProps = {
  children: React.ReactNode;
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
  className?: string;
};

export const Tabs: React.FC<TabsProps> = ({
  children,
  selectedKey,
  onSelectionChange,
  className,
}) => {
  const items = React.Children.toArray(children) as React.ReactElement<TabProps>[];
  const [active, setActive] = React.useState<string>(selectedKey ?? items[0]?.key?.toString() ?? "0");

  React.useEffect(() => {
    if (selectedKey) setActive(selectedKey);
  }, [selectedKey]);

  const handleSelect = (key: string) => {
    setActive(key);
    onSelectionChange?.(key);
  };

  return (
    <div className={className}>
      <div className="flex gap-2 mb-3">
        {items.map((tab, idx) => (
          <Button
            key={tab.key?.toString() ?? `${idx}`}
            variant={active === tab.key?.toString() ? "solid" : "flat"}
            color="primary"
            size="sm"
            onClick={() => handleSelect(tab.key?.toString() ?? `${idx}`)}
          >
            {tab.props.title}
          </Button>
        ))}
      </div>
      <div className="mt-2">
        {items.find((t) => t.key?.toString() === active)?.props.children ?? items[0]?.props.children}
      </div>
    </div>
  );
};

export type TabProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

export const Tab: React.FC<TabProps> = ({ children }) => <>{children}</>;

export const HeroUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const heroui = () => ({ handler: () => {} });

export default { Button, Card, Tabs, Tab, HeroUIProvider, heroui };
