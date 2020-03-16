### 控制器对象的分类

Ⅰ.守护进程型
1. 无状态应用:非系统级应用
> 应用场景: nginx,apache等http服务器            
> 推荐控制器: Deployment

2. 无状态应用:系统级应用
> 应用场景: 日志和监控收集的客户端，特点是每个node节点需要且只需要运行1个pod客户端     
> 推荐控制器: DaemonSet  

3. 有状态应用
> 应用场景: 数据库，消息队列等；eg:redis,mysql集群      
> 推荐控制器: StatefulSet    

Ⅱ.非守护进程型
> Job控制器: 用于一次性任务       
> Cronjob控制器: 用于定时任务    

### deployment简介
其提供申明Pod更新和ReplicaSet状态的控制器
如图deployment更新机制，其是基于滚动更新的，具体顺序如下:
1. 首先，创建一个RS控制器，版本为V2;
2. 接着将旧控制器的pod陆续下线，同时新的RS控制器通途上线对应Pod;
3. Pod更新完成后，弃用旧的RS控制器，滚动发布就此完成。
> 可以另起一个终端，使用kubectl get pod -o wide -w观察pod的更新情况，使用kubectl get rs -o wide观察RS控制器的名字，状态等信息。也可以使用pause命令实现基于deployment的金丝雀发布策略。

#### 滚动发布和回滚实战
示例如下，给定了滚动策略: 最多新增一个(maxSurge)和最少下线一个(maxUnavailable)
```
cat > dp/dp-update.yaml <<EOF 
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: dp-update
  name: dp-update
spec:
  replicas: 3
  minReadySeconds: 10
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  selector:
    matchLabels:
      app: nginx
      rel: stable
  template:
    metadata:
      labels:
        app: nginx
        rel: stable
    spec:
      containers:
      - name: nginx
        image: nginx:1.10-alpine
        ports:
        - name: http
          containerPort: 80
        readinessProbe:
          periodSeconds: 1
          httpGet:
            path: /
            port: http
EOF
kubectl apply -f dp-update.yaml
```

查看rs情况
> kubectl get rs -o wide    
```
NAME                   DESIRED   CURRENT   READY   AGE     CONTAINERS   IMAGES                  SELECTOR
dp-update-5d9d745844   3         3         3       7m15s   nginx        nginx:1.10-alpine       app=nginx,pod-template-hash=5d9d745844
```

注:把nginx:1.10-alpine改为nginx:1.11-alpine后，执行如下命令:
> kubectl apply -f dp-update.yaml       

查看rs情况
> kubectl get rs -o wide    
```
kubectl get rs -o wide
NAME                        DESIRED   CURRENT   READY   AGE     CONTAINERS   IMAGES              SELECTOR
dp-update-5d9d745844        0         0         0       23m     nginx        nginx:1.10-alpine   app=nginx,pod-template-hash=5d9d745844
dp-update-5f7f6564c5        3         3         3       32s     nginx        nginx:1.11-alpine   app=nginx,pod-template-hash=5f7f6564c5
```

查看更新历史版本
> kubectl rollout history deployment/dp-update      
```
deployment.extensions/dp-update 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```
由于前几次发布没有新增--record=true字段，所以显示为none

回滚上一个版本
使用rollout undo命令进行回滚，默认--to-revision=0(上一个版本)
> kubectl rollout undo deployment/dp-update --to-revision=0

查看回滚情况
> kubectl get rs -o wide      
```
NAME                        DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES              SELECTOR
dp-update-5d9d745844        3         3         3       37m   nginx        nginx:1.10-alpine   app=nginx,pod-template-hash=5d9d745844
dp-update-5f7f6564c5        0         0         0       14m   nginx        nginx:1.11-alpine   app=nginx,pod-template-hash=5f7f6564c5
```
注:发现已经切换至1.10的nginx，至此滚动发布的策略和回滚已演示完毕

#### 金丝雀发布
基于上面的1.10的nginx,使用金丝雀发布1.14版本，使用如下命令:
> kubectl set image deployment dp-update nginx=nginx:1.14-alpine && kubectl rollout pause deployment dp-update      

注:通过pause命令，暂停全量更新，从而达到金丝雀发布的效果

此时两个版本共存
> kubectl get pod -w
```
NAME                              READY   STATUS    RESTARTS   AGE
dp-update-5d9d745844-7zgqz        1/1     Running   0          4m50s
dp-update-5d9d745844-8b6k5        1/1     Running   0          60m
dp-update-5d9d745844-kmpwb        1/1     Running   0          60m
dp-update-695677fc8d-wds6p        1/1     Running   0          4m50s
```

如果新版本的满意度不高，需要回滚，可以使用rollout undo命令
注:回滚前，先要更新
> kubectl rollout resume deployment/dp-update     

进行回滚上一个版本操作
> kubectl rollout undo deployment/dp-update --to-revision=0     
> kubectl get rs -o wide
```
NAME                        DESIRED   CURRENT   READY   AGE    CONTAINERS   IMAGES              SELECTOR
dp-update-5d9d745844        3         3         3       102m   nginx        nginx:1.10-alpine   app=nginx,pod-template-hash=5d9d745844
dp-update-695677fc8d        0         0         0       19m    nginx        nginx:1.14-alpine   app=nginx,pod-template-hash=695677fc8d
```

如果新版本用户满意度不错，需要完成剩余Pod更新的话，需要使用resume命令完成后续更新即可
> kubectl rollout resume deployment/dp-update
```
deployment.extensions/dp-update resumed
```
查看rs状态
> kubectl get rs -o wide        
```
NAME                        DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES              SELECTOR
dp-update-5d9d745844        0         0         0       94m   nginx        nginx:1.10-alpine   app=nginx,pod-template-hash=5d9d745844
dp-update-695677fc8d        3         3         3       11m   nginx        nginx:1.14-alpine   app=nginx,pod-template-hash=695677fc8d
```

### ReplicaSet
其作用如下:
1. 在生命周期内，保证pod明确的运行数量和状态
2. 管理底层Pod

### 补充
实时观察pod
> kubectl get pod -w

实时观察rs控制器
> kubectl get rs -o wide

















