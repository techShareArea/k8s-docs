#### minikube的部署安装
minikube为单机版的k8s，可以作为上手使用的渠道

#### 安装步骤

##### 1.准备一台机器(可以是物理机，也可以是虚拟机)，并安装号centos7系统，推荐7.5以上版本
安装centos7系统，这里不再赘述

##### 2.安装docker
```
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum -y install docker-ce docker-ce-cli containerd.io   #默认安装最新版本，若指定版本，则执行命令:yum install docker-ce-19.03.2 docker-ce-cli-19.03.2 containerd.io
systemctl enable docker
systemctl start docker
```
注:如若需卸载之前的docker版本，则先执行如下命令:
```
systemctl stop docker
yum remove docker　docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
```

##### 3.安装Kubeadm

配置阿里的yum源
```
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
EOF
```

重建yum缓存
```
yum -y install epel-release
yum clean all
yum makecache
```

安装Kubeadm
```
yum -y install kubelet-1.14.0 kubeadm-1.14.0 kubectl-1.14.0 kubernetes-cni
systemctl enable kubelet && systemctl start kubelet
```
注:请务必安装指定版本1.14.0，后面的镜像基于版本1.14.0；如若安装最新版本的k8s，则执行命令:yum -y install kubelet kubeadm kubectl kubernetes-cni

##### 4.配置Kubeadm所用到的墙内镜像
```
docker pull mirrorgooglecontainers/kube-apiserver:v1.14.0
docker pull mirrorgooglecontainers/kube-controller-manager:v1.14.0
docker pull mirrorgooglecontainers/kube-scheduler:v1.14.0
docker pull mirrorgooglecontainers/kube-proxy:v1.14.0
docker pull mirrorgooglecontainers/pause:3.1
docker pull mirrorgooglecontainers/etcd:3.3.10
docker pull coredns/coredns:1.3.1

docker tag mirrorgooglecontainers/kube-apiserver:v1.14.0 k8s.gcr.io/kube-apiserver:v1.14.0
docker tag mirrorgooglecontainers/kube-controller-manager:v1.14.0 k8s.gcr.io/kube-controller-manager:v1.14.0
docker tag mirrorgooglecontainers/kube-scheduler:v1.14.0 k8s.gcr.io/kube-scheduler:v1.14.0
docker tag mirrorgooglecontainers/kube-proxy:v1.14.0 k8s.gcr.io/kube-proxy:v1.14.0
docker tag mirrorgooglecontainers/pause:3.1 k8s.gcr.io/pause:3.1
docker tag mirrorgooglecontainers/etcd:3.3.10 k8s.gcr.io/etcd:3.3.10
docker tag docker.io/coredns/coredns:1.3.1 k8s.gcr.io/coredns:1.3.1
```

##### 5.关闭swap

临时禁用:
> swapoff -a        

永久禁用:
> sed -i 's/^.*swap*/#&/g' /etc/fstab

##### 6.关闭SELinux

临时关闭
> setenforce 0      

永久关闭
> sed -i 's/\(SELINUX=\).*/\1disabled/g' /etc/selinux/config

##### 7.关闭防火墙
```
systemctl stop firewalld
systemctl disable firewalld
```

##### 8.配置转发参数
```
cat <<EOF > /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.conf.all.forwarding = 1
vm.swappiness = 0
EOF
```
使配置生效
> sysctl -p /etc/sysctl.d/k8s.conf      

##### 9.初始化相关镜像
> kubeadm init      

##### 10.配置kubectl认证信息

临时生效
> export KUBECONFIG=/etc/kubernetes/admin.conf

永久生效
```
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

##### 11.部署Weave网络插件
> kubectl apply -f https://git.io/weave-kube-1.6        

##### 12.部署Worker节点(可忽略)
> kubeadm join 192.168.0.225:6443 --token oq241l.52jw3yu84zylz7vm --discovery-token-ca-cert-hash sha256:fefa33fc1234d133ea69f109a9d7a5c751ffe23db566408fd1b1f026df296411

##### 13.Dashboard部署
编辑yaml文件
```
cat > dashboard.yaml <<-EOF
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard
  labels:
    k8s-app: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard
  namespace: kube-system
EOF
```
执行yaml文件
> kubectl apply -f ./dashboard.yaml      

#### 补充
利用virtualbox部署方式:
https://www.cnblogs.com/lyxb/p/11244059.html
https://blog.csdn.net/hjxzb/article/details/82725986

minikube 运行 dashboard，并对外暴露访问地址:
https://www.jianshu.com/p/ef020fa8ca97

去除污染容忍度:
> kubectl taint nodes --all node-role.kubernetes.io/master-     