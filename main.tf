# giladtech.io — Cloudflare-only setup.
#
# The old GCP stack (GKE cluster, HTTPS load balancer, GCS bucket, nginx
# ingress, python-api, chat frontend) was destroyed in Feb 2025 and its
# config now lives in archive/legacy-gcp/ — Terraform no longer loads it.
# The portfolio is a static site on Cloudflare Pages: no servers, $0/month.
# GCP (project gilad-home) is free to come back for dynamic pieces, e.g. a
# Cloud Run service that scales to zero.

terraform {
  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
