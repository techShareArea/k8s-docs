### Pod简述
如图pod所示，pod中有一个pause容器，和一堆业务容器，它们有各自的pid,mount,和user，但它们共享ipc,uts和Network,名词如下所示:       
```
简称              描述
uts              主机名
ipc            进程间通信
pid           'chroot'进程树
mount            挂载点
network     网络访问，包括接口
user      将本地的虚拟user-id映射到真实的user-id
```

### pod特征
1. 通过使用各自的ipc，使得可以在一个pod中通信
2. 容器可以通过localhost相互访问
3. 每个容器继承pod的名称
4. 每个pod有一个平滑共享网络名称空间的Ip地址
5. pod内部的存储卷是共享的

# pod对象的配置格式
> kind: 定义资源类型，例如:deployment,service等；  
> apiVersion: 定义调用的api版本，所支持的版本可以通过kubectl api-resources查看； 
> metadata: 资源提供源数据信息，如：名称，隶属的名称空间和标签等；     
> spec: 用于定义用户期望的状态，不同的资源类型；    
> status: 记录活动对象的当前状态信息，由k8s系统自动维护，对于用户来说为只读字段。

### pod对象的申明类型
陈述式:    
> kubectl create -f xxx.yaml        

申明式(推荐)：
> kubectl apply -f xxx.yaml     

注:陈述式的命令不能用于多次执行

#### 补充
pod配置字段查询
> kubectl explain pods      

查询pod中的spec字段如何配置
> kubectl explain pods.spec

docker策略
```
docker:
    imagePullPolicy:
        Always: 无论本地有没有镜像，都要去互联网拉(常用于拉取latest的镜像)
        IfNotPresent: 本地有就直接用，没有再去拉
        Nerver: 如果本地没有镜像，就不启动(常用于拉取指定版本的镜像)
# 要勤于使用kubectl explain命令，去查询相关字段的配置格式及要求等，这是学好k8s配置清单的大杀器
```

### 基础yaml格式
```
apiVersion: v1
kind: Pod
metadata:
  name: first-pod
spec:
  containers:
  - name: bash-container
    image: docker.io/busybox
```
注:
> apiVersion定义的是调用哪个核心群组的api        
> kind定义我们需要声明的是哪一类资源       
> metadata为元数据      
> spec为我们期望的状态，其中第一了镜像名称和镜像地址   

另注:可通过如下命令查看containers的配置方法
> kubectl explain pods.spec.containers          

### 三种网络代理方式
k8s提供了3中方式将集群内的服务暴露到集群外
1. service： 申明nodeport类型，可以通过任意节点访问；
2. hostPort: 直接将容器的端口于所调度的节点上端口路由，这样用户就可以通过宿主机的ip来访问pod；
3. hostNetwork: 共享宿主机的网络名称空间        











































































































