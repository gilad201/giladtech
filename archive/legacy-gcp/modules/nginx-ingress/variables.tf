variable "cluster_name" {
  description = "Name of the GKE cluster"
  type        = string
}

variable "cluster_endpoint" {
  description = "GKE cluster endpoint"
  type        = string
}

variable "static_ip_address" {
  description = "static ip address"
  type        = string
}

variable "cluster_ca_certificate" {
  description = "CA certificate for the GKE cluster"
  type        = string
  sensitive   = true
}

