#### 概述
1. Secret是一种包含少量敏感信息例如密码、token或key的对象。这样的信息可能会被放在Pod spec中或者镜像中；将其放在一个secret对象中可以更好地控制它的用途，并降低意外暴露的风险。

2. 用户可以创建secret，同时系统也创建了一些secret。   
示例：
> yaml方式    
```
cat > ali-shenzhen-registry-secret.yaml <<-EOF   
apiVersion: v1
kind: Secret
metadata:
  name: ali-shenzhen-registry-secret
  namespace: dev
data:
  username: bmF0dXJl           # 已经过base64编码处理
  password: bmF0dXJlLXNreQ==    # 已经过base64编码处理
EOF
--- 如果使用string，则为:---
cat > ali-shenzhen-registry-secret.yaml <<-EOF   
apiVersion: v1
kind: Secret
metadata:
  name: ali-shenzhen-registry-secret
  namespace: dev
stringData:
  username: "nature"           
  password: "nature-sky"    
EOF
--- 如果使用string跟base64结合方式，则为:---
cat > ali-shenzhen-registry-secret.yaml <<-EOF   
apiVersion: v1
kind: Secret
metadata:
  name: ali-shenzhen-registry-secret
  namespace: dev
data:
  username: bmF0dXJl
stringData:
  password: "nature-sky"    
EOF
``` 
> shell方式    
```
cat > ali-shenzhen-registry-secret.sh <<-EOF   
kubectl create secret docker-registry ali-shenzhen-registry-secret \
       --docker-server=registry-vpc.cn-shenzhen.aliyuncs.com \
       --docker-username=xxx \
       --docker-password=xxx \
       --docker-email=xxx \
       -n dev
EOF
```

3. 要使用secret，pod需要引用secret。Pod可以用两种方式使用secret：作为volume中的文件被挂载到pod中的一个或者多个容器里，或者当kubelet为pod拉取镜像时使用。         
示例
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
    ecaicn.com/persistent-env: dev
  imagePullSecrets:     # 当kubelet为pod拉取镜像时使用
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

#### 使用

##### 内置secret

###### Service Account使用API凭证自动创建和附加secret
Kubernetes自动创建包含访问API凭据的secret，并自动修改您的pod以使用此类型的secret。     
如果需要，可以禁用或覆盖自动创建和使用API凭据。但是，如果您需要的只是安全地访问apiserver，我们推荐这样的工作流程。

##### 创建您自己的Secret
###### 使用kubectl创建Secret       
如概述的第2点所示
> 注：特殊字符（例如$,\*和!）需要转义。如果您使用的密码具有特殊字符，则需要使用\\字符对其进行转义。例如，如果您的实际密码是S!B\*d$zDsb，则应通过以下方式执行命令：kubectl create secret generic dev-db-secret –from-literal=username=devuser –from-literal=password=S\!B\\*d\$zDsb您无需从文件中转义密码中的特殊字符（--from-file）。      

检查创建的secrets
> $ kubectl get secrets -n dev    # 需要-n dev指向自己所属的命名空间   
> NAME                          TYPE                                  DATA   AGE        
> ali-shenzhen-registry-secret   Opaque                                2      7m59s         

> $ kubectl describe secrets/ali-shenzhen-registry-secret -n dev        
> Name:         ali-shenzhen-registry-secret        
> Namespace:    dev         
> Labels:       <none>      
> Annotations:          
> Type:         Opaque      
>       
> Data      
`> ====         
> password:  10 bytes       
> username:  6 bytes        

注：默认情况下，kubectl get和kubectl describe避免显示密码的内容。这是为了防止机密被意外地暴露给旁观者或存储在终端日志中。

解码用户/密码字段:
> echo 'bmF0dXJl' | base64 --decode         

编辑secrets:
> kubectl edit secrets ali-shenzhen-registry-secret -n dev      

#### 在Pod中使用Secret文件

##### 在Pod中的volume里使用Secret
1. 创建一个secret或者使用已有的secret。多个pod可以引用同一个secret;
1. 修改您的pod的定义在spec.volumes[]下增加一个volume。可以给这个volume随意命名，它的spec.volumes[].secret.secretName必须等于secret对象的名字;
1. 将spec.containers[].volumeMounts[]加到需要用到该secret的容器中。指定spec.containers[].volumeMounts[].readOnly = true 和 spec.containers[].volumeMounts[].mountPath为您想要该 ecret出现的尚未使用的目录;
1. 修改您的镜像并且／或者命令行让程序从该目录下寻找文件。Secret的data映射中的每一个键都成为了mountPath下的一个文件名。

示例:
```
cat > foo.yaml <<-EOF 
apiVersion: v1
kind: Pod
metadata:
  name: mypod
  namespace: dev
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    secret:
      secretName: mysecret
EOF
```