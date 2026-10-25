terraform {
    required_providers {
      kubectl = {
        source  = "gavinbunney/kubectl"
        version = ">= 1.14.0"
      }
      kubernetes = {
        source  = "hashicorp/kubernetes"
        version = ">= 2.11.0"
      }
    }
  }