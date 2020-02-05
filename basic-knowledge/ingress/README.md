#### 概述
Ingress是对集群中服务的外部访问进行管理的API对象，典型的访问方式是HTTP。
Ingress可以提供负载均衡、SSL终结和基于名称的虚拟托管。
Ingress公开了从集群外部到集群内services的HTTP和HTTPS路由。流量路由由Ingress资源上定义的规则控制。
```
    internet
        |
   [ Ingress ]
   --|-----|--
   [ Services ]
```
可以将Ingress配置为提供服务外部可访问的URL、负载均衡流量、终止 SSL/TLS并提供基于名称的虚拟主机。Ingress控制器通常负责通过负载均衡器来实现 Ingress尽管它也可以配置边缘路由器或其他前端来帮助处理流量。
Ingress会公开任意端口或协议。将HTTP和HTTPS以外的服务公开到Internet时，通常使用Service.Type=NodePort或者Service.Type=LoadBalancer类型的服务。
可以将Ingress配置为提供服务外部可访问的URL，负载均衡流量，终止SSL/TLS并提供基于名称的虚拟主机。 Ingress 控制器通常负责通过负载平衡器来实现入口，尽管它也可以配置边缘路由器或其他前端以帮助处理流量。
Ingress不会公开任意端口或协议。将HTTP和HTTPS以外的服务公开给Internet时，通常使用以下类型的服务Service.Type=NodePort或者Service.Type=LoadBalancer

#### 准备
您必须具有ingress控制器才能满足Ingress的要求。仅创建Ingress资源无效。
您可能需要部署Ingress控制器，例如ingress-nginx。您可以从许多Ingress控制器中进行选择。

#### 示例
```
cat > xxx-ingress.yaml <<-EOF 
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
    name: apixxx
    namespace: dev
spec:
    rules:
    - host: dev-xxx-api.ecaicn.com
      http:
        paths:
        - backend:
             serviceName: xxx
             servicePort: 8080
    tls:
      - hosts:
        - "*.ecaicn.com"
        secretName: tls-ecaicn-com
EOF
```
注:ingress需要配合ingress控制器使用

#### service的NodePort类型缺陷
1. 端口容易冲突；
2. NodePort属于四层，不能做七层的事，比如:根据域名/url进行转发
3. 不能统一入口。
