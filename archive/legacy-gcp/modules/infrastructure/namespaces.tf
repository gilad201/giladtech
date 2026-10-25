resource "kubectl_manifest" "llm_app_namespace" {
  yaml_body = file("${path.module}/namespace/llm-namespace.yaml")
}

resource "kubectl_manifest" "nginx_ingress_namespace" {
  yaml_body = file("${path.module}/namespace/nginx-ingress-namespace.yaml")
}


resource "kubectl_manifest" "chat_app_namespace" {
  yaml_body = file("${path.module}/namespace/chat-namespace.yaml")
}