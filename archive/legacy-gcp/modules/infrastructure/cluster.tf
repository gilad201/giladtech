provider "google" {
  project = "gilad-home"
  region  = "us-central1"
}

resource "google_container_cluster" "gilad" {
  name               = "gilad"
  location           = "us-central1-f"
  deletion_protection= false
  initial_node_count = 1

  remove_default_node_pool = true  # Remove default node pool to create a custom one

  networking_mode = "VPC_NATIVE"

  ip_allocation_policy {}

}

resource "google_container_node_pool" "gilad_node_pool" {
  name       = "gilad-node-pool"
  cluster    = google_container_cluster.gilad.name
  location   = "us-central1-f"

  node_count = 1  # Initial number of nodes

  lifecycle {
    ignore_changes = [node_count]  # Ignore changes to node_count
  }


  autoscaling {
    min_node_count = 1  # Minimum number of nodes
    max_node_count = 4  # Maximum number of nodes
  }

  node_config {
    machine_type = "e2-micro" // "e2-medium"  # Node type (can be upgraded to e2-medium, etc.)
    preemptible  = false

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = "dev" #"production"
    }

    tags = ["gilad-app"]
  }
}

/*
resource "google_compute_global_address" "static_ip" {
  name = "my-global-static-ip"
}
*/

resource "google_compute_address" "static_ip" {
  name   = "my-static-ip"
  region = "us-central1"  # Set the region to match your GKE cluster
}
