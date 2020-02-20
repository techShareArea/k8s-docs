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
创建一个filebeat的daemonset控制器，它们会和日常需求一样，在每个客户端node节点部署一个filebeat的pod容器
```
cat > filebeat-daemonset.yaml <<EOF 
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat-ds
  labels:
    app: filebeat
spec:
  selector:
    matchLabels:
      app: filebeat
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      containers:
      - name: filebeat
        image: prima/filebeat:6.4.2
        env:
        - name: REDIS_HOST
          value: test.com:6379
        - name: LOG_LEVEL
          value: info
EOF
```

查看ds部署情况:
> kubectl get ds        
```
NAME          DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
filebeat-ds   1         1         0       1            0           <none>          10m
```

查看filebeat的pod落在node情况
> kubectl get pod --all-namespaces -o wide      
```
NAMESPACE     NAME                                READY   STATUS             RESTARTS   AGE     IP               NODE        NOMINATED NODE   READINESS GATES
default       filebeat-ds-wplqs                   0/1     CrashLoopBackOff   7          12m     10.32.0.6        cangqiong   <none>           <none>
```

注:因是演示，故filebeat的Pod有误，这个可以忽视
> kubectl logs -f filebeat-ds-wplqs     
```
Exiting: error loading config file: stat filebeat.yml: no such file or directory
```

### 补充
资源的部署创建始终没有在master节点上调度，原因如下：
master节点上有Taints污点(NoScheduler),故未定义容忍度的资源是不会调度上来的


















