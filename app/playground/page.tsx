import { Render } from "../../components/render/Render";
import { SEEDS } from "../../lib/tokens";
import type { Node, Tokens } from "../../lib/types";

const pricing: Node = {
  type: "card",
  children: [
    { type: "heading", text: "Meal Plan Plus", level: 2 },
    { type: "text", text: "Free delivery on every order over $15.", muted: true },
    { type: "heading", text: "$12 / month", level: 1 },
    {
      type: "list",
      items: ["Unlimited free delivery", "Priority support", "Cancel anytime"],
    },
    { type: "button", text: "Start subscription", variant: "primary" },
    { type: "button", text: "Compare plans", variant: "ghost" },
  ],
};

const signUp: Node = {
  type: "card",
  children: [
    { type: "heading", text: "Join FitPulse", level: 1 },
    { type: "text", text: "Train smarter with a plan built for you.", muted: true },
    { type: "input", label: "Full name", placeholder: "Alex Rivera" },
    { type: "input", label: "Email", placeholder: "alex@example.com" },
    { type: "button", text: "Create account", variant: "primary" },
    { type: "text", text: "Already a member?", muted: true },
    { type: "button", text: "Log in", variant: "ghost" },
  ],
};

const orderStatus: Node = {
  type: "card",
  children: [
    { type: "heading", text: "Your groceries are on the way!", level: 2 },
    { type: "text", text: "Arriving in about 12 minutes." },
    {
      type: "card",
      children: [
        { type: "text", text: "Driver: Maya", muted: true },
        { type: "list", items: ["Fresh produce", "Dairy and eggs", "Pantry staples"] },
      ],
    },
    { type: "button", text: "Track order", variant: "secondary" },
  ],
};

// Edit any value in SEEDS (lib/tokens.ts) or override a token here to see the card change.
const cases: { spec: Node; tokens: Tokens }[] = [
  { spec: pricing, tokens: SEEDS[0].tokens },
  { spec: signUp, tokens: SEEDS[1].tokens },
  { spec: orderStatus, tokens: SEEDS[2].tokens },
];

export default function PlaygroundPage() {
  return (
    <main className="bg-dots min-h-dvh p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-[15px] font-semibold">Renderer playground</h1>
        <div className="grid items-start gap-x-4 gap-y-8 md:grid-cols-3">
          {cases.map(({ spec, tokens }, i) => (
            <section key={SEEDS[i].label} className="flex w-full max-w-[300px] flex-col gap-2.5">
              <p className="px-1 text-[12px] font-medium text-ink-2">{SEEDS[i].label}</p>
              <Render spec={spec} tokens={tokens} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
