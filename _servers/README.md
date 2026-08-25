# Server staging sources

`_servers/` contains only files mirrored to public destinations. Each
top-level directory is an explicit target; directory names never infer SSH
credentials or remote paths.

| Source | Public base URL | Responsibility |
| --- | --- | --- |
| `training.dercetech.com/` | `https://training.dercetech.com/trainings/python-html5-security/labs/` | Exact-root redirect plus nested Training-owned lab guide, assets and deliberately unsafe PHP app |
| `second-domain/` | `https://training.bad-sector.games/secu-5d/` | Controlled Bad Sector demonstration dashboard and API |
| `second-domain-root/` | `https://training.bad-sector.games/` | Bad Sector root landing only |
| `training2.dercetech.com/` | `https://training2.dercetech.com/` | Sibling-subdomain landing and cookie-scope demo |
| `incinerator/` | `http://sc8rumo3487.universe.wf/` | Disposable SC8 file-manager breach demonstration |

The D1/S2 demonstration dashboard source is `second-domain/day1/s2/`; its
public route is `https://training.bad-sector.games/secu-5d/day1/s2/`. Data
received while the lab is running is not part of this tree.

The Day 3 browser-header examples live under
`training.dercetech.com/day-3/s3_04/`. The HSTS example deliberately uses a
five-minute policy and no subdomain or preload directive so learners can observe
an HTTP link being upgraded without retaining a long-lived classroom setting.
The Referrer-Policy receiver in the same tree reflects only the current
request's escaped `Referer` value and does not persist requests or headers.
The CSP directory exposes one static JavaScript component with `nosniff` and an
explicit cross-origin resource policy for the local allowlist exercise.
The Permissions-Policy directory contains a fake camera advertisement. Its
preview is strictly local to the browser and the source performs no upload,
recording or persistence.

The Training labs base URL redirects to the course page. The redirect rule
matches only that directory root; nested lab routes such as `day-1/s2/` remain
available.

Use `npm run deploy:sync` to mirror every configured target, or
`npm run deploy:sync:watch` while actively working. Target-specific commands
exist for Training2 and the Bad Sector root; any target can also be selected
with `bash scripts/sync-deploy.sh sync <target>`. Syncs mirror deletions.

The watcher is opt-in and must be started explicitly. It reads its target
table and local configuration only when it starts, so restart it after adding
or changing a target. Run only one watcher.

`incinerator/` is deliberately **not** part of `deploy:sync` or the common
watcher. Its only deployment entry point is `npm run sc8:scratch`. That command
mirrors this one target and then runs its CLI-only reset script remotely. It
protects provider-managed `.well-known/`, `cgi-bin/` and the lab’s generated
`.incinerator-state/` directory.

The remote reset recreates the mock files and pinned-notes database. Unless the
host defines `INCINERATOR_ACCESS_PASSWORD`, it also rotates a random classroom
password, prints it in the `sc8:scratch` output, and saves it locally to the
ignored `_servers/incinerator/password.txt` file.

The authenticated explorer is rooted at `data/` and exposes only its `notes/`
and `scripts/` fixtures after a reset. The real document root and its mock
`settings.php` stay out of the explorer. Every editable file has a public URL;
PHP below `data/` executes server-side, and public HTML/JavaScript runs normally
in a visitor’s browser. Root PHP files remain blocked from direct web access.

Provider-managed `.well-known/` and `cgi-bin/` directories are excluded and
protected from deletion at every target root. The `second-domain-root` target
also protects the separately managed `secu-5d/` tree.
