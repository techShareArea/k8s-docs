#### 概述
其在k8s的1.5版本前称为petSet，是用于部署和运行有持久化状态服务的方式，它与replicaSet属于同一类型的概念，代表指定数量的pod副本集合。由statefulSet管理的每一个pod副本集都有一个唯一的名称，并在集群的DNS中添加一个单独的域名记录，在该副本的整个生命周期里，它所获得的域名和挂载的数据卷都会保持一致，即便运行升级替换了Pod的内容，原先存储的数据依然会跟随它。