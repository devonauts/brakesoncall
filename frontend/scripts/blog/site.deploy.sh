# Sourced by publicar.sh. How THIS site ships a blog release: the same way the site is always deployed — the code
# goes to GitHub (main) and the server pulls it and runs `npx vite build` in frontend/ (the blog is generated inside
# that build by scripts/blog/vite-plugin.mjs). nginx serves frontend/dist; static files only, no restart.
# publicar.sh has already built locally (validation) and committed when deploy_site runs.
SITE_KEY="boc"
SITE_URL="https://brakesoncall.com"
DEPLOY_HOST="${DEPLOY_HOST:-brakesoncall@192.168.86.44}"
DEPLOY_REPO="${DEPLOY_REPO:-brakesoncall}"      # relative to the remote $HOME

deploy_site() {
  git -C "$REPO" push -q origin HEAD:main || { echo "git push failed"; return 1; }
  ssh -o ConnectTimeout=10 "$DEPLOY_HOST" "set -e
    cd ~/$DEPLOY_REPO
    git pull -q --ff-only origin main
    cd frontend
    npx vite build >/tmp/brakesoncall-blog-build.log 2>&1 || { tail -40 /tmp/brakesoncall-blog-build.log; exit 1; }
    test -f dist/index.html && test -f dist/blog/index.html
    echo \"built \$(git log --oneline -1)\""
}
