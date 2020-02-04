#### 概述
pod表示的是一個容器或多個容器的組合，它是K8s最基本的操作和調度單元。在同一个pod中的容器总会被调度和部署到同一个节点上，并共享相同的数据卷和网络栈。这意味着在Pod里定义的几个容器能够同时挂载同一个外部数据卷，还能够通过localhost作为地址相互访问，这个特性对于部署关系紧密的服务具有十分重要的作用。

##### 作用
1. 最小容器单元
2. 一组容器的集合
3. 一个Pod中的容器，共享网络命名空间
4. Pod是短暂的

##### 补充
pod为亲密性应用而存在
亲密性应用场景如下:
1. 两个应用之间发生文件交互；
2. 另个应用需要通过127.0.0.1或socket通信；
3. 另个应用需要发生频繁的调用。

##### pod实现机制
共享网络
共享存储

###### 共享网络示例
```
cat > myapp.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: myapp
  name: myapp
  namespace: default
spec:
  containers:
  - image: lizhenliang/java-demo
    image: lizhenliang/java-demo
    name: java
  - image: nginx
    image: nginx
    name: nginx-test
EOF
kubectl apply -f myapp.yaml
```
注:此两个pod的ip一致

##### 共享存储示例
持久化数据有如下三种情况:
1. 临时；
2. 日志；
3. 业务。

```
cat > mytest.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  name: mytest
spec:
  containers:
  - name: write
    image: centos
    command: ["bash", "-c", "for i in {1..100};do echo $i >> /data/hello;sleep 1;done"]
    volumeMounts:
      - name: data
        mountPath: /data

  - name: read
    image: centos
    command: ["bash", "-c", "tail -f /data/hello"]
    volumeMounts:
      - name: data
        mountPath: /data

  volumes:
  - name: data
    emptyDir: {}
EOF
kubectl apply -f mytest.yaml
```

查看pod中read的日志
> kubectl logs -f mytest -c read    

##### pod容器分类与设计模式
1. Infrastructure Container:基础容器     
1.1 维护整个Pod网络空间     

2. InitContainers: 初始化容器        
2.1 先于业务容器开始执行      
        
3. Containers: 业务容器     
3.1 并行启动

#### Pod Template常见字段
```
# -----定义deployment控制器相关属性-----
apiVersion: apps/v1
kind: Deployment
metadata:
  name: AI
  namespace: devops
spec:
  replicas: 2
  selector:
    matchlabels:    # 标签，进行控制器相关联的操作
      project: devops
      app: AI
# ------------------------------------
  template:
    metadata:
      labels:   
        project: devops
        app: AI
    spec:
      imagePullSecrets:     # 拉取镜像策略，把拉取镜像的账密保存在K8s的secrets中
      - name: registry-pull-secret
      containers:
      - name: AI
        image: lqxTomcat
        imagePullPolicy: Always     # 始终拉取策略
        ports:
          - protocol: TCP
            containerPort: 8010     # 开放连接端口
        env:
          - name: JAVA_OPTS
            value: "-Xmx1g"
        # -----资源限制-----
        resources:
          requests:     # 查询当前服务器的cpu，内存的资源情况
            cpu: 0.5
            memory: 256Mi
          limits:       # 限制java应用的资源使用，当超过时，进行杀死再重启应用
            cpu: 1
            memory: 1Gi
        # -----------------
        # -----健康检查-----    
        readinessProbe:     # 检查应用程序是否就绪，如未，则尝试重建，查看是否恢复
          tcpSocket:
            port: 8010
          initialDelaySeconds: 60
          periodSeconds: 10
        livenessProbe:      # 如健康检查失败，不会转发流量，对外提供服务
          tcpSocket:
            port: 8010
          initialDeplaySeconds: 60
          periodSeconds: 10
```
注:生产环境需要配置的选项
