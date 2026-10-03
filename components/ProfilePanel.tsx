import { confidence, hasProfile } from "../lib/profile";
import { TOKEN_KEYS } from "../lib/tokens";
import type { Profile, TokenKey, Tokens } from "../lib/types";
import { ChangeLog } from "./ChangeLog";
import { TokenRow } from "./TokenRow";
import { LABEL } from "./ui";

interface ProfilePanelProps {
  profile: Profile;
  onEdit: (patch: Partial<Tokens>) => void;
  onToggleLock: (key: TokenKey) => void;
}

// The inspector: what Style Twin has learned, and the controls to correct it.
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
      <div className="px-2 py-3">
        <h3 className={`${LABEL} px-2 pb-1`}>Tokens</h3>
        {TOKEN_KEYS.map((key) => (
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
      <div className="p-4">
        <ChangeLog log={profile.log} />
      </div>
    </section>
  );
}
