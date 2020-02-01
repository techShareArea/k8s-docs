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
yum -y install kubelet-1.17.0 kubeadm-1.17.0 kubectl-1.17.0 kubernetes-cni-1.17.0
systemctl enable kubelet && systemctl start kubelet
```

##### 部署k8s master节点
```
kubeadm init \
--apiserver-advertise-address=172.18.107.141 \
--image-repository registry.aliyuncs.com/google_containers \
--kubernetes-version v1.17.0 \
--service-cidr=10.1.0.0/16 \ 
--pod-network-cidr=10.244.0.0/16

生效配置
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
> kubeadm join 172.18.107.141:6443 --token daobz3.w11svvzmnkweevqe \
    --discovery-token-ca-cert-hash sha256:cc2fe3d396d2ee62fc35b402bb82e91503eb232cd4d004db      

##### 测试k8s集群


