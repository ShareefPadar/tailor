import { confidence, hasProfile } from "../lib/profile";
import { TOKEN_KEYS } from "../lib/tokens";
import type { Profile, TokenKey, Tokens } from "../lib/types";
import { ChangeLog } from "./ChangeLog";
import { TokenRow } from "./TokenRow";

interface ProfilePanelProps {
  profile: Profile;
  onEdit: (patch: Partial<Tokens>) => void;
  onToggleLock: (key: TokenKey) => void;
}

export function ProfilePanel({ profile, onEdit, onToggleLock }: ProfilePanelProps) {
  return (
    <section aria-label="Style Profile" className="space-y-5 p-4">
      <h2 className="text-base font-semibold">Style Profile</h2>
      {!hasProfile(profile) ? (
        <p className="text-[17px] leading-snug text-zinc-500">
          No style learned yet. Pick a variant to start.
        </p>
      ) : (
        profile.summary && <p className="text-[17px] leading-snug">{profile.summary}</p>
      )}
      <div className="space-y-1">
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
      <ChangeLog log={profile.log} />
    </section>
  );
}
