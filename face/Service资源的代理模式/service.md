### 简述
service资源时k8s中最核心的资源对象之一，其定义了一个同意访问的服务入口地址，客户端可以通过这个入口地址访问其背后的一组由Pod副本组成的集群实例。Service与其后端Pod副本集群之间则是通过Label Selector标签选择器来实现动态注册和调度。

### Service资源管理Pod方式
1. service通过标签选择器关联至拥有相关标签的Pod对象；
2. 客户端向Service进行请求，而非直接请求Pod对象；
3. Service默认类型为ClusterIP,ExternalName,NodePort,LoadBalancer和Headless这5中类型

注:service配置字段的查看命令:kubectl explain svc

Ⅰ.ClusterIP
如图clustetip所示，客户端pod对象访问服务Pod对象时不会进行源地址转换
二者在同一主机时，源地址为客户端pod地址；
二者在不同主机时，源地址为客户端pod所在节点的flannel或cni地址。
> 注: 只能在集群内部被访问

Ⅱ.NodePort
如图NodePort所示，可以被集群外部访问到，节点的请求会DNAT到ServiceIP,然后再调度到PodIP

Ⅲ.LoadBalancer
需要结合公有云的LBAAS(需要付费)，支持动态介入功能

Ⅳ.ExternalName
如图externalname所示，将集群外部Service引入集群内部共各客户端使用，需要设置标签选择器，并手动定义一个endpoint资源，指向外部的资源地址

Ⅴ.Headless
在不必要或者不需要负载均衡和一个对外提供服务的ip地址时，可以在.spec.clusterIp中定义None字段，来申明一个Headless Service,也可以通过coredns组件内部的解析功能，已完成相关地址解析的支持作用。
> 注:StatefulSet控制器，也是基于Headless网络所构筑的

### Endpoints
endpoints为service中的网络端点，用于接收service发来的请求，并将其转发至相关的上游服务(deployment)

api配置查看
> kubectl explain endpoints     

endpoint信息查看
> kubectl get endpoints -A      

注:自定义endpoint时，需要与service同名
> kubectl get svc   
```NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP          2d11h
```
> kubectl get endpoints     
```
NAME         ENDPOINTS             AGE
kubernetes   172.18.107.140:6443   2d11h
```




















