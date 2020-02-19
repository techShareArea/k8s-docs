#### 概述
其用于记录和控制pod副本的数量，它使用预定义模板自动创建指定数量的Pod副本实例，并运行到不同的Node节点上。一旦指定了副本数量，k8s就能确保集群中始终有指定数量的pod副本在运行，如果实际数量少于指定数量，k8s会启动新的pod，反之则会关闭多余的Pod，以维持副本数量不变。      
通常用户不会直接操作replicaset对象，而是通过deployment对象间接完成。

