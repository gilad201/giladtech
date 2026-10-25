# ---------------------------------------------------------------
# Portfolio on Cloudflare Pages (direct upload, deployed with wrangler)
# Site source: services/gilad-portfolio/site
# ---------------------------------------------------------------

resource "cloudflare_pages_project" "portfolio" {
  account_id        = var.cloudflare_account_id
  name              = var.portfolio_project_name
  production_branch = "main"
}

resource "cloudflare_pages_domain" "apex" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.portfolio.name
  domain       = var.domain
}

resource "cloudflare_pages_domain" "www" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.portfolio.name
  domain       = "www.${var.domain}"
}

# Apex CNAME is fine on Cloudflare (CNAME flattening).
resource "cloudflare_record" "apex" {
  zone_id = var.zone_id
  name    = "@"
  type    = "CNAME"
  content = cloudflare_pages_project.portfolio.subdomain
  proxied = true
  comment = "Portfolio (Cloudflare Pages)"
}

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  type    = "CNAME"
  content = cloudflare_pages_project.portfolio.subdomain
  proxied = true
  comment = "Portfolio (Cloudflare Pages)"
}

output "portfolio_pages_url" {
  value = "https://${cloudflare_pages_project.portfolio.subdomain}"
}
