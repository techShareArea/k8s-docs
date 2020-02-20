### 简述
DaemonSet是一个确保每个符合规则的node节点有且仅有一个对应Pod的控制器
> 1.新节点加入集群，也会新增一个Pod   
> 2.当节点下线后，相应Pod也会被回收   
> DaemonSet控制器的应用场景，就是解决日志收集，监控系统等客户端部署的刚需  

### 补充
可以使用kubectl get ds查看DaemonSet
> kubectl get ds -A     
```
NAMESPACE     NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
kube-system   kube-proxy   1         1         1       1            1           <none>          2d9h
kube-system   weave-net    1         1         1       1            1           <none>          2d9h
```

注:
```
上面展示的weave控制器，正式我们初始化集群的时候添加的
k8s先根据node机器特征，使用其对应框架的weave控制器
然后根据DaemonSet控制器的特性，在每个node节点部署一个，且只部署一个
```

### 示例
日志收集的业务场景是C/S架构，需要在待收集的机器部署一个客户端应用
























