### k8s结构
k8s集群采用主从结构，服务器节点依据角色分为master节点跟node节点，两种节点分别运行不同的服务进程，master节点的主要作用是控制和管理整个集群的状态，并接受外部用户的操作请求。

#### master节点
其主要运行kube-apiserver,kube-scheduler,kube-controller-manager

##### kube-apiserver
其服务是整个k8s集群管理系统的核心，也是部署k8s系统时应该最先启动的组件。其它所有组件都会在启动时介入这个服务，以获取集群的信息或注册自己的信息。这些功能主要是通过管理etcd存储的集群状态信息，并对外提供Restful API实现的。

##### kube-scheduler
其服务是k8s种负责用户服务调度的子模块，它能够根据集群当前的资源使用情况选择适合运行特定服务的节点，由于调度的策略与实际的底层硬件关系比较密码，k8s将这部分功能设计为单独组件，使其能在未来适配更多现有的系统。

##### kube-controller-manager
其服务负责管理k8s系统中各种资源的状态。具体来说，依据其监控的资源种类，它包括管理Pod副本数量的ReplicationController，管理Service映射的EndpointController，管理多租户空间的NamespaceController等十多种不同种类的模块，以Goroutime协程的形式运行

注:主节点还可能运行Kube-dns,kube-discovery。

#### node节点
node节点是实际执行用户任务的地方，需要运行两种k8s服务进程，分别是kube-proxy和kubelet。

##### kube-proxy
其服务是为了解决从Node节点中的Pod对k8s特定service访问时的路由问题。每当k8s创建一个Service的Endpoint，各个node节点上的kube-proxy进程就会修改节点系统的iptables网络规则，使得当该节点上的Pod访问相应Endpoint的虚拟IP和端口时，请求会被分发到正确的节点和容器进行处理。

##### kubelet
其服务时直接和节点上的容器服务打交道的通道，目前支持Docker和Rkt两种容器实现。它接受外部请求，并创建新的Pod或汇报所在节点上的Pod运行状态。此外，kubelet有两种运行模式:standalone或cluster。在cluster模式下，kubelet还会定期从master节点的kube-apiserver服务同步分配到当前节点的Pod信息，并根据这些信息启动或停止相应的容器。

#### etcd
分布式存储组件，k8s主节点会将集群的状态信息存储在该组件中。是一个单进程的服务，以单点模式或集群模式运行。如果使用单点模式，通常可以将它直接启动在master节点上。如果使用的是集群模式，则应该增加专用的节点，用来创建etcd的存储集群。





`
