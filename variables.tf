variable "cloudflare_api_token" {
  description = "Cloudflare API token: Account > Cloudflare Pages: Edit; Zone > DNS: Edit (giladtech.io)"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID (dashboard > giladtech.io > Overview, right sidebar)"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID for giladtech.io"
  type        = string
}

variable "domain" {
  description = "Apex domain"
  type        = string
  default     = "giladtech.io"
}

variable "portfolio_project_name" {
  description = "Cloudflare Pages project name (becomes <name>.pages.dev)"
  type        = string
  default     = "gilad-portfolio"
}
