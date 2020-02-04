### 安装要求
部署k8s集群机器的要求如下
1. 一台或多台机器，操作系统Centos7.x；
2. 硬件配置:2c2g及以上，硬盘容量30g以上；
3. 集群中所有机器之间网络互通；
4. 可以访问外网，需要拉去镜像(避免使用国外镜像源，可以使用阿里源，或者搭建私有仓库)；
5. 禁止swap分区(消耗系统性能，影响k8s的使用)。

### 部署k8s方式
1. kubeadm
2. 二进制
3. minikube(开发人员测试)
4. yum

#### kubeadm安装k8s集群
实践操作演示kubeadm安装master节点

##### 关闭swap分区
###### 临时关闭命令
> swapoff -a        
###### 永久关闭
> sed -i 's/^.*swap*/#&/g' /etc/fstab

##### 关闭SELinux
###### 临时关闭
> setenforce 0      
###### 永久关闭
> sed -i 's/\(SELINUX=\).*/\1disabled/g' /etc/selinux/config

##### 关闭防火墙
```
systemctl stop firewalld
systemctl disable firewalld
```

##### 增加hosts文件内容
> echo "172.18.107.141 kubeadm" >> /etc/hosts

##### 将桥接的ipv4流量传递到iptables的链
```
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system
```

##### 使用aliyun源安装docker
```
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum -y install docker-ce docker-ce-cli containerd.io
systemctl enable docker
systemctl start docker
```

注:点击https://kubernetes.io查看k8s的稳定版本

##### 使用aliyun源安装kubectl,kubeadm,kubelet
```
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
EOF
yum -y install epel-release
yum clean all
yum makecache
yum -y install kubelet-1.14.0 kubeadm-1.14.0 kubectl-1.14.0 kubernetes-cni
systemctl enable kubelet && systemctl start kubelet
```

##### 部署k8s master节点
```
kubeadm init \
--apiserver-advertise-address 172.18.107.140 \
--image-repository registry.aliyuncs.com/google_containers \
--kubernetes-version v1.14.0 \
--service-cidr 10.1.0.0/16 \
--pod-network-cidr 10.244.0.0/16
```

生效配置
```
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

注:查看部署状态
> kubectl get pods -n kube-system       
如果coredns处于pending状态，则需要部署网络插件     
使用命令:journalctl -f -u kubelet.service查看报错信息      

##### 安装Pod网络插件(CNI)
使用flannel网络
> kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml   
or      
> kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/a70459be0084506e4ec919aa1c114638878db11b/Documentation/kube-flannel.yml

##### 添加节点信息
> kubeadm join 172.18.107.140:6443 --token daobz3.w11svvzmnkweevqe \
    --discovery-token-ca-cert-hash sha256:cc2fe3d396d2ee62fc35b402bb82e91503eb232cd4d004db      

##### 测试k8s集群
以nginx为例
> kubectl create deployment nginx --image=nginx     
> kubectl expose deployment nginx --port=80 --type=NodePort
> kubectl get pods,svc      
```
NAME                             READY   STATUS             RESTARTS   AGE
pod/busybox-5bdd4b9488-52lfc     0/1     CrashLoopBackOff   13         16h
pod/nginx-65f88748fd-822lh       1/1     Running            0          43m

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        2d4h
service/nginx        NodePort    10.100.100.25   <none>        80:32534/TCP   13m
```
##### 访问web页面
命令行:
> curl localhost:30031

浏览器访问:
http://47.113.103.89:30031

##### 扩容/缩容
提供nginx的并发性
> kubectl scale deployment nginx --replicas=3

##### 部署dashboard
```
cat > kube-dashboard.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-certs
  namespace: kube-system
type: Opaque
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: kubernetes-dashboard-minimal
  namespace: kube-system
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["kubernetes-dashboard-key-holder", "kubernetes-dashboard-certs"]
  verbs: ["get", "update", "delete"]
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["kubernetes-dashboard-settings"]
  verbs: ["get", "update"]
- apiGroups: [""]
  resources: ["services"]
  resourceNames: ["heapster"]
  verbs: ["proxy"]
- apiGroups: [""]
  resources: ["services/proxy"]
  resourceNames: ["heapster", "http:heapster:", "https:heapster:"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kubernetes-dashboard-minimal
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: kubernetes-dashboard-minimal
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard
  namespace: kube-system
---
kind: Deployment
apiVersion: apps/v1beta2
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: kubernetes-dashboard
  template:
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
    spec:
      containers:
      - name: kubernetes-dashboard
#        image: k8s.gcr.io/kubernetes-dashboard-amd64:v1.10.0
        image: lizhenliang/kubernetes-dashboard-amd64:v1.10.1
        ports:
        - containerPort: 8443
          protocol: TCP
        args:
          - --auto-generate-certificates
        volumeMounts:
        - name: kubernetes-dashboard-certs
          mountPath: /certs
        - mountPath: /tmp
          name: tmp-volume
        livenessProbe:
          httpGet:
            scheme: HTTPS
            path: /
            port: 8443
          initialDelaySeconds: 30
          timeoutSeconds: 30
      volumes:
      - name: kubernetes-dashboard-certs
        secret:
          secretName: kubernetes-dashboard-certs
      - name: tmp-volume
        emptyDir: {}
      serviceAccountName: kubernetes-dashboard
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
---
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
spec:
  type: NodePort
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30001
  selector:
    k8s-app: kubernetes-dashboard
EOF
kubectl apply -f kube-dashboard.yaml
```
注:NodePort为外部访问，否则，只能在集群内部访问。

web访问:
> https://https://47.113.103.89:30001

创建service account并绑定默认cluster-admin管理员集群角色
```
kubectl create serviceaccount dashboard-admin -n kube-system    #面向于应用访问API,dashboard-admin为管理员
Kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
kubectl describe secrets -n kube-system $(kubectl -n kube-system get secret | awk '/dashboard-admin/{print $1}')    #获取token值
```

##### 补充
使用kubeadm 搭建k8s+flannel集群：
> https://www.jianshu.com/p/351acb6811fd        
 
k8s常见报错解决：
> https://cloud.tencent.com/developer/article/1461571           
> https://yq.aliyun.com/articles/679699     
> https://www.cnblogs.com/only-me/p/10219903.html         

kubernetes中网络报错问题:
> http://www.mamicode.com/info-detail-2315259.html      

