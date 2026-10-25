# git.giladtech.io -> GitHub profile (kept from the old setup).
# Page Rules are Cloudflare's legacy mechanism; this one still works, and can
# move into cloudflare_ruleset.redirects later if you want everything in one place.

resource "cloudflare_record" "git_subdomain" {
  zone_id = var.zone_id
  name    = "git"
  content = "github.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

resource "cloudflare_page_rule" "git_redirect" {
  zone_id  = var.zone_id
  target   = "git.${var.domain}/*"
  priority = 1
  status   = "active"

  actions {
    forwarding_url {
      url         = "https://github.com/gilad201?tab=repositories"
      status_code = 301
    }
  }
}
