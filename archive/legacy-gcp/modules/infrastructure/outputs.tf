output "cluster_name" {
  value = google_container_cluster.gilad.name
}

output "static_ip_address" {
  value = google_compute_address.static_ip.address
}

output "cluster_endpoint" {
  value = google_container_cluster.gilad.endpoint
}

output "cluster_ca_certificate" {
  value = google_container_cluster.gilad.master_auth.0.cluster_ca_certificate
}

output "main_origin_certificate" {
  value     = cloudflare_origin_ca_certificate.origin_cert.certificate
  sensitive = true
}