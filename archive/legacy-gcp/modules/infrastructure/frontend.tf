
# ---------------------------------
# Google Cloud Storage Bucket Setup
# ---------------------------------

resource "google_storage_bucket" "client_bucket" {
  name     = "giladtech.io"
  location = "US"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  logging {
    log_bucket = "my-logging-bucket"  # Replace with your actual log bucket
  }

  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"  # Disable public access prevention
}

resource "google_storage_bucket_iam_binding" "public_access" {
  bucket = google_storage_bucket.client_bucket.name
  role   = "roles/storage.objectViewer"

  members = [
    "allUsers",
  ]
}


resource "google_storage_bucket_object" "client_files" {
  for_each = fileset("${path.module}/../../services/gilad-portfolio/frontend/dist", "**/*")

  name   = "${each.value}"
  bucket = google_storage_bucket.client_bucket.name
  source = "${path.module}/../../services/gilad-portfolio/frontend/dist/${each.value}"

  content_type = lookup({
    "html"  = "text/html",
    "css"   = "text/css",
    "js"    = "application/javascript",
    "png"   = "image/png",
    "jpg"   = "image/jpeg",
    "svg"   = "image/svg+xml",
    "ico"   = "image/x-icon",
    "json"  = "application/json",
    "txt"   = "text/plain",
    "xml"   = "application/xml",
    "woff"  = "font/woff",
    "woff2" = "font/woff2",
    "ttf"   = "font/ttf",
    "eot"   = "application/vnd.ms-fontobject",
    "otf"   = "font/otf"
  }, try(element(split(".", each.value), length(split(".", each.value)) - 1), ""), "application/octet-stream")

  metadata = {
    /*"Cache-Control" = "public, max-age=86400"*/
    "Cache-Control" = "public, max-age=0, must-revalidate"  # Cache for 1 hour but revalidate
    "Pragma"        = "no-cache",
    "Expires"       = "0"
  }
}
# Upload Cloudflare certificate to GCP


resource "google_compute_ssl_certificate" "main_fe_cloudflare_origin_cert" {
  name        = "main-fe-giladtech-cloudflare-origin"
  private_key = tls_private_key.cloudflare_origin_private_key.private_key_pem
  certificate = cloudflare_origin_ca_certificate.origin_cert.certificate

  depends_on = [  ]
}


# ------------------------
# HTTPS Load Balancer Setup
# ------------------------


# Reserve a global static IP for the load balancer
resource "google_compute_global_address" "frontend_ip" {
  name = "giladtech-global-ip"
}

# Create a backend bucket to serve content from GCS
resource "google_compute_backend_bucket" "frontend_backend" {
  name        = "giladtech-frontend-backend"
  bucket_name = google_storage_bucket.client_bucket.name
  enable_cdn  = true
}

# Create the URL map
resource "google_compute_url_map" "frontend_url_map" {
  name = "giladtech-url-map"

  default_service = google_compute_backend_bucket.frontend_backend.self_link
}

# Create the target HTTPS proxy with Cloudflare's Origin Certificate


resource "google_compute_target_https_proxy" "main_fe_frontend_https_proxy" {
  name             = "main-fe-giladtech-frontend-proxy"
  url_map          = google_compute_url_map.frontend_url_map.id
  ssl_certificates = [google_compute_ssl_certificate.main_fe_cloudflare_origin_cert.id]

  depends_on = [google_compute_ssl_certificate.main_fe_cloudflare_origin_cert]

}

# Create a global forwarding rule for HTTPS traffic
resource "google_compute_global_forwarding_rule" "frontend_forwarding_rule" {
  name       = "main-fe-giladtech-frontend-forwarding-rule"
  target     = google_compute_target_https_proxy.main_fe_frontend_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.frontend_ip.address
}



# ------------------
# Cloudflare DNS Setup
# ------------------

resource "cloudflare_record" "client_site_root" {
  zone_id = var.zone_id
  name    = "giladtech.io"
  type    = "A"
  content = google_compute_global_address.frontend_ip.address
  proxied = true
}

resource "cloudflare_record" "client_site_www" {
  zone_id = var.zone_id
  name    = "www"
  type    = "CNAME"
  content = "giladtech.io"
  proxied = true
}
# ------------------------
# Cloudflare Page Rules
# ------------------------

# Redirect HTTP to HTTPS
resource "cloudflare_page_rule" "https_redirect" {
  zone_id = var.zone_id
  target  = "http://giladtech.io/*"

  actions {
    forwarding_url {
      url         = "https://giladtech.io"
      status_code = 301
    }
  }
}

# Cache everything at Cloudflare edge
resource "cloudflare_page_rule" "cdn_caching" {
  zone_id = var.zone_id
  target  = "www.giladtech.io/*"

  actions {
    cache_level        = "cache_everything"
    edge_cache_ttl     = 86400  # 1-day cache
    browser_cache_ttl  = 14400  # 4-hour browser cache
  }
}

# Redirect root domain to www
resource "cloudflare_page_rule" "redirect_to_www" {
  zone_id = var.zone_id
  target  = "giladtech.io/*"

  actions {
    forwarding_url {
      url         = "https://www.giladtech.io"
      status_code = 301
    }
  }
}
# ------------------
# Cache Purge Output
# ------------------


output "cloudflare_cache_purge" {
  value = "curl -X POST 'https://api.cloudflare.com/client/v4/zones/${var.zone_id}/purge_cache' -H 'Authorization: Bearer ${var.cloudflare_api_token}' -H 'Content-Type: application/json' --data '{\"purge_everything\":true}'"
  depends_on = [ google_storage_bucket_object.client_files ]
}
