

/* llm-app */
resource "cloudflare_record" "my_app_dns" {
  zone_id = var.zone_id
  name    = "llm-app"
  content   = google_compute_address.static_ip.address
  type    = "A"
  ttl     = 1
  proxied = true

  depends_on = [google_compute_address.static_ip]
}

resource "cloudflare_record" "git_subdomain" {
  zone_id = var.zone_id  # Cloudflare Zone ID for giladtech.io
  name    = "git"
  content   = "github.com"  # GitHub's domain
  type    = "CNAME"
  ttl     = 1
  proxied = true  # Set to true if you want Cloudflare to proxy requests

  depends_on = [google_compute_address.static_ip]
}

resource "cloudflare_page_rule" "git_redirect" {
  zone_id  = var.zone_id
  target   = "git.giladtech.io/*"  # Catch all sub-paths
  priority = 1
  status   = "active"

  actions {
    forwarding_url {
      url         = "https://github.com/porhack?tab=repositories"  # Redirect to this exact URL
      status_code = 301  # Permanent redirect
    }
  }
}