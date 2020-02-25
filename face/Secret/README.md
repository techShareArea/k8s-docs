### 简述
secret解决了密码,token,密钥等敏感数据的配置问题，不需要把这些敏感数据暴露到镜像或者Pod Spec中。

### 创建secret
Ⅰ.命令行方式
> kubectl create secret [TYPE] [NAME] [DATA]    

secret资源有如下3种[TYPE]类型:
> 1.docker-registry: 创建一个给Docker Registry容器镜像仓库使用的secret;       
> 2.generic: 从本地file,directory或者literal value创建一个secret;        
> 3.tls: 创建一个TLS secret。        

[DATA]和configMap一样，也可以细分为:
> --from-literal和--from-file        

yaml配置文件方式
```
cat > secret-opaque.yaml <<EOF
apiVersion: v1
kind: Secret
type: Opaque
data:
  username: YWRtaW4-
stringData:
  username: administrator
EOF

```
以上是secret定义的核心配置，额外注意type字段，其值为Opaque，对应generic类型
> Opaque:base64编码格式的secret，用来存储密码，密钥等              

注:可以通过以下命令进行secret配置字段的查看
> kubectl explain secret        

### 通过生成器创建一个Secret
除了命令行和yaml方式创建之外，从v1.14版本开始，kubectl支持通过使用kustomize来管理对象，可以使用它的generators来创建一个secret，并且在apiserver上将其运行起来。
具体步骤如下:
1. generators需要配置一个kustomization.yaml文件，对于上面的例子，可以这样来声明
```
cat <<EOF > ./kustomization.yaml
secretGenerator:
- name: db-user-pass
  files:
  - username.txt
  - password.txt
EOF
```

2. 生效相应信息的txt文件
> echo 'admin' > ./username.txt     
> echo '1f2d1e2e67df' > ./password.txt      

3. 使用-k参数来申明生效
> kubectl apply -k .        
```
secret/db-user-pass-d5m4cc4g94 created
```

5. 查看secrets信息
> kubectl get secrets       
```
NAME                      TYPE                                  DATA   AGE
db-user-pass-d5m4cc4g94   Opaque                                2      21s
```

> kubectl describe secrets/db-user-pass-d5m4cc4g94      
```
Name:         db-user-pass-d5m4cc4g94
Namespace:    default
Labels:       <none>
Annotations:  
Type:         Opaque

Data
====
password.txt:  13 bytes
username.txt:  6 bytes
```

注:也可以通过kustomize来声明一个literals的类型:
```
cat > kustomization.yaml <<EOF
secretGenerator:
- name: db-user-pass-new
  literals:
  - username=admin
  - password=secret
EOF
kubectl apply -k . 
```

补充:     
> secret名是根据文本内容hash计算出来的，得以保证每次可以得到一个修改后的文本内容。     

### 使用kubectl edit编辑secrets
> kubectl edit secrets you_service_name     

### 申明对照表
```
TYPE类型                  申明方式
docker-registry     --docker-username,--docker-password,--docker-email
generic                 --from-literal和--from-file
tls                     --cert-key
```

### 使用
secret的使用会因使用类型不同而不同，如下列举了常用参考:
```
TYPE类型              使用方式
docker-registry     spec.imagePullSecrets <[]Object>
docker-registry     ServiceAccount
generic和tls        spec.containers.env.valueFrom.secretKeyRef
generic和tls        spec.containers.envFrom.secretRef
generic和tls        spec.volumes.secret.secretName/items
```

### 实战
详细步骤如下:
1.创建所需的文本文件username.txt和password.txt
> echo 'admin' > ./username.txt     
> echo '1f2d1e2e67df' > ./password.txt    

2.创建generic类型的secret,名字为db-user-pass,并从刚才的文件中载入     
> kubectl create secret generic db-user-pass-all --from-file=./username.txt --from-file=./password.txt      

3.观察secret情况
> kubectl get secret        
```
NAME                          TYPE                                  DATA   AGE
db-user-pass-all              Opaque                                2      5s
```
> kubectl get secret db-user-pass-all -o yaml       
```
apiVersion: v1
data:
  password.txt: MWYyZDFlMmU2N2RmCg==
  username.txt: YWRtaW4K
kind: Secret
metadata:
  creationTimestamp: "2020-02-24T09:09:54Z"
  name: db-user-pass-all
  namespace: default
  resourceVersion: "403825"
  selfLink: /api/v1/namespaces/default/secrets/db-user-pass-all
  uid: 6bd0933e-56e5-11ea-a948-00163e06fdcf
type: Opaque
```

4.base64解码对应信息，验证是否一致
> echo MWYyZDFlMmU2N2RmCg== | base64 -d     
```
1f2d1e2e67df
```
> echo YWRtaW4K | base64 -d     
```
admin
```

5.编辑redis-secretenv-demo.yaml,使它读取我们创建的名为db-user-pass-all的secret,并且将变量名username.txt的值赋值给SECRET_USERNAME的环境变量，以及password.txt赋值给SECRET_PASSWORD.
```
cat > secret-env-pod.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
  - name: mycontainer
    image: redis
    env:
      - name: SECRET_USERNAME
        valueFrom:
          secretKeyRef:
            name: db-user-pass-all
            key: username.txt
      - name: SECRET_PASSWORD
        valueFrom:
          secretKeyRef:
            name: db-user-pass-all
            key: password.txt
  restartPolicy: Never
EOF
kubectl apply -f secret-env-pod.yaml 
```

6.进入Pod的交互式接口模式，观察secret变量载入情况
> kubectl exec -it secret-env-pod -- /bin/sh      
```
# env
MYAPP_SERVICE_PORT_HTTP=8088
KUBERNETES_PORT=tcp://10.96.0.1:443
KUBERNETES_SERVICE_PORT=443
JAVA_DEMO_PORT_8888_TCP=tcp://10.100.62.148:8888
HOSTNAME=secret-env-pod
REDIS_DOWNLOAD_SHA=61db74eabf6801f057fd24b590232f2f337d422280fd19486eca03be87d3a82b
HOME=/root
SECRET_PASSWORD=1f2d1e2e67df        #密码

MYAPP_SERVICE_HOST=10.99.88.97
JAVA_DEMO_SERVICE_HOST=10.100.62.148
MYAPP_SERVICE_PORT=8088
MYAPP_PORT=tcp://10.99.88.97:8088
MYAPP_PORT_8088_TCP_ADDR=10.99.88.97
TERM=xterm
KUBERNETES_PORT_443_TCP_ADDR=10.96.0.1
MYAPP_PORT_8088_TCP_PORT=8088
JAVA_DEMO_PORT=tcp://10.100.62.148:8888
JAVA_DEMO_SERVICE_PORT=8888
MYAPP_PORT_8088_TCP_PROTO=tcp
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
KUBERNETES_PORT_443_TCP_PORT=443
KUBERNETES_PORT_443_TCP_PROTO=tcp
SECRET_USERNAME=admin               #用户名

MYAPP_PORT_8088_TCP=tcp://10.99.88.97:8088
JAVA_DEMO_PORT_8888_TCP_ADDR=10.100.62.148
REDIS_DOWNLOAD_URL=http://download.redis.io/releases/redis-5.0.7.tar.gz
KUBERNETES_PORT_443_TCP=tcp://10.96.0.1:443
KUBERNETES_SERVICE_PORT_HTTPS=443
REDIS_VERSION=5.0.7
JAVA_DEMO_PORT_8888_TCP_PORT=8888
GOSU_VERSION=1.11
JAVA_DEMO_PORT_8888_TCP_PROTO=tcp
KUBERNETES_SERVICE_HOST=10.96.0.1
PWD=/data
```

### 实战:以存储卷方式载入Secret
编辑redis-secretfiles-volumes.yaml,新增一个secret类型的volumes叫做secret-volume,把它挂载到pod容器的"/etc/secret-volume"目录，并且变量名为username,而不是username.txt。

```
cat > secret-pod-volume.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  name: secret-dotfiles-pod
spec:
  volumes:
  - name: secret-volume
    secret:
      secretName: db-user-pass
      items:
      - key: username.txt
        path: username
      - key: password.txt
        path: password
  containers:
  - name: dotfile-test-container
    image: redis
    volumeMounts:
    - name: secret-volume
      readOnly: true
      mountPath: "/etc/secret-volume"
EOF
kubectl apply -f secret-pod-volume.yaml
```

进入容器中，查看是否成功
> kubectl exec -it secret-dotfiles-pod -- /bin/sh       
```
# cd /etc/secret-volume     
# ls
password    username
# cat username 
admin
# cat password
1f2d1e2e67df
```







