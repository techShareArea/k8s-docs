#### 概述
其使得用户能够以ns为单位给每个租户设置资源用量的限制，这个特性体现了租户的意义:避免单个用户耗尽所有服务资源以及作为计费功能的基础。k8s的resourceQuote提供两种类型的资源限制:硬件资源用量(CPU和内存)，以及可创建对象总数(pod/service/configmap等)

