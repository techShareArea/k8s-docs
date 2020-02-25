### 标签
标签是"键值"类型的数据，可于资源创建时直接指定，也可随时按需增加，而后即可由标签选择器进行匹配度检查，从而完成资源的挑选。
> 1.一个对象可拥有不止一个标签，而同一个标签也可被添加至多个资源上；
> 2.我们可以为资源附加多个不同维度的标签，以实现灵活的资源分组管理功能，例如:版本标签，环境标签等，用于交叉标识同一个资源所属的不同版本和环境

### 标签选择器
其用于表达标签的查询条件或选择标准，支持两种选择器:
Ⅰ.基于等值关系
> =,==和!=三种     

Ⅱ.基于集合关系
> in,not in等    

补充:基于label的常用查询命令
```
#关于label的查询帮助命令
kubectl label -h
#基于label的pod查询命令，可以看到每个pod的标签说明
kubectl get pod --show-labels
#筛选标签为app=flannel的pod
kubectl get pod --show-labels -A -l app=flannel
kubectl get pod -A -l app=java-demo -L app
```

### 资源注解(annotation)
不受字符数量的限制，需要注意其于标签区分的是:资源注解不用于标签的筛选，仅用于为资源提供"元数据"信息

资源注解的帮助命令查询
> kubectl annotate -h

### 探针
探针时pod容器生命周期中健康与否，至关重要的相关组件

Ⅰ.liveness
> 健康状态检查，用于检测pod的健康性，后续的操作会重启pod    

注:可以使用explain查询到liveness探针的字段配置说明
> kubectl explain pods.spec.containers.livenessProbe    

编辑liveness-exec.yaml，里面增加一个livenessProbe，用于探测/tmp/healthy文件是否存在，然后使用apply -f命令生成该pod
```
cat > liveness-exec.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness-exec
  name: liveness-exec
spec:
  containers:
  - name: liveness-demo
    image: busybox
    args:
    - /bin/sh
    - -c 
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - test
        - -e 
        - /tmp/healthy
EOF
```

观察pod情况，发现30s之内，pod探测不到/tmp/healthy文件，并进行了重启操作，RESTART为1
> kubectl get pod --show-labels -A -l test=liveness-exec        
```
NAMESPACE   NAME            READY   STATUS    RESTARTS   AGE     LABELS
default     liveness-exec   1/1     Running   1          2m56s   test=liveness-exec
```

也可以通过describe查询到该pod的状态，对于定位报错很有用
> kubectl describe pod liveness-exec        
```
Name:               liveness-exec
Namespace:          default
Priority:           0
PriorityClassName:  <none>
Node:               cangqiong/172.18.107.140
Start Time:         Thu, 20 Feb 2020 09:56:26 +0800
Labels:             test=liveness-exec
Annotations:        kubectl.kubernetes.io/last-applied-configuration:
                      {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"labels":{"test":"liveness-exec"},"name":"liveness-exec","namespace":"default...
Status:             Running
IP:                 10.32.0.5
Containers:
  liveness-demo:
    Container ID:  docker://b15d11f954a621081e1df556d8a87f3b9144f8c2db028408ae65cdaab392be00
    Image:         busybox
    Image ID:      docker-pullable://busybox@sha256:6915be4043561d64e0ab0f8f098dc2ac48e077fe23f488ac24b665166898115a
    Port:          <none>
    Host Port:     <none>
    Args:
      /bin/sh
      -c
      touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    State:          Running
      Started:      Thu, 20 Feb 2020 10:03:56 +0800
    Last State:     Terminated
      Reason:       Error
      Exit Code:    137
      Started:      Thu, 20 Feb 2020 10:02:29 +0800
      Finished:     Thu, 20 Feb 2020 10:03:53 +0800
    Ready:          True
    Restart Count:  5
    Liveness:       exec [test -e /tmp/healthy] delay=0s timeout=1s period=10s #success=1 #failure=3
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-stcc8 (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  default-token-stcc8:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-stcc8
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:
  Type     Reason     Age                    From                Message
  ----     ------     ----                   ----                -------
  Normal   Scheduled  7m43s                  default-scheduler   Successfully assigned default/liveness-exec to cangqiong
  Normal   Pulled     4m43s (x3 over 7m39s)  kubelet, cangqiong  Successfully pulled image "busybox"
  Normal   Created    4m43s (x3 over 7m39s)  kubelet, cangqiong  Created container liveness-demo
  Normal   Started    4m43s (x3 over 7m39s)  kubelet, cangqiong  Started container liveness-demo
  Normal   Killing    3m46s (x3 over 6m46s)  kubelet, cangqiong  Container liveness-demo failed liveness probe, will be restarted
  Normal   Pulling    3m16s (x4 over 7m42s)  kubelet, cangqiong  Pulling image "busybox"
  Warning  Unhealthy  2m36s (x10 over 7m6s)  kubelet, cangqiong  Liveness probe failed:
```

如下是关于nginx的探针yaml文件
```
cat > liveness-nginx.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness-nginx
  name: liveness-nginx
spec:
  containers:
  - name: liveness-nginx
    image: nginx:1.12-alpine
    ports:
    - name: http
      containerPort: 80
    lifecycle:      
      postStart:
        exec:
          command:
          - /bin/sh
          - -c
          - 'echo Healthy > /usr/share/nginx/html/healthz'
    livenessProbe:
      httpGet:
        path: /healthz
        port: http              # 上面定义的变量，值为80
        scheme: HTTP
      periodSeconds: 2          # 检测频率，2s检查一次
      failureThreshold: 2       # 检查失败次数，2次失败才认为失败
      initialDelaySeconds: 3    # 延迟检查时间，如tomcat初始化需要有一定时间，需要用到这个参数
      timeoutSeconds: 2         # 超时时间为2s
EOF
```
补充:     
创建资源对象时，可以使用lifecycle来管理容器在运行前和关闭前的一些动作。
> lifecycle有两种回调函数：     
> 1.PostStart：容器创建成功后，运行前的任务，用于资源部署、环境准备等;        
> 2.PreStop：在容器被终止前的任务，用于优雅关闭应用程序、通知其他系统等等;     
> 示例详见:https://blog.csdn.net/liyingke112/article/details/78123945   
> https://www.cnblogs.com/breezey/p/9233344.html

Ⅱ.readiness
> 就绪状态检查，没有重启pod的权利，用于为service流量分发，集群预热作为依据

注:可以使用explain查询到readiness探针的字段配置说明
> kubectl explain pods.spec.containers.readinessProbe

编辑readiness-exec.yaml,增加readiness探针，用于测试/tmp/ready文件是否存在，该探针第一次探测为第5s开始，探测周期为5s
```
cat > readiness-exec.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: readiness-exec
  name: readiness-exec
spec:
  containers:
  - name: readiness-exec
    image: busybox
    args:
    - /bin/sh
    - -c
    - while true; do rm -rf /tmp/ready; sleep 30; touch /tmp/ready; sleep 300; done
    readinessProbe:
      exec:
        command: 
          - test
          - -e
          - /tmp/ready
      initialDelaySeconds: 5
      periodSeconds: 5
EOF
```

### pod对象的相位
pod一共有5个状态，分别为:Pending,Running,Succeeded,Failed和Unknow，具体如下所示:
```
Pending: Pod未完成调度，通常由于没有符合调度需求的node节点；
Running: Pod已经调度成功，且已被kubelet创建完成；
Succeeded: Pod中的所有容器已经成功且不会被重火器；
Failed: Pod中至少有一个容器终止失败；
Unknown: APIserver无法获取Pod对象的状态信息，通常由于其无法与所在工作节点的kubelet通信所致。
```

### pod security
pod对象的安全上下文用于设定Pod或容器的权限和访问控制功能，其支持设置的常用属性包括以下几个方面:
> 1.基于用户id(uid)和组id(gid)控制访问对象(如文件)时的权限     
> 2.以特权或非特权的方式运行        
> 3.通过linux capabilities为其提供部分特权        
> 4.基于seccomp过滤进程的系统调用      
> 5.基于selinux的安全标签      
> 6.是否能够进行权限升级       

其中包括2个安全级别:
1. kubectl explain pod.spec.securityContext
2. kubectl explain pod.spec.containers.[].securityContext.capabilities

如下示例为:以uid为1000的非特权用户运行busybox容器，并禁止权限升级
```
cat > pod-security.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  labels: security-123
  name: security-123
spec:
  containers:
  - name: security-123
    image: busybox
    command:
      - /bin/sh
      - -c
      - sleep 86400
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
      allowPrivilegeEscalation: false
EOF
```

效果如下所示:
> kubectl exec -it security-123 -- /bin/
```
/ $ mkdir haha
mkdir: can't create directory 'haha': Permission denied
```

### pod资源配额
资源配额的配置文档查询帮助命令:
> kubectl explain pod.spec.containers.resources     

参数说明:
```
limits:
    上限额度，最多配置的资源量
requests:
    下限要求，低于下限，pod会启动失败
```    

互联网中经常会出现OOM内存溢出的情况，在k8s中往往是以下两点问题引起:
> 1.节点内存太少；
> 2.limits限制的太小

示例:
```
cat > pod-limits.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: pod-limits
  name: pod-limits
spec:
  containers:
  - name: pod-limits
    image: registry.cn-hangzhou.aliyuncs.com/aaron89/stress-ng
    command:
      - /usr/bin/stress-ng
      - -c 1
      - -m 1
      - --metrics-brief
    resources:
      requests:
        memory: "128Mi"
        cpu: "200m"
      limits:
        memory: "512Mi"
        cpu: "400m"
EOF
```

### pod服务质量类别(QoS Class)
k8s语境中会根据用户是否配置了pod资源配额来分别定义对应pod资源的重要程度，有如下三类:
1. guaranteed: 必须保证，requests和limits字段都有设置，最高优先级；
2. burstable: 尽量满足，requests或limits字段有一个设置了，中等优先级；
3. besteffort: 尽最大努力，未设置requests或limits字段属性的pod资源，优先级最低

> Qos优先级定义的引入是十分有用的，当我们计算资源变动且出现不足情况的时候，就需要踢出pod资源，k8s就会先下线besteffort级别的资源，从而保证核心业务(guaranteed级别)的稳定性

### Pod中断预算
pdb(PodDisruptionBudget)中断预算由k8s1.4版本引入，用于为那些资源的终端做好预算方案
限制可自愿终端的最大Pod副本书或确保最少可用的Pod副本书，以确保服务的高可用性

Ⅰ.终端预算查询
> kubectl get pdb

Ⅱ.示例
```
cat > pod-pdb.yaml <<EOF 
apiVersion: policy/v1beta1
kind: PodDisruptionBudget
metadata:
  name: my-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
    test: pod-limits
EOF
```

中断预算细分为以下两大类:
Ⅰ.非资源终端
> 由不可控的外界因素所导致的Pod终端推出操作，例如:硬件或系统故障，网络故障，节点故障等

Ⅱ.资源中断
> 由用户特地执行的管理操作导致的Pod中断，例如:排空节点，人为删除Pod对象等
























