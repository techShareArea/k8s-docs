#### 概念
deployment是基于k8s对于后台服务部署操作的抽象，每个deployment对象有一个部署目标(通常是一系列pod副本)来保存所有部署描述信息的历史。通过这些信息，k8s便能对目标的部署配置进行修改和回滚。
实际上，deployment所保存的部署描述信息是用来创建replicaset对象的，每个deployment对象都会对应一个运行着的replicaset对象，后者实际管理pod副本的运行。

#### 案例
```
cat > xxx-deployment.yaml <<-EOF
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: xxx
  namespace: dev
spec:
  selector:
    matchLabels:
      app: xxx
  replicas: 1
  template:
    metadata:
      labels:
          app: xxx
    spec:
      imagePullSecrets:
      - name: ali-shenzhen-registry-secret
      containers:
        - name: xxx
          image: registry-vpc.cn-shenzhen.aliyuncs.com/cj-cloud/xxx:dev-latest
          imagePullPolicy: IfNotPresent
          env:
          - name: SPRING_PROFILES_ACTIVE
            value: dev
          ports:
           - containerPort: 8080
          volumeMounts:
           - name: timezone
             mountPath: /etc/timezone
             subPath: timezone
             readOnly: yes
           - name: localtime
             mountPath: /etc/localtime
             readOnly: yes
           - name: cjyun-conf
             mountPath: /app/config/
             readOnly: true             
      volumes:
        - name: timezone
          configMap:
            name: timezone
        - name: localtime
          hostPath:
             path: /usr/share/zoneinfo/Asia/Shanghai
        - name: xxx-conf
          configMap:
            name: xxx-conf
EOF
```


