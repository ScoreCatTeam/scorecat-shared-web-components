# @scorecat/shared-web-components

Shared web pieces for the ScoreCat ecosystem, consumed as a git dependency:

```
npm i github:ScoreCatTeam/scorecat-shared-web-components#main
```

```ts
import { SITES, resolveSiteUrl, resolveWorld, getWorld } from '@scorecat/shared-web-components';

resolveSiteUrl('reports');        // world-aware: staging pages get the staging twin
resolveSiteUrl('auth', '/login'); // append a path
```

## What's here

- `sites.ts` — the ecosystem manifest (all seven sites, judges/admin `hidden`),
  the canonical staging/production world rule (site-name based — **never**
  `.web.app` detection), and `resolveSiteUrl()`.

## What's deliberately NOT here yet

Tokens, the Tailwind preset, and the `BrandBar` component wait for the design
freeze — the visual design is iterated in the hub repo first. See
`ScoreCatWebMain/docs/ECOSYSTEM-UNIFICATION.md` (§1, §4) — that document is the
contract; this package implements it.

## Releasing a change

Push to `main`, then in each consumer: `npm update @scorecat/shared-web-components`
and redeploy. Cross-repo changes ride the "stage everything, verify each
`staging-*` host, promote together" rule (contract §4).

Flip-day note: `SITES.main.prod` is `scorecat-website.web.app` until the apex
moves to the Astro site; change it and bump on flip day.
