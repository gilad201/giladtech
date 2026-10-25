variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "gilad"
}

variable "region" {
  description = "GCP Region"
  default     = "us-central1"
}

variable "region_zone" {
  description = "GCP Zone"
  default     = "us-central1-f"
}