#### 概述
Kubernetes Service定义了这样一种抽象：逻辑上的一组Pod，一种可以访问它们的策略--通常称为微服务。这一组Pod能够被Service访问到，通常是通过selector（查看下面了解，为什么你可能需要没有selector的Service）实现的。
举个例子，考虑一个图片处理backend，它运行了3个副本。这些副本是可互换的--frontend不需要关心它们调用了哪个backend副本。然而组成这一组backend程序的Pod实际上可能会发生变化，frontend客户端不应该也没必要知道，而且也不需要跟踪这一组backend的状态。Service定义的抽象能够解耦这种关联。

#### 定义 Service
一个Service在Kubernetes中是一个REST对象，和Pod类似。像所有的REST对象一样，Service定义可以基于POST方式，请求API server创建新的实例。

假定有一组Pod，它们对外暴露了9376端口，同时还被打上app=MyApp标签
```
apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: dev
spec:
  selector:
    app: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
```

上述配置创建一个名称为“my-service”的Service对象，它会将请求代理到使用TCP端口9376，并且具有标签"app=MyApp"的Pod上。Kubernetes为该服务分配一个IP地址（有时称为“集群IP”），该IP地址由服务代理使用。

注:
> Service能够将一个接收port映射到任意的targetPort。默认情况下，targetPort将被设置为与port字段相同的值

#### 案例(自建数据库)
```
cat > mysql-svc.yaml <<-EOF 
apiVersion: v1
kind: Service
metadata:
  name: mysql-cjtlis
  namespace: dev
spec:
  type: ClusterIP
  ports:
  - port: 3306          # 容器端口
    targetPort: 3306    # 对外暴露服务端口
  selector:
    app: mysql-cjtlis
EOF
```

#### 链接索引
> https://kubernetes.io/zh/docs/concepts/services-networking/service/#%E5%AE%9A%E4%B9%89-service    