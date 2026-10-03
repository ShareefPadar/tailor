import { confidence, hasProfile } from "../lib/profile";
import { TOKEN_KEYS } from "../lib/tokens";
import type { Profile } from "../lib/types";
import { ChangeLog } from "./ChangeLog";
import { TokenRow } from "./TokenRow";

export function ProfilePanel({ profile }: { profile: Profile }) {
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
            value={profile.tokens[key]}
            confidence={confidence(profile, key)}
            locked={profile.locked[key]}
            lastChangeId={profile.log.find((entry) => entry.token === key)?.id}
          />
        ))}
      </div>
      <ChangeLog log={profile.log} />
    </section>
  );
}
