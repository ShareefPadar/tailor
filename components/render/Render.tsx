import { Check } from "lucide-react";
import { tokensToStyle } from "../../lib/tokens";
import type { Node, Tokens } from "../../lib/types";
import { Avatar, Chips, IconTile, Note, Progress, Rating, Toggle } from "./Atoms";
import { Badge, Divider, Rows, Stat, Steps } from "./Blocks";

const HEADING_SIZE = { 1: "text-[24px]", 2: "text-[20px]", 3: "text-[17px]" };

// All three share a 1.5px border so they are the same size. Colours come from the button style token.
const BUTTON_STYLE = {
  primary: "bg-[color:var(--st-btn-bg)] text-[color:var(--st-btn-fg)] border-[color:var(--st-btn-line)]",
  secondary: "bg-[color:var(--st-btn2-bg)] text-[color:var(--st-primary)] border-[color:var(--st-btn2-line)]",
  ghost: "bg-transparent text-[color:var(--st-primary)] border-transparent",
};

function NodeView({ node, nested }: { node: Node; nested: boolean }) {
  switch (node.type) {
    case "card": {
      const box = nested ? "bg-[color:var(--st-surface-2)]" : "[background:var(--st-card-bg)] [border:var(--st-border-card)]";
      return (
        <div
          className={`flex w-full max-w-[300px] flex-col gap-[var(--st-gap)] rounded-[var(--st-radius)] p-[var(--st-pad)] [text-align:var(--st-align)] ${box}`}
          style={nested ? undefined : { boxShadow: "var(--st-shadow)" }}
        >
          {node.children.map((child, i) => (
            <NodeView key={i} node={child} nested />
          ))}
        </div>
      );
    }
    case "heading":
      return (
        <div className={`[font-weight:var(--st-heading-weight)] ${HEADING_SIZE[node.level ?? 2]}`}>{node.text}</div>
      );
    case "text":
      return <p className={node.muted ? "text-[color:var(--st-muted)]" : undefined}>{node.text}</p>;
    case "button":
      return (
        <div
          className={`w-full rounded-[var(--st-radius-sm)] border-[1.5px] border-solid p-[var(--st-btn-pad)] text-center font-medium ${BUTTON_STYLE[node.variant ?? "primary"]}`}
        >
          {node.text}
        </div>
      );
    case "input":
      return (
        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-[13px] font-medium">{node.label}</span>
          <div className="rounded-[var(--st-radius-sm)] px-3 py-2 text-[color:var(--st-placeholder)] [border:var(--st-border-input)]">
            {node.placeholder ?? " "}
          </div>
        </div>
      );
    case "list":
      return (
        <ul className="flex flex-col gap-[calc(var(--st-gap)*0.67)] text-left">
          {node.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={16} className="mt-[0.2em] shrink-0 text-[color:var(--st-primary)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "badge":
      return <Badge node={node} />;
    case "stat":
      return <Stat node={node} />;
    case "rows":
      return <Rows node={node} />;
    case "steps":
      return <Steps node={node} />;
    case "divider":
      return <Divider />;
    case "row":
      // Blocks side by side, each taking an equal share.
      return (
        <div className="flex items-stretch gap-[var(--st-gap)] [&>*]:min-w-0 [&>*]:flex-1">
          {node.children.map((child, i) => (
            <NodeView key={i} node={child} nested />
          ))}
        </div>
      );
    case "avatar":
      return <Avatar node={node} />;
    case "icon":
      return <IconTile node={node} />;
    case "progress":
      return <Progress node={node} />;
    case "toggle":
      return <Toggle node={node} />;
    case "chips":
      return <Chips node={node} />;
    case "rating":
      return <Rating node={node} />;
    case "note":
      return <Note node={node} />;
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
      className="flex w-full justify-center font-[family-name:var(--st-font)] text-[length:var(--st-size)] leading-normal tracking-normal text-[color:var(--st-text)]"
      style={tokensToStyle(tokens)}
    >
      <NodeView node={spec} nested={false} />
    </div>
  );
}
