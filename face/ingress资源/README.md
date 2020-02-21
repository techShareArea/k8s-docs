### ingress简述
前言:对于负载均衡和外网代理的解决方案，云上环境，我们使用SLB；传统环境，我们选择Haproxy,LVS;而对于k8s体系，宜选择ingress。

ingress是一个管理k8s集群南北流量的api对象，典型的由HTTP;并且可以提供:LB负载均衡的能力。
注: 
> 1.南北流量和东西流量时服务网格中的经常描述网络流量的术语。        
> 1.1南北流量(NORTH-SOUTH): 集群外部-->集群内部     
> 1.2东西流量(EAST-WEST traffic): 集群内部互相访问      
> 2.ingress仅是一段配置，你可以理解为SLB的配置信息片段；实例化SLB能力的话，还需要ingress controller配置使用

### ingress controller
其是一种能读懂ingress配置，并将其翻译成自己配置文件的应用程序，常见有如下几种:
> 1.ingress-nginx;      
> 2.kong;       
> 3.traefik;        
> 4.istio;     
> 5.envoy等。

注:
> 1.Ingress Controller:将ingress配置信息转换为自身配置的应用程序；        
> 2.ingress:只定义流量转发和调度的通用格式的配置信息        

### ingress代理逻辑
如ingress代理逻辑图，基于ingress-nginx的技术栈，通过nodeport类型的service，将ingress服务暴露到集群外，共客户端访问。
注:
> 1.ingress controllers是实际的应用程序；    
> 2.ingress只是转发的配置信息，通过ingress controllers实例化，并且通过lua语言，在ingress-nginx的pod中，实例化成一个基础的Nginx配置文件而已，和传统的nginx并无太大的差异。      

### ingress-nginx部署和测试  
启动配置清单      
> kubectl apply -f mandatory.yaml       

查看pod是否运行成功
> kubectl get pod -n ingress-nginx      
```
NAME                                       READY   STATUS    RESTARTS   AGE
nginx-ingress-controller-6cf675cd7-4s8sn   1/1     Running   0          56s
```

暴露端口服务
```
cat > nginx-ingress-service.yaml <<EOF 
apiVersion: v1
kind: Service
metadata:
  name: nginx-ingress-controller
  namespace: ingress-nginx
spec:
  type: NodePort
  ports:
    - port: 80
      name: http
      nodePort: 30080
    - port: 443
      name: https
      nodePort: 30443
  selector:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
EOF
kubectl apply -f nginx-ingress-service.yaml     
```

查看svc暴露服务状态
> kubectl get svc -n ingress-nginx      
```
NAME                       TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
nginx-ingress-controller   NodePort   10.104.201.235   <none>        80:30080/TCP,443:30443/TCP   14m
```

此时可以通过ip:30080或ip:30443访问到nginx404页面

#### 暴露deployment服务示例
部署deployment与svc服务
```
cat > myapp-dp-svc.yaml <<EOF 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
      rel: beta
  template:
    metadata:
      labels:
        app: myapp
        rel: beta
    spec:
      containers:
      - name: myapp
        image: registry.cn-hangzhou.aliyuncs.com/aaron89/myapp:v1

---
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: NodePort
  selector:
    app: myapp
    rel: beta
  ports:
  - name: http
    port: 8088
    targetPort: 80
    nodePort: 30088
EOF
kubectl apply -f myapp-dp-svc.yaml
```

部署ingress服务
```
cat > myapp-ingress.yaml <<EOF 
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: myapp
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: football.bar.com
    http:
      paths:
      - path: /
        backend:
          serviceName: myapp
          servicePort: 8088
EOF
kubectl apply -f myapp-ingress.yaml
```

查看deployment,pod,svc,ingress情况
> kubectl get deployment,pod,svc,ingress        
```
NAME                                   READY   UP-TO-DATE   AVAILABLE   AGE
deployment.extensions/myapp            2/2     2            2           10m

NAME                                  READY   STATUS             RESTARTS   AGE
pod/myapp-5649b9795-7wrd4             1/1     Running            0          9m59s
pod/myapp-5649b9795-qm7ml             1/1     Running            0          9m58s

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/myapp        NodePort    10.99.88.97     <none>        8088:30088/TCP   9m59s

NAME                       HOSTS              ADDRESS   PORTS   AGE
ingress.extensions/myapp   football.bar.com             80      14m
```

添加本机域名解析
```
cat >> /etc/hosts <<EOF
172.18.107.140  football.bar.com
EOF
```
curl football.bar.com访问部署情况

### tomcat实战演练
```
cat > tomcat-svc-ingress.yaml <<EOF
---
apiVersion: v1
kind: Namespace
metadata:
  name: eshop

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tomcat
  namespace: eshop
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tomcat
      rel: beta
  template:
    metadata:
      namespace: eshop
      labels:
        app: tomcat
        rel: beta
    spec:
      containers:
      - name: tomcat
        image: tomcat:alpine

---
apiVersion: v1
kind: Service
metadata:
  name: tomcat
  namespace: eshop
spec:
  selector:
    app: tomcat
    rel: beta
  ports:
  - name: http
    port: 8808
    targetPort: 8080
    nodePort: 31808
  - name: ajp
    port: 8809
    targetPort: 8009
    nodePort: 31809
  type: NodePort

---
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: tomcat
  namespace: eshop
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: eshop.foo.com
    http:
      paths:
      - path: /
        backend:
          serviceName: tomcat
          servicePort: 8808
EOF
kubectl apply -f tomcat-svc-ingress.yaml
```

查看deployment,pod,svc,ingress状态
> kubectl get deployment,pod,svc,ingress -n eshop       
```
NAME                           READY   UP-TO-DATE   AVAILABLE   AGE
deployment.extensions/tomcat   2/2       2            2           2m14s

NAME                          READY   STATUS              RESTARTS   AGE
pod/tomcat-58fc98cf59-2z5lf   1/1     Running              0          2m36s
pod/tomcat-58fc98cf59-8dljx   1/1     Running              0          2m36s

NAME             TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)                         AGE
service/tomcat   NodePort   10.103.1.43   <none>        8808:31808/TCP,8809:31809/TCP   74s

NAME                        HOSTS           ADDRESS   PORTS   AGE
ingress.extensions/tomcat   eshop.foo.com             80      2m36s
```

添加本机域名解析
```
cat >> /etc/hosts <<EOF
172.18.107.140  eshop.foo.com
EOF
```
curl eshop.foo.com访问部署情况











