resource "null_resource" "apply_nginx_ingress" {
  provisioner "local-exec" {
    command = "kubectl apply -f ${path.module}/nginx-ingress-controller.yaml"
  }
}

resource "kubectl_manifest" "microservices_ingress" {
  yaml_body = file("${path.module}/microservices-ingress.yaml")

  depends_on = [
    null_resource.apply_nginx_ingress
  ]
}

/*
resource "null_resource" "apply_nginx_ingress_lb_ip" {
  provisioner "local-exec" {
    command = "kubectl patch svc ingress-nginx-controller -n ingress-nginx -p '{\"spec\": {\"loadBalancerIP\": \"${var.static_ip_address}\"}}'"
  }
  depends_on = [
    null_resource.apply_nginx_ingress
  ]
}
*/