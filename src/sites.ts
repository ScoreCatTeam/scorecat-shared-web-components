/**
 * ScoreCat ecosystem sites manifest + world-aware URL resolution.
 *
 * Source of truth for the contract: ScoreCatWebMain/docs/ECOSYSTEM-UNIFICATION.md
 * (§3 "URL strategy — flip day is zero code changes"). URLs verified against
 * docs/HOSTED-SITES.md.
 *
 * THE WORLD RULE (canonical; lifted from scorecat-results-react
 * `src/lib/siteEnv.ts`): take the hostname's first label, strip a Firebase
 * preview-channel suffix (`--<channel>-<hash>`), and the host is STAGING iff
 * that label starts with `staging-` or ends with `-staging`. Never detect
 * staging by `.web.app` — production sites are also served on `.web.app`.
 */

export type SiteWorld = 'production' | 'staging' | 'local';

export type SiteId =
  | 'main'
  | 'results'
  | 'reports'
  | 'auth'
  | 'marketplace'
  | 'judges'
  | 'admin';

export interface SiteEntry {
  /** Short, space-constrained label — canonical for the shared bar (§4a). */
  label: string;
  /** Staging twin URL, or null when the site has none (marketplace). */
  staging: string | null;
  prod: string;
  /** In the manifest but not rendered in public wayfinding (judges/admin). */
  hidden?: boolean;
}

/**
 * The whole ecosystem — the data model knows every site; consumers render only
 * what is ready (`hidden` stays out of public nav).
 *
 * ⚠️ `main.prod` is `scorecat-website.web.app` until the apex/`www` domain
 * flips to the Astro site (ECOSYSTEM-UNIFICATION §6). Change it to
 * `https://www.scorecatonline.com` on flip day and bump this package.
 */
export const SITES: Record<SiteId, SiteEntry> = {
  main: {
    label: 'ScoreCat',
    staging: 'https://staging-www.scorecatonline.com',
    prod: 'https://scorecat-website.web.app',
  },
  results: {
    label: 'Meet Results',
    staging: 'https://staging-results.scorecatonline.com',
    prod: 'https://results.scorecatonline.com',
  },
  reports: {
    label: 'Reports',
    staging: 'https://staging-reports.scorecatonline.com',
    prod: 'https://reports.scorecatonline.com',
  },
  auth: {
    // Binding audience-facing name (never "Auth", never "Meet Directors").
    label: 'Meet Publishing',
    staging: 'https://staging-auth.scorecatonline.com',
    prod: 'https://auth.scorecatonline.com',
  },
  marketplace: {
    // Same org and same Firebase project as the rest. Still outside
    // release-all.yml only because the repo has no CI yet to pin an rc-<sha>
    // (ECOSYSTEM-UNIFICATION §7).
    label: 'Marketplace',
    staging: 'https://staging-marketplace.scorecatonline.com',
    prod: 'https://marketplace.scorecatonline.com',
  },
  judges: {
    label: 'Judges',
    staging: 'https://staging-judges.scorecatonline.com',
    prod: 'https://judges.scorecatonline.com',
    hidden: true,
  },
  admin: {
    label: 'Admin',
    staging: 'https://staging-admin.scorecatonline.com',
    prod: 'https://admin.scorecatonline.com',
    hidden: true,
  },
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

/** Resolve the world for a hostname. Pure; exported for tests. */
export function resolveWorld(hostname: string): SiteWorld {
  const host = (hostname || '').toLowerCase().replace(/:\d+$/, '');
  if (!host || LOCAL_HOSTS.has(host) || host.endsWith('.local')) return 'local';
  const firstLabel = host.split('.')[0];
  const siteLabel = firstLabel.split('--')[0];
  if (siteLabel.startsWith('staging-') || siteLabel.endsWith('-staging')) return 'staging';
  return 'production';
}

/** World of the running page; 'production' when there is no DOM (SSR/build). */
export function getWorld(): SiteWorld {
  if (typeof window === 'undefined' || !window.location) return 'production';
  const host = window.location.hostname;
  return host ? resolveWorld(host) : 'production';
}

/**
 * Base URL of `siteId` for the given (default: current) world.
 *
 * Staging pages link to staging twins so an unreleased ecosystem can be
 * verified end-to-end; everything else — production AND local dev — links to
 * production. A site with no staging twin (marketplace) always resolves to
 * production, even from staging.
 */
export function resolveSiteUrl(siteId: SiteId, path = '', world: SiteWorld = getWorld()): string {
  const site = SITES[siteId];
  const base = world === 'staging' && site.staging ? site.staging : site.prod;
  return `${base}${path}`;
}
