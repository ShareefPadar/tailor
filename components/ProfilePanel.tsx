import { confidence, hasProfile } from "../lib/profile";
import { TOKEN_KEYS } from "../lib/tokens";
import type { Profile, TokenKey, Tokens } from "../lib/types";
import { ChangeLog } from "./ChangeLog";
import { TokenRow } from "./TokenRow";

interface ProfilePanelProps {
  profile: Profile;
  busy: boolean; // a generation is in flight
  onEdit: (patch: Partial<Tokens>) => void;
  onToggleLock: (key: TokenKey) => void;
  onReset: () => void;
}

export function ProfilePanel({ profile, busy, onEdit, onToggleLock, onReset }: ProfilePanelProps) {
  return (
    <section aria-label="Style Profile" className="space-y-5 rounded-xl border border-zinc-200 p-5">
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
      <div className="border-t border-zinc-200 pt-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Clear everything Style Twin has learned?")) onReset();
          }}
          className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset profile
        </button>
      </div>
    </section>
  );
}
