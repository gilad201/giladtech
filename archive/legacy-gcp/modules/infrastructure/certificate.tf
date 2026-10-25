resource "cloudflare_zone_settings_override" "zone_ssl" {
  zone_id = var.zone_id

  settings {
    ssl = "strict"
  }
}

resource "tls_private_key" "cloudflare_origin_private_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "cloudflare_origin_cert_request" {
  private_key_pem = tls_private_key.cloudflare_origin_private_key.private_key_pem

  subject {
    common_name  = "giladtech.io"
    organization = "Gilad Tech"
  }

  dns_names = [
    "giladtech.io",
    "*.giladtech.io"
  ]
}
///
resource "cloudflare_origin_ca_certificate" "origin_cert" {
  hostnames        = ["giladtech.io", "*.giladtech.io"]
  csr              = tls_cert_request.cloudflare_origin_cert_request.cert_request_pem
  requested_validity = 5475  # Maximum validity (15 years)
  request_type     = "origin-rsa"

  lifecycle {
    create_before_destroy = true
  }
}


resource "kubernetes_secret" "cloudflare_origin_cert" {
  metadata {
    name      = "cloudflare-origin-cert"
    namespace = "llm-app"
  }

  data = {
    "tls.crt" = cloudflare_origin_ca_certificate.origin_cert.certificate
    "tls.key" = tls_private_key.cloudflare_origin_private_key.private_key_pem
  }

  type = "kubernetes.io/tls"
  depends_on = [ cloudflare_origin_ca_certificate.origin_cert ]
}