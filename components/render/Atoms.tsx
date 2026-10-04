import {
  Bell, Calendar, CircleCheck, Clock, CreditCard, Dumbbell, Gift, Heart, Info, Lock, Mail, MapPin,
  Package, Shield, ShoppingBag, Sparkles, Star, Truck, User, Utensils, Zap, type LucideIcon,
} from "lucide-react";
import type { IconName, Node } from "../../lib/types";

// The smaller building blocks. Colours and alignment come from the CSS variables set on the
// Render root, so this file needs no inline styles. Dynamic widths use SVG attributes.

type Block<T extends Node["type"]> = Extract<Node, { type: T }>;

const ICONS: Record<IconName, LucideIcon> = {
  truck: Truck, package: Package, check: CircleCheck, star: Star, zap: Zap, heart: Heart, shield: Shield,
  clock: Clock, card: CreditCard, user: User, mail: Mail, pin: MapPin, gift: Gift, sparkles: Sparkles,
  bell: Bell, bag: ShoppingBag, dumbbell: Dumbbell, utensils: Utensils, calendar: Calendar, lock: Lock,
};

const ALIGNED = "[justify-content:var(--st-justify)]";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("");
}

export function Avatar({ node }: { node: Block<"avatar"> }) {
  return (
    <div className={`flex items-center gap-3 text-left ${ALIGNED}`}>
      <span className="flex h-[2.6em] w-[2.6em] shrink-0 items-center justify-center rounded-full bg-[color:var(--st-tint)] text-[0.9em] font-semibold text-[color:var(--st-primary)]">
        {initials(node.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{node.name}</span>
        {node.caption && <span className="block truncate text-[0.87em] text-[color:var(--st-muted)]">{node.caption}</span>}
      </span>
    </div>
  );
}

export function IconTile({ node }: { node: Block<"icon"> }) {
  const Icon = ICONS[node.name];
  return (
    <div className={`flex ${ALIGNED}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-[var(--st-radius-sm)] bg-[color:var(--st-tint)] text-[color:var(--st-primary)]">
        <Icon size={22} />
      </span>
    </div>
  );
}

export function Progress({ node }: { node: Block<"progress"> }) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <div className="flex items-baseline justify-between gap-3 text-[0.87em]">
        <span className="text-[color:var(--st-muted)]">{node.label}</span>
        <span className="font-medium tabular-nums">{node.value}%</span>
      </div>
      <svg className="block h-2 w-full" role="img" aria-label={`${node.value}%`}>
        <rect width="100%" height="100%" rx="4" className="fill-[color:var(--st-line)]" />
        <rect width={`${node.value}%`} height="100%" rx="4" className="fill-[color:var(--st-primary)]" />
      </svg>
    </div>
  );
}

export function Toggle({ node }: { node: Block<"toggle"> }) {
  return (
    <div className="flex items-center justify-between gap-4 text-left">
      <span>{node.label}</span>
      <span
        className={`flex h-[1.4em] w-[2.4em] shrink-0 items-center rounded-full p-[0.15em] ${
          node.on ? "justify-end bg-[color:var(--st-primary)]" : "justify-start bg-[color:var(--st-line)]"
        }`}
      >
        <span className="h-[1.1em] w-[1.1em] rounded-full bg-white shadow-sm" />
      </span>
    </div>
  );
}

export function Chips({ node }: { node: Block<"chips"> }) {
  return (
    <div className={`flex flex-wrap gap-2 ${ALIGNED}`}>
      {node.items.map((item, i) => (
        <span
          key={i}
          className={`rounded-full border-[1.5px] px-3 py-1 text-[0.87em] font-medium ${
            i === node.selected
              ? "border-[color:var(--st-primary)] bg-[color:var(--st-primary)] text-[color:var(--st-on-primary)]"
              : "border-[color:var(--st-line)]"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function Rating({ node }: { node: Block<"rating"> }) {
  return (
    <div className={`flex items-center gap-2 ${ALIGNED}`}>
      <span className="flex gap-0.5" role="img" aria-label={`${node.value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={16}
            className={
              n <= Math.round(node.value)
                ? "fill-[color:var(--st-primary)] text-[color:var(--st-primary)]"
                : "text-[color:var(--st-line)]"
            }
          />
        ))}
      </span>
      {node.caption && <span className="text-[0.87em] text-[color:var(--st-muted)]">{node.caption}</span>}
    </div>
  );
}

export function Note({ node }: { node: Block<"note"> }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--st-radius-sm)] bg-[color:var(--st-tint)] p-3 text-left text-[0.9em]">
      <Info size={16} className="mt-[0.15em] shrink-0 text-[color:var(--st-primary)]" />
      <span>{node.text}</span>
    </div>
  );
}
