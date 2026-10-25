# ---------------------------------
# Google Cloud Storage Bucket Setup
# ---------------------------------

resource "google_storage_bucket" "chat_client_bucket" {
  name     = "chat.giladtech.io"
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

resource "google_storage_bucket_iam_binding" "chat_public_access" {
  bucket = google_storage_bucket.chat_client_bucket.name
  role   = "roles/storage.objectViewer"

  members = [
    "allUsers",
  ]
}





resource "google_storage_bucket_object" "chat_client_files" {
  for_each = fileset("${path.module}/../../services/my-chat-app/dist", "**/*")

  name   = "${each.value}"
  bucket = google_storage_bucket.chat_client_bucket.name
  source = "${path.module}/../../services/my-chat-app/dist/${each.value}"

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
    #"Cache-Control" = "public, max-age=86400"
    "Cache-Control" = "public, max-age=0, must-revalidate"  # Cache for 1 hour but revalidate
    "Pragma"        = "no-cache",
    "Expires"       = "0"
  }
}


# ------------------------
# HTTPS Load Balancer Setup
# ------------------------

resource "google_compute_ssl_certificate" "chat_fe_cloudflare_origin_cert" {
  name        = "chat-fe-giladtech-cloudflare-origin"
  private_key = tls_private_key.cloudflare_origin_private_key.private_key_pem
  certificate = cloudflare_origin_ca_certificate.origin_cert.certificate
}


# Reserve a global static IP for the load balancer
resource "google_compute_global_address" "chat_frontend_ip" {
  name = "giladtech-chat-global-ip"
}

# Create a backend bucket to serve content from GCS
resource "google_compute_backend_bucket" "chat_frontend_backend" {
  name        = "giladtech-chat-frontend-backend"
  bucket_name = google_storage_bucket.chat_client_bucket.name
  enable_cdn  = true
}


# Create the URL map
resource "google_compute_url_map" "frontend_chat_url_map" {
  name = "giladtech-chat-url-map"

  default_service = google_compute_backend_bucket.chat_frontend_backend.self_link
}


# Create the target HTTPS proxy with Cloudflare's Origin Certificate
resource "google_compute_target_https_proxy" "frontend_chat_https_proxy" {
  name             = "chat-fe-giladtech-frontend-proxy"
  url_map          = google_compute_url_map.frontend_chat_url_map.id
  ssl_certificates = [google_compute_ssl_certificate.chat_fe_cloudflare_origin_cert.id]

  depends_on = [google_compute_ssl_certificate.chat_fe_cloudflare_origin_cert]
}


# Create a global forwarding rule for HTTPS traffic
resource "google_compute_global_forwarding_rule" "frontend_chat_forwarding_rule" {
  name       = "chat-fe-giladtech-frontend-forwarding-rule-chat"
  target     = google_compute_target_https_proxy.frontend_chat_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.chat_frontend_ip.address
}



# ------------------
# Cloudflare DNS Setup
# ------------------

resource "cloudflare_record" "client_chat_site_root" {
  zone_id = var.zone_id
  name    = "chat.giladtech.io"
  type    = "A"
  content = google_compute_global_address.chat_frontend_ip.address
  proxied = true  # ✅ Enable Cloudflare Proxy
}

resource "cloudflare_record" "client_chat_site_www" {
  zone_id = var.zone_id
  name    = "www.chat"
  type    = "CNAME"
  content = "chat.giladtech.io"
  proxied = true
}
# ------------------------
# Cloudflare Page Rules
# ------------------------

# Redirect HTTP to HTTPS
resource "cloudflare_page_rule" "chat_https_redirect" {
  zone_id = var.zone_id
  target  = "http://chat.giladtech.io/*"

  actions {
    forwarding_url {
      url         = "https://chat.giladtech.io"
      status_code = 301
    }
  }
}

# Cache everything at Cloudflare edge
resource "cloudflare_page_rule" "chat_cdn_caching" {
  zone_id = var.zone_id
  target  = "chat.giladtech.io/*"

  actions {
    cache_level        = "cache_everything"
    edge_cache_ttl     = 86400  # 1-day cache
    browser_cache_ttl  = 14400  # 4-hour browser cache
  }
}

# ------------------
# Cache Purge Output
# ------------------


/*
output "cloudflare_cache_purge" {
  value = "curl -X POST 'https://api.cloudflare.com/client/v4/zones/${var.zone_id}/purge_cache' -H 'Authorization: Bearer ${var.cloudflare_api_token}' -H 'Content-Type: application/json' --data '{\"purge_everything\":true}'"
  depends_on = [ google_storage_bucket_object.chat_client_files ]
}
*/

