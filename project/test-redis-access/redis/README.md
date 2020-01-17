#### 创建关于nodeSelector的label
> kubectl label node cj-sz-ftwgygz ecaicn.com/persistent-env=dev
 
#### 创建为dev的命名空间
> kubectl create ns dev

#### 创建关于上海时间的confinmap
> kubectl create cm timezone --from-file=../timezone/ -n dev

#### 部署redis pod节点
> kubectl apply -f ./redis-pod.yaml     

#### 部署redis svc节点
> kubectl apply -f ./redis-svc.yaml

#### 查看命令
查看redis pod节点情况
> $ ubectl get pod redis -n dev       
> NAME    READY   STATUS    RESTARTS   AGE      
> redis   1/1     Running   0          137m     

查看redis svc情况
> $ kubectl get svc -n dev      
> NAME    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE       
> redis   ClusterIP   10.103.195.224   <none>        6379/TCP   132m          

查看redis pod的日志输出情况
> kubectl logs -f redis -n dev  
```
1:C 17 Jan 2020 12:04:45.291 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
1:C 17 Jan 2020 12:04:45.291 # Redis version=5.0.7, bits=64, commit=00000000, modified=0, pid=1, just started
1:C 17 Jan 2020 12:04:45.291 # Warning: no config file specified, using the default config. In order to specify a config file use redis-server /path/to/redis.conf
1:M 17 Jan 2020 12:04:45.292 * Running mode=standalone, port=6379.
1:M 17 Jan 2020 12:04:45.292 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
1:M 17 Jan 2020 12:04:45.292 # Server initialized
1:M 17 Jan 2020 12:04:45.292 # WARNING you have Transparent Huge Pages (THP) support enabled in your kernel. This will create latency and memory usage issues with Redis. To fix this issue run the command 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' as root, and add it to your /etc/rc.local in order to retain the setting after a reboot. Redis must be restarted after THP is disabled.
1:M 17 Jan 2020 12:04:45.293 * Ready to accept connections
```

进入redis pod的界面
> kubectl exec -it redis /bin/bash -n dev

进入redis pod的命令行
> kubectl exec -it redis redis-cli -n dev
127.0.0.1:6379>

查看redis pod的详细信息
> kubectl describe pod redis -n dev     
```
Name:               redis
Namespace:          dev
Priority:           0
PriorityClassName:  <none>
Node:               cj-sz-ftwgygz/10.0.5.225
Start Time:         Fri, 17 Jan 2020 12:04:44 +0800
Labels:             app=redis
Annotations:        kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"labels":{"app":"redis"},"name":"redis","namespace":"dev"},"spec":{"container...
Status:             Running
IP:                 10.32.0.2
Containers:
  redis:
    Container ID:   docker://a8a3e6fd356e1552f614aacdf41e36ac0d0f10b4f5ef0921ae58613cc9865b8a
    Image:          redis:5
    Image ID:       docker-pullable://redis@sha256:90d44d431229683cadd75274e6fcb22c3e0396d149a8f8b7da9925021ee75c30
    Port:           6379/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Fri, 17 Jan 2020 12:04:45 +0800
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /data from redis-data (rw)
      /etc/localtime from localtime (ro)
      /etc/timezone from timezone (ro,path="timezone")
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-74drv (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  redis-data:
    Type:          HostPath (bare host directory volume)
    Path:          /data/volumes/redis
    HostPathType:  
  timezone:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      timezone
    Optional:  false
  localtime:
    Type:          HostPath (bare host directory volume)
    Path:          /usr/share/zoneinfo/Asia/Shanghai
    HostPathType:  
  default-token-74drv:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-74drv
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  ecaicn.com/persistent-env=dev
Tolerations:     
Events:          <none>
```

#### 部署centos deployment节点
> kubectl apply -f ../centos/centos-deployment.yaml

#### 部署centos svc节点
> kubectl apply -f ../centos/centos-svc.yaml

#### centos访问redis
> kubectl exec -it centos /bin/bash -n dev  
> ping -c 2 redis.dev.svc.cluster.local

#### 查看帮助
查看所有pod节点的详细信息
> kubectl get pods -o wide -n cj-dev

查看所有svc的详细信息
> kubectl get svc -o wide -n cj-dev