#!/usr/bin/env bash
#
# The blog drip of this site, end to end. Idempotent: with nothing new and nothing due it only refreshes HQ's inventory.
#
#   1. pull what Mike approved in Urresta HQ  → content/blog-pending/ + release-plan.json → commit → ack to HQ
#   2. release.mjs: posts due today (site time zone) → content/blog/, their images → public/blog/img/
#   3. build (vite + static blog generator: validates frontmatter, images, internal links; any error fails it)
#      → on failure: REVERT the move and report the failure to HQ
#   4. commit → deploy with the site's own method (scripts/blog/site.deploy.sh) → check live (posts 200, unknown slug 404)
#   5. tell HQ: published posts (URL) + inventory of the whole blog (published + pending)
#
# Usage (from the Mac, it needs ssh to the server):
#   bash frontend/scripts/blog/publicar.sh               # the daily run (launchd/cron)
#   bash frontend/scripts/blog/publicar.sh --dry-run     # show what would be imported/released; touch nothing
#   bash frontend/scripts/blog/publicar.sh --no-import   # skip HQ (e.g. offline); release what is already pending
#   bash frontend/scripts/blog/publicar.sh --until 2026-10-20
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT="$(cd "$HERE/../.." && pwd)"
REPO="$(git -C "$FRONT" rev-parse --show-toplevel)"
# shellcheck source=site.deploy.sh
source "$HERE/site.deploy.sh"          # SITE_KEY, SITE_URL, deploy_site(), optional BUILD_CMD / after_commit()
BUILD_CMD="${BUILD_CMD:-npm run build}"
LOG="${BLOG_LOG:-$HOME/blog-release-$SITE_KEY.log}"
LOCK="/tmp/blog-release-$SITE_KEY.lock.d"

DRY=""; IMPORT=1; UNTIL=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --no-import) IMPORT="" ;;
    --until) UNTIL="$2"; shift ;;
    *) echo "unknown option $1"; exit 2 ;;
  esac
  shift
done

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
log()  { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }
has_token() { [[ -n "${HQ_BLOG_TOKEN:-}" ]] || grep -qs '^HQ_BLOG_TOKEN=.' "$HOME/.config/hq-blog-$SITE_KEY.env"; }
report() { [[ -n "$DRY" ]] || ! has_token || node scripts/blog/exportar-inventario.mjs --send "$@" >>"$LOG" 2>&1 || log "(could not send the inventory to HQ)"; }
fail() { log "FAILED ($SITE_KEY): $*"; report --fail "$*"; exit 1; }

if ! mkdir "$LOCK" 2>/dev/null; then log "Another release is running ($LOCK). Exiting."; exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT
cd "$FRONT"
log "──────── $SITE_KEY blog release ────────"

CONTENT=(content/blog content/blog-pending public/blog scripts/blog/release-plan.json)
if [[ -n "$(git status --porcelain -- "${CONTENT[@]}")" ]]; then
  git status --short -- "${CONTENT[@]}" | tee -a "$LOG"
  fail "uncommitted changes in the blog content; aborting so they are not lost"
fi

# ── 1. HQ → pending ─────────────────────────────────────────────────────────
if [[ -n "$IMPORT" ]] && has_token; then
  if node scripts/blog/importar.mjs ${DRY:+--dry-run} 2>&1 | tee -a "$LOG"; then
    if [[ -z "$DRY" ]] && [[ -n "$(git status --porcelain -- content/blog-pending scripts/blog/release-plan.json)" ]]; then
      git add -- content/blog-pending scripts/blog/release-plan.json
      git commit -q -m "Blog HQ: approved posts waiting for their date

Imported by scripts/blog/importar.mjs into content/blog-pending/ (not built) with
their release date in scripts/blog/release-plan.json."
      log "Imported: $(git log --oneline -1)"
    fi
    [[ -n "$DRY" ]] || node scripts/blog/importar.mjs --ack >>"$LOG" 2>&1 || log "(could not ack the import to HQ; retried next run)"
  else
    log "(HQ did not answer or the import failed; releasing what is already pending)"
    git checkout -- content/blog-pending scripts/blog/release-plan.json 2>/dev/null || true
    git clean -fdq -- content/blog-pending 2>/dev/null || true
  fi
elif [[ -n "$IMPORT" ]]; then
  log "(no HQ token in ~/.config/hq-blog-$SITE_KEY.env: import skipped)"
fi

# ── 2. release what is due ──────────────────────────────────────────────────
RESULT="$(node scripts/blog/release.mjs --json ${DRY:+--dry-run} ${UNTIL:+--until "$UNTIL"})"
N="$(node -e 'const r=JSON.parse(process.argv[1]);console.log(r.released.length)' "$RESULT")"
node -e 'const r=JSON.parse(process.argv[1]);for(const x of r.released)console.log("  + "+x.date+"  "+x.slug);for(const x of r.held)console.log("  ! "+x.slug+": "+x.why)' "$RESULT" | tee -a "$LOG"
if [[ "$N" == "0" ]]; then log "Nothing due."; report; exit 0; fi
[[ -n "$DRY" ]] && { log "dry run: would release $N post(s) and deploy."; exit 0; }

revert() {
  log "Reverting: posts and images go back to content/blog-pending/"
  git checkout -- content/blog content/blog-pending public/blog 2>/dev/null || true
  git clean -fdq -- content/blog public/blog 2>/dev/null || true
}

# ── 3. build (validates) ────────────────────────────────────────────────────
log "Building ($N post(s))"
if ! $BUILD_CMD >>"$LOG" 2>&1; then revert; $BUILD_CMD >/dev/null 2>&1 || true; fail "the build failed (see $LOG)"; fi

# ── 4. commit → deploy → live check ─────────────────────────────────────────
git add -A -- content/blog content/blog-pending public/blog scripts/blog/release-plan.json
git commit -q -m "Blog: release of $(date +%F) ($N post(s))

Released by scripts/blog/publicar.sh following scripts/blog/release-plan.json
(the Urresta HQ Content Studio drip)."
log "Commit: $(git log --oneline -1)"
if ! deploy_site >>"$LOG" 2>&1; then
  fail "the build is committed but the deploy failed (see $LOG); the next run retries"
fi
log "Deployed"

sleep 3
BAD=""
for U in $(node -e 'const r=JSON.parse(process.argv[1]);console.log(r.released.map(x=>x.url).join(" "))' "$RESULT") "$SITE_URL/blog/"; do
  C="$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$U" || echo 000)"
  [[ "$C" == "200" ]] || BAD="$BAD $U=$C"
done
C404="$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$SITE_URL/blog/this-post-does-not-exist-$RANDOM/" || echo 000)"
[[ "$C404" == "404" ]] || BAD="$BAD unknown-slug=$C404(expected 404)"
if [[ -n "$BAD" ]]; then fail "deployed, but live check failed:$BAD"; fi

# ── 5. HQ: published + inventory ────────────────────────────────────────────
if has_token; then
  node -e '
    const r = JSON.parse(process.argv[1]);
    const results = r.released.filter(x => x.item != null).map(x => ({ item_id: x.item, ok: true, slug: x.slug, fecha: x.date, estado: "published", url: x.url, errores: [], avisos: [] }));
    require("fs").writeFileSync("scripts/blog/.last-import.json", JSON.stringify({ at: new Date().toISOString(), results }));' "$RESULT"
  node scripts/blog/importar.mjs --ack >>"$LOG" 2>&1 || log "(could not tell HQ; the inventory below reconciles it)"
fi
report
log "DONE ($SITE_KEY) · $N post(s) · $(node scripts/blog/release.mjs --status | head -1)"
