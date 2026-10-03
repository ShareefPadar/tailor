import { Check } from "lucide-react";
import { tokensToStyle } from "../../lib/tokens";
import type { Node, Tokens } from "../../lib/types";

const HEADING_SIZE = { 1: "text-[24px]", 2: "text-[20px]", 3: "text-[17px]" };

const BUTTON_STYLE = {
  primary:
    "bg-[color:var(--st-primary)] text-[color:var(--st-on-primary)] border border-transparent",
  secondary:
    "bg-transparent text-[color:var(--st-primary)] border border-[color:var(--st-primary)]",
  ghost:
    "bg-transparent text-[color:var(--st-primary)] border border-transparent",
};

interface NodeViewProps {
  node: Node;
  shadow: Tokens["shadow"];
  nested: boolean;
}

function NodeView({ node, shadow, nested }: NodeViewProps) {
  switch (node.type) {
    case "card": {
      const box = nested
        ? "bg-[#f4f4f5]"
        : `bg-white ${shadow === "none" ? "border border-[#e4e4e7]" : ""}`;
      return (
        <div
          className={`flex w-full max-w-[300px] flex-col gap-[var(--st-gap)] rounded-[var(--st-radius)] p-[var(--st-pad)] ${box}`}
          style={nested ? undefined : { boxShadow: "var(--st-shadow)" }}
        >
          {node.children.map((child, i) => (
            <NodeView key={i} node={child} shadow={shadow} nested />
          ))}
        </div>
      );
    }
    case "heading":
      return (
        <div className={`font-semibold ${HEADING_SIZE[node.level ?? 2]}`}>
          {node.text}
        </div>
      );
    case "text":
      return (
        <p className={node.muted ? "text-[#71717a]" : undefined}>{node.text}</p>
      );
    case "button":
      return (
        <div
          className={`w-full rounded-[var(--st-radius-sm)] p-[var(--st-btn-pad)] text-center font-medium ${BUTTON_STYLE[node.variant ?? "primary"]}`}
        >
          {node.text}
        </div>
      );
    case "input":
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{node.label}</span>
          <div className="rounded-[var(--st-radius-sm)] border border-[#d4d4d8] px-3 py-2 text-[#a1a1aa]">
            {node.placeholder ?? " "}
          </div>
        </div>
      );
    case "list":
      return (
        <ul className="flex flex-col gap-[calc(var(--st-gap)*0.67)]">
          {node.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check
                size={16}
                className="mt-[0.2em] shrink-0 text-[color:var(--st-primary)]"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

interface RenderProps {
  spec: Node;
  tokens: Tokens;
}

export function Render({ spec, tokens }: RenderProps) {
  return (
    <div
      className="flex w-full justify-center font-[family-name:var(--st-font)] text-[length:var(--st-size)] leading-normal tracking-normal text-zinc-900"
      style={tokensToStyle(tokens)}
    >
      <NodeView node={spec} shadow={tokens.shadow} nested={false} />
    </div>
  );
}
