import { confidence, hasProfile } from "../lib/profile";
import type { Profile, TokenKey, Tokens } from "../lib/types";
import { TokenRow } from "./TokenRow";
import { LABEL } from "./ui";

interface ProfilePanelProps {
  profile: Profile;
  onEdit: (patch: Partial<Tokens>) => void;
  onToggleLock: (key: TokenKey) => void;
}

// Token rows grouped the way a designer thinks about them.
const GROUPS: { title: string; keys: TokenKey[] }[] = [
  { title: "Look", keys: ["mode", "primary", "radius", "shadow", "border"] },
  { title: "Type and spacing", keys: ["font", "headingWeight", "density"] },
  { title: "Components and voice", keys: ["buttonStyle", "tone"] },
];

// The inspector: what Tailor has learned, and the controls to correct it.
export function ProfilePanel({ profile, onEdit, onToggleLock }: ProfilePanelProps) {
  return (
    <section aria-label="Style Profile" className="divide-y divide-hairline">
      <div className="space-y-2 p-4">
        <h2 className={LABEL}>Style Profile</h2>
        {!hasProfile(profile) ? (
          <p className="text-[17px] leading-snug tracking-[-0.01em] text-ink-2">
            No style learned yet. Pick a variant to start.
          </p>
        ) : (
          profile.summary && <p className="animate-rise text-[17px] leading-snug tracking-[-0.01em]">{profile.summary}</p>
        )}
      </div>
      {GROUPS.map((group) => (
        <div key={group.title} className="px-2 py-3">
          <h3 className={`${LABEL} px-2 pb-1`}>{group.title}</h3>
          {group.keys.map((key) => (
            <TokenRow
              key={key}
              tokenKey={key}
              tokens={profile.tokens}
              confidence={confidence(profile, key)}
              locked={profile.locked[key]}
              lastChangeId={profile.log.find((entry) => entry.token === key)?.id}
              onEdit={onEdit}
              onToggleLock={() => onToggleLock(key)}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
