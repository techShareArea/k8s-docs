### 前言
Deployments和ReplicaSets解决的是无状态服务部署，扩缩容的刚需，而StatefulSet控制器是为了更好地解决有状态服务的部署难题。

### 简述
StatefulSet是一个管理有状态应用的API对象
StatefulSet作为Controller为Pod提供其唯一的标识
> StatefulSet可以保证应用程序部署和扩展的先后顺序     

### 应用场景
StatefulSet适用于有以下某个或多个需求的应用场景:
> 稳定，具有唯一的网络标志；     
> 稳定，含有持久化存储；
> 有序，需要优雅地部署和扩展；
> 有序，能够自动滚动升级。

### 使用限制
知识点回顾:
1. pvc:好比接口，使用者只需要知道这个接口如何使用即可，比如该传哪些参数，哪些是必传的等等，并不需要了解接口是如何实现的；
2. pv:是接口的实现，内部是用nfs,还是ceph的存储系统等。
3. sc(存储类):是这些接口根据一系列规则所进行的抽象类，通过接受pvc请求，从而启动动态实例化pv的效果。        

删除或扩展StatefulSet将不会删除与StatefulSet相关联的volume.

这样做是为了确保数据安全性，通常比自动清除所有相关StatefulSet资源更有价值，StatefulSet以Headless Server标示存在

> Headless Service知识点回顾:
> 这是一个比较特殊的service类型，有时候，你没必要或者不需要负载均衡和一个对外提供服务的ip地址；       
> 在这种情况下，可以在.spec.clusterIp中定义None字段，来申明一个Headless Service      
> 也可以通过coredns组件内部的解析功能，完成相关地址解析的支持作用。      

### StatefulSet组成
Headless Service: 用于为Pod资源标识符生成可解析的DNS记录，每个Pod有唯一且有序的名称(在[0,N)之间)

VolumeClaimTemplates(存储卷申请模板): 基于静态或动态PV供给方式为Pod资源提供专有的固定存储。

StatefulSet:用于管控Pod资源       
> Headless Service在statefulset中是十分必要的，他给每个Pod分配了唯一且有序的名称，当pod资源重建时候，他们将保持自己原有的序号；   
> statefulset定义中的每一个pod都不能使用同一个存储卷，并且有状态应用多半都需要存储系统，所以这时候就需要引入volumeClainTemplate,当在使用statefulset创建pod时，会自动生成一个pvc,从而绑定一个自己专用的pv。       

### 简单示例
开始操作前的准备工作:
> 需要先准备一个存储类:storage-class      

这里的存储类选择之前配置好的managed-nfs-storage(NFS Provisioner)

1. 创建nginx.yaml配置文件，其中serviceName申明了自己的headless service域,storageClassName需要指定成你自己的存储类。








