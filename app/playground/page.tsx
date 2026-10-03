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
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-xl font-semibold">Renderer playground</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {cases.map(({ spec, tokens }, i) => (
          <section key={SEEDS[i].label}>
            <p className="mb-2 text-sm font-medium text-zinc-600">
              {SEEDS[i].label}
            </p>
            <div className="flex min-h-[360px] items-center rounded-xl bg-[#f4f4f5] p-6">
              <Render spec={spec} tokens={tokens} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
