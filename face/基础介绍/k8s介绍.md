### k8s特性
1. 强大的基础对象；
2. 动态平台。
使其保证产品的稳定性和可扩展性

### 运维职责
投身发布环节，充分了解业务(1.充分了解所辖项目组的业务代码和开发人员共同owner;2.定位线上问题，给予开发人员提供程序日志；3.充分了解整个上线流程。)，实现价值

### 传统架构上线问题
环境差异性会导致测试环境部署成功过，而生产环境部署失败，究其原因:应用程序依赖未安装，程序文件不对等

### k8s说明
docker作用把打包程序所依赖的相关插件和库文件集成到一个镜像中，而k8s是管理docker如何堆放更合理及更有效。

### k8s组成
由master及node端组成

#### master节点
也称为控制平面: control plane;包括kube-apiserver，kube-scheduler，kube-controller-manager和etcd四个组件

##### kube-apiserver
作用是将一个k8s控制平面中的api暴露出来的api服务，用于接收用户端的操作请求，这服务是k8s控制平面的前端
> 是无状态应用，用户可以运行多个kube-apiserver组件的实例，用于平衡实例的请求流量。

##### kube-scheduler
用于watch监听apiserver的资源变动(增删改查)，并调度至合适的后端node节点，从而来创建pod资源。

##### kube-controller-manager
每个控制器都是独立的二进制进程，包括:Node Controller,Replication Controller,Endpoints Controller和Service Account，以及Token Controllers.

##### etcd
高可用，kv结构的k8s的后端数据存储组件

#### node节点
也称为数据平面: data plane
包括:kubelet, kube-proxy和container runtime三个组件

##### kubelet 
运行在集群每个节点的客户端，需要确保相关容器运行在pod中；通过PodSpecs标签，描述容器的运行状态。

##### kube-proxy
运行在集群每个节点的网络代理组件

##### Container Runtime
支持运行容器底层环境的软件，也支持docker,containerd,cri-o,rktlet等

#### cloud端
##### cloud
作为集群外部的附加能力，通过与cloud-controller-manager组件对接，扩展k8s集群于云上动态扩展的特性。

#### addons(附加组件)
使用k8s resources增加集群功能，如dns,web ui(dashboard),container resource minitoring,cluter-level logging等

### k8s工作流程
#### master
用户通过(api,webui,cli)向apiserver发送请求，kube-scheduler组件监听apiserver的资源变动，同时从node节点中选取最合适的node节点开始调度，并把调度结果保存至etcd中。

#### node
kubelet也会监听apiserver的资源变动，并在符合的node上通过kubelet调用相关的docker引擎进行后续打包和构建操作。

































































