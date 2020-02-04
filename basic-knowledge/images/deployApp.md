### 在k8s平台中部署java应用
此文档以在k8s平台部署java应用为例进行详细的讲解

#### 项目迁移到k8s平台部署流程
制作镜像-->控制器管理pod-->暴露应用-->对外发布应用-->日志/监控

##### 制作镜像
以java示例演示过程，在centos7.x服务器的家目录下操作

###### 克隆gitee代码
> yum -y install git        
> mkdir java                
> git clone https://gitee.com/atsvzhou/tomcat-java-demo.git

###### 创建数据
> yum -y install mariadb mariadb-server         
> systemctl start mariadb && systemctl enable mariadb
> mysql -h localhost -P 3306 -uroot
> MariaDB [(none)]> source /root/java/tomcat-java-demo/db/tables_ly_tomcat.sql; 

###### 修改数据库连接密码
/root/java/tomcat-java-demo/src/main/resources/application.yml
```
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test?characterEncoding=utf-8
    username:           # 设置为空，mariadb数据库，用mysql即可进入
    password:           # 为空，也可设置密码，请自行根据实际情况进行处理
    driver-class-name: com.mysql.jdbc.Driver
  freemarker:
    allow-request-override: false
    cache: true
    check-template-location: true
    charset: UTF-8
    content-type: text/html; charset=utf-8
    expose-request-attributes: false
    expose-session-attributes: false
    expose-spring-macro-helpers: false
    suffix: .ftl
    template-loader-path:
      - classpath:/templates/

```

###### 编译java代码
> yum -y install java-1.8.0-openjdk maven           
> cd /root/java/tomcat-java-demo        
> mvn clean package -Dmaven.test.skip=true      

###### 构建项目镜像
> cd /root/java/tomcat-java-demo        
> docker build -t lizhenliang/java-demo .

#### 控制器管理pod

##### 生成部署无状态应用的yaml模板文件
```
> kubectl create deployment java-demo --image=lizhenliang/java-demo --dry-run -o yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null   # 创建时间错
  labels:
    app: java-demo
  name: java-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: java-demo
  strategy: {}  # 升级策略
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: java-demo
    spec:
      containers:
      - image: lizhenliang/java-demo
        name: java-demo
        resources: {}   # 资源配置
status: {}  # 状态
```

###### 编辑部署yaml文件
```
cat > java-demo.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: java-demo
  name: java-demo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: java-demo
  template:
    metadata:
      labels:
        app: java-demo
    spec:
      containers:
      - image: lizhenliang/java-demo
        name: java-demo
EOF
```

###### 部署应用
> kubectl apply -f java-demo.yaml       
> kubectl get pods  # 查看部署情况

#### 暴露应用
```
cat > java-demo-svc.yaml <<EOF 
apiVersion: v1
kind: Service
metadata:
  labels:
    app: java-demo
  name: java-demo
spec:
  ports:
  - port: 80            # 集群内部访问端口
    protocol: TCP
    targetPort: 8080    # 容器内部端口
  selector:
    app: java-demo
  type: NodePort        # 集群外部访问
EOF
kubectl apply -f java-demo-svc.yaml
```

注:生成svc模板
> kubectl expose deployment java-demo --port=80 --target-port=8080 --type=NodePort --dry-run=true -o yaml > java-demo-svc.yaml       


查看部署的pod与svc
> kubectl get pods,svc -o wide  

```
NAME                             READY   STATUS    RESTARTS   AGE   IP          NODE        NOMINATED NODE   READINESS GATES        
pod/java-demo-6ff4f8c498-2cd5j   1/1     Running   0          80m   10.32.0.5   cangqiong   <none>           <none>         
pod/java-demo-6ff4f8c498-d7kv5   1/1     Running   0          80m   10.32.0.7   cangqiong   <none>           <none>             
pod/java-demo-6ff4f8c498-tdthl   1/1     Running   0          80m   10.32.0.6   cangqiong   <none>           <none>         
        
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE   SELECTOR            
service/java-demo    NodePort    10.110.154.10   <none>        80:32555/TCP   61m   app=java-demo           
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        86m   <none>          
```




#### 补充
部署过程中遇见的错误及其处理方法
##### 1.网络超时
> kubectl describe pod java-demo
> Unable to connect to the server: net/http: TLS handshake timeout

处理方法:          
> echo "52.22.201.61 registry-1.docker.io" >> /etc/hosts        

##### 2.接触污染度
> kubectl describe pod myapp        
```
Events:
  Type     Reason            Age                From               Message
  ----     ------            ----               ----               -------
  Warning  FailedScheduling  28s (x2 over 28s)  default-scheduler  0/1 nodes are available: 1 node(s) had taints that the pod didn't tolerate.
```
> kubectl taint nodes --all node-role.kubernetes.io/master-     

