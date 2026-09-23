/**
 * ScoreCat ecosystem sites manifest + world-aware URL resolution.
 *
 * Source of truth for the contract: scorecat-website-react/docs/ECOSYSTEM-UNIFICATION.md
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
  /**
   * One-line descriptor rendered under the label in the site switcher and the
   * hub's quick-links band. Lives here so the five consumers render one string
   * instead of five hand-copied lists (scorecat-website-react#64 / WEB-30).
   */
  blurb: string;
  /**
   * Staging twin URL, or null when the site has none. Every entry has one as of
   * 2026-08-30, when the marketplace gained `staging-marketplace` (#1) — the type
   * stays nullable because a future site may land before its twin does.
   */
  staging: string | null;
  prod: string;
  /** In the manifest but not rendered in public wayfinding (judges/admin). */
  hidden?: boolean;
}

/**
 * The whole ecosystem — the data model knows every site; consumers render only
 * what is ready (`hidden` stays out of public nav).
 *
 * `main.prod` is the APEX, not `www`. The apex flipped to the Astro site on
 * 2026-08-31 and `www` followed on 2026-09-05 (CNAME scorecat-website.web.app);
 * both now serve the same Firebase Hosting site under the serve-both model, so
 * this value is correct and stable — cross-site nav hops never depend on `www`.
 * (Canonical tags point at `www` — that is the SEO surface, not this.)
 */
export const SITES: Record<SiteId, SiteEntry> = {
  main: {
    label: 'ScoreCat',
    blurb: 'Apps, pricing, and the ScoreCat Pride',
    staging: 'https://staging-www.scorecatonline.com',
    prod: 'https://scorecatonline.com',
  },
  results: {
    label: 'Meet Results',
    blurb: 'Live scores from every meet',
    staging: 'https://staging-results.scorecatonline.com',
    prod: 'https://results.scorecatonline.com',
  },
  reports: {
    label: 'Reports',
    blurb: 'Season rankings by state and region',
    staging: 'https://staging-reports.scorecatonline.com',
    prod: 'https://reports.scorecatonline.com',
  },
  auth: {
    // Binding audience-facing name (never "Auth", never "Meet Directors").
    label: 'Meet Publishing',
    blurb: 'Publish your meet to ScoreCat',
    staging: 'https://staging-auth.scorecatonline.com',
    prod: 'https://auth.scorecatonline.com',
  },
  marketplace: {
    // Same org and same Firebase project as the rest, and — since
    // ScoreCatTeam/meet-marketplace#10 (2026-09-01) — the same
    // deploy/promote/rollback pipeline, so it pins rc-<sha> channels like every
    // other site and belongs in release-all.yml.
    label: 'Marketplace',
    blurb: 'Find and book meet hosts',
    staging: 'https://staging-marketplace.scorecatonline.com',
    prod: 'https://marketplace.scorecatonline.com',
  },
  judges: {
    label: 'Judges',
    // Hidden sites never render in public wayfinding; the blurb exists only so
    // every entry has the same shape.
    blurb: 'Judge portal',
    staging: 'https://staging-judges.scorecatonline.com',
    prod: 'https://judges.scorecatonline.com',
    hidden: true,
  },
  admin: {
    label: 'Admin',
    blurb: 'Admin portal',
    staging: 'https://staging-admin.scorecatonline.com',
    prod: 'https://admin.scorecatonline.com',
    hidden: true,
  },
};

/**
 * Public wayfinding order for the site switcher — the sites a visitor can be
 * sent to, in the order the switcher lists them (hidden sites stay out, §4a).
 * Today this matches every consumer's own list; if WEB-30 (scorecat-website-react#38)
 * reorders the switcher, change it HERE and nowhere else.
 */
export const SWITCHER_SITES = ['main', 'results', 'reports', 'auth', 'marketplace'] as const satisfies readonly SiteId[];

/** A site that appears in the switcher — lets consumers type an exact icon map. */
export type SwitcherSiteId = (typeof SWITCHER_SITES)[number];

/** Footnote under the switcher list, one string for every consumer. */
export const SWITCHER_FOOTNOTE = 'Judge & admin portals stay out of public wayfinding.';

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
 * production. A site with no `staging` value falls back to production even from
 * staging; no entry is in that state today.
 */
export function resolveSiteUrl(siteId: SiteId, path = '', world: SiteWorld = getWorld()): string {
  const site = SITES[siteId];
  const base = world === 'staging' && site.staging ? site.staging : site.prod;
  return `${base}${path}`;
}
