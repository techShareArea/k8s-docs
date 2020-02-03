#### 概念
Label是用于标记Pod,Node,Namespace或其它资源对象的键值对，主要用于再查询或选择时对资源进行条件过滤。Label机制也是K8S中组织ReplicaSet,DaemonSet,Job和Service等概念的基础，它被用于在所有同一组ReplicaSet或DaemonSet以及哪些Pod提供了同一个Service对象的服务

#### 作用
标签，附加到某个资源上，用于关联对象，查询和筛选

#### 语法
> "labels": {   
>  "key1" : "value1",   
>  "key2" : "value2"    
> } 

##### Label key的组成：
1. 不得超过63个字符
2. 可以使用前缀，使用/分隔，前缀必须是DNS子域，不得超过253个字符，系统中的自动化组件创建的label必须指定前缀，kubernetes.io/由kubernetes保留
3. 起始必须是字母（大小写都可以）或数字，中间可以有连字符、下划线和点

##### Label value的组成：
1. 不得超过63个字符
2. 起始必须是字母（大小写都可以）或数字，中间可以有连字符、下划线和点

注：
1. Kubernetes最终将对labels最终索引和反向索引用来优化查询和watch，在UI和命令行中会对它们排序。不要在label中使用大型、非标识的结构化数据，记录这样的数据应该用annotation。

#### 作用
能够将组织架构映射到系统架构上，这样能够更便于微服务的管理
示例:
"ecaicn.com/persistent-env": "dev" 

#### Label selector
Label不是唯一的，很多object可能有相同的label。
通过label selector，客户端／用户可以指定一个object集合，通过label selector对object的集合进行操作。

Label selector有两种类型：
1. equality-based：可以使用=、==、!=操作符，可以使用逗号分隔多个表达式
2. set-based：可以使用in、notin、!操作符，另外还可以没有操作符，直接写出某个label的key，表示过滤有某个key的object而不管该key的value是何值，!表示没有该label的object

示例:
> $ kubectl get pods -l environment=production,tier=frontend    
> $ kubectl get pods -l 'environment in (production),tier in (frontend)'    
> $ kubectl get pods -l 'environment in (production, qa)'   
> $ kubectl get pods -l 'environment,environment notin (frontend)'  

#### 在API object中设置label selector
在service、replicationcontroller等object中有对pod的label selector，使用方法只能使用等于操作，例如：
```
selector:
    component: redis
```
在Job、Deployment、ReplicaSet和DaemonSet这些object中，支持set-based的过滤，例如：
```
selector:
  matchLabels:
    component: redis
  matchExpressions:
    - {key: tier, operator: In, values: [cache]}
    - {key: environment, operator: NotIn, values: [dev]}
```

在node affinity和pod affinity中的label selector的语法又有些许不同，示例如下：
```
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/e2e-az-name
            operator: In
            values:
            - e2e-az1
            - e2e-az2
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: another-node-label-key
            operator: In
            values:
            - another-node-label-value
```

#### 命令使用
查看master/node服务器的node
> kubectl get nodes --show-labels

给master/node打label标签
> kubectl label node master/node ecaicn.com/persistent-env=dev

删除label标签
> kubectl label node master/node ecaicn.com/persistent-env- #-表示     

#### 示例
```
cat > frps/frps-pod.yaml <<-EOF 
apiVersion: v1
kind: Pod
metadata:
  name: frps
  namespace: dev     
  labels:
    app: frps
spec:
  nodeSelector:
    ecaicn.com/persistent-env: dev      # 使用dev的label标签 
  imagePullSecrets:
  - name: ali-shenzhen-registry-secret     
  containers:
  - name: frps
    image: registry-vpc.cn-shenzhen.aliyuncs.com/cj-cloud/cjom-frps:latest
    env: 
    - name: FRPS_TOKEN
      value: Vptivqlefdtxmy4gvNw2  
    ports:
    - containerPort: 7000
      containerPort: 7500
EOF
```
