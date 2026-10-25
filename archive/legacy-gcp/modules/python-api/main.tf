resource "kubectl_manifest" "llm_app_deployment" {
    yaml_body = file("${path.module}/llm-deployment.yaml")
}

resource "kubectl_manifest" "llm_app_service" {
  yaml_body = file("${path.module}/llm-deployment-service.yaml")
}