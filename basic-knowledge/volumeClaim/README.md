#### 概述
其是k8s中用于声明可用数据卷的对象，这样做是为了将数据卷的资源分配和使用数据卷的服务部署解耦。每个vc对象代表了一定容量的存储资源，并使用元数据对其加以描述，要想使用存储资源的服务只需声明所需的容量和其他特征，由k8s自定进行关联管理。
