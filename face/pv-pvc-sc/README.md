### Volume定义
Pod不采取文件挂载的方式的话，数据可能会因为各种不可抗因素丢失，比如Pod被迫下线时，会根据rs控制器的数量定义，重新生成一个干净状态的新Pod。
Volume的引入不但解决数据稳定性的问题，也解决了同一个Pod内，多个containers数据共享的需求。

> 和docker里不同的是      
> 1.k8s中内置封装了很多存储类型，pod也可以选择性的使用一个或者多个；     
> 2.当Pod被删除时，Volume才可能被清理，并且数据是否丢失和删除取决于Volume的具体类型和其回收策略。      

### Volume分类
k8s内置封装了很多存储类型，大致可以分为如下七大类:
```
存储类型        存储组件            官网文档
云存储     awsElasticBlockStore    https://kubernetes.io/docs/concepts/storage/volumes/#awselasticblockstore
云存储         azureDisk           https://kubernetes.io/docs/concepts/storage/volumes/#azuredisk
云存储         azureFile           https://kubernetes.io/docs/concepts/storage/volumes/#azurefile
云存储     gcePersistentDisk       https://kubernetes.io/docs/concepts/storage/volumes/#gcepersistentdisk
云存储     vsphereVolume           https://kubernetes.io/docs/concepts/storage/volumes/#vspherevolume
分布式存储       cephfs             https://kubernetes.io/docs/concepts/storage/volumes/#cephfs
分布式存储       glusterfs          https://kubernetes.io/docs/concepts/storage/volumes/#glusterfs   
分布式存储       rbd                https://kubernetes.io/docs/concepts/storage/volumes/#rbd
网络存储            nfs             https://kubernetes.io/docs/concepts/storage/volumes/#nfs
网络存储            fc              https://kubernetes.io/docs/concepts/storage/volumes/#fc
网络存储        iscsi               https://kubernetes.io/docs/concepts/storage/volumes/#iscsi
临时存储        emptyDir            https://kubernetes.io/docs/concepts/storage/volumes/#emptydir
本地存储        hostPath            https://kubernetes.io/docs/concepts/storage/volumes/#hostpath
特殊存储        configMap           https://kubernetes.io/docs/concepts/storage/volumes/#configmap        
特殊存储        downwardAPI         https://kubernetes.io/docs/concepts/storage/volumes/#downwardapi
特殊存储        secret              https://kubernetes.io/docs/concepts/storage/volumes/#secret
自定义存储       csi                https://kubernetes.io/docs/concepts/storage/volumes/#csi
持久卷申请   persistentVolumeClain  https://kubernetes.io/docs/concepts/storage/volumes/#persistentvolumeclaim
```

### PV的生命周期
PV(持久卷)和Pod资源一样，拥有生命周期，分为如下四种:
> 1.Provisioning: 正在申明      
> 2.Binding: 正在绑定       
> 3.Using: 正在使用         
> 4.Reclaiming:正在回收     

### PV的回收策略
当Pod资源被删除时，其相关pv和数据如何操作?该删除还是保留?
k8s通过persistenVolumeReclaimPolicy字段进行设置:
> Delete: 数据和pv都会删除     
> Recyle: 已废弃此功能    
> Retain: 数据和pv都不动      

### PV的申明类型
pv的申明类型可分为如下两种
1.Static(静态):
> 管理员根据使用情况，认为预先进行设置    

2.Dynamic(动态):
> 基于已创建的StorageClasses(简称sc),启动动态申请和创建的作用；      
> API server需要增加一个参数设置: --enable-admission-plugins,具体类型参考:https://kubernetes.io/docs/concepts/storage/storage-classes/

### pv,pvc和sc的关系
> pv:描述一个具体的Volume属性，比如:Volume的类型，挂载目录，远程存储服务器地址等；      
> pvc:描述使用者(Pod)想要使用的持久化属性，比如:存储大小，读写权限等；       
> sc:运维人员根据pv特征，可能是性能，质量级别，备份策略等进行定义的抽象存储类型，通过接收pvc请求，从而起到动态实例化的效果。     

注:
> pvc好比接口，使用者只需要知道这个接口如何使用即可，比如:该传哪些参数，哪些是必传的等等，并不需要了解接口时如何实现；      
> pv是接口的实现，内部是用nfs,还是ceph的储存系统等等;              
> sc是接口根据一系列规则所进行的抽象类，通过接受pvc请求，从而起到动态实例化pv的效果。

另注:
> 1.pv没有namespace名称空间的概念，而pvc有namespace名称空间的概念；     
> 2.pv和pvc一一对应绑定。       

### 查询命令
pv的API字段配置说明
> kubectl explain pods.spec.volumes
```
KIND:     Pod
VERSION:  v1

RESOURCE: volumes <[]Object>

... ...
```

pvc的api字段配置说明
> kubectl explain pods.spec.volumes.persistentVolumeClaim       
```
KIND:     Pod
VERSION:  v1

RESOURCE: persistentVolumeClaim <Object>

... ...
```

sc的API字段配置说明
> kubectl explain sc    
```
KIND:     StorageClass
VERSION:  storage.k8s.io/v1

... ...
```

### 实战: 基于nfs的静态pv/pvc
准备好nfs的挂载配置，我的如下所示:
```
角色      ip              备注
server  172.18.107.154  共享目录:/
client  172.18.107.140  挂载点:/mnt
``` 

部署pv
```
cat > pv.yaml <<EOF 
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv
spec:
  capacity:
    storage: 100Mi
  accessModes:
    - ReadWriteMany
  nfs:
    # FIXME: use the right IP
    server: 172.18.107.154
    path: "/"
EOF
kubectl apply -f pv.yaml
```
注:pv没有命名空间概念

部署pvc
```
cat > pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 90Mi
EOF
kubectl apply -f pvc.yaml
```

部署pod
```
cat > pvc-pod.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  name: nginx-volume-pvc
spec:
  containers:
  - name: nginx-pvc
    image: nginx
    ports:
    - containerPort: 80
    volumeMounts:
    - name: html-pvc
      mountPath: /usr/share/nginx/html/
  volumes:
  - name: html-pvc
    persistentVolumeClaim:
      claimName: nfs-pvc
EOF
kubectl apply -f pvc-pod.yaml
```

查看pv,pvc,pod部署情况
```
kubectl get pv,pvc,pod -o wide
NAME                      CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM             STORAGECLASS   REASON   AGE
persistentvolume/nfs-pv   100Mi      RWX            Retain           Bound    default/nfs-pvc                           105m

NAME                            STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/nfs-pvc   Bound    nfs-pv   100Mi      RWX                           104m

NAME                                  READY   STATUS             RESTARTS   AGE    IP           NODE        NOMINATED NODE   READINESS GATES
pod/nginx-volume-pvc                  1/1     Running            0          103m   10.32.0.14   cangqiong   <none>           <none>
```
此时pv跟pvc的STATUS为Bound，表示成功部署。


### 实战: 基于nfs的动态Provisioner
部署ServiceAccount，使用RoleBinding绑定到leader-locking-nfs-client-provisioner丧命
```
cat > sc-sa.yaml <<EOF
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-client-provisioner

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: nfs-client-provisioner-runner
rules:
  - apiGroups: [""]
    resources: ["persistentvolumes"]
    verbs: ["get", "list", "watch", "create", "delete"]
  - apiGroups: [""]
    resources: ["persistentvolumesclaims"]
    verbs: ["get", "list", "watch", "update"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "update", "patch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: run-nfs-client-provisioner
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    namespace: default
roleRef:
  kind: ClusterRole
  name: nfs-client-provisioner-runner
  apiGroup: rbac.authorization.k8s.io

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: leader-locking-nfs-client-provisioner
rules:
  - apiGroups: [""]
    resources: ["endpoints"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: leader-locking-nfs-client-provisioner
subjects:
  - kind: ServiceAccount
    name: nfs-client-provisioner
    namespace: default
roleRef:
  kind: Role
  name: leader-locking-nfs-client-provisioner
  apiGroup: rbac.authorization.k8s.io
EOF
kubectl apply -f sc-sa.yaml
```

创建nfs-client        
将nfs配置成storageclass，安装对应的自动配置程序nfs-client,可以自动创建持久卷(pv)
每当创建storageclass时，就会在kubernetes里面自动创建pv,nfs目录下自动创建文件夹，省区手动创建的麻烦
```
cat > sc-nfs.yaml <<EOF
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
          image: quay.io/external_storage/nfs-client-provisioner:latest
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: fuseim.pri/ifs
            - name: NFS_SERVER
              value: 172.18.107.154     #nfs服务器
            - name: NFS_PATH
              value: /                  #共享目录
      volumes:
        - name: nfs-client-root
          nfs:
            server: 172.18.107.154      #nfs服务器
            path: /                     #共享目录
EOF
kubectl apply -f sc-nfs.yaml
```

创建存储类
```
cat > sc.yaml <<EOF 
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: managed-nfs-storage
provisioner: fuseim.pri/ifs      #动态卷非配这名称，必须和上面的"provisioner"变量中的Name一致
parameters:
  archiveOnDelete: "true"        #设置为"false"时,删除PVC，不会保留数据；
EOF
kubectl apply -f sc.yaml
```
注:设置默认存储类(可选)
> netadata.annotations:                                                                     
> storageclass.kubernetes.io/is-default-class: "true"   #设置为默认的storageclass     

创建pvc
```
cat > sc-pvc.yaml <<EOF 
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-claim
  annotations:
    volume.beta.kubernetes.io/storage-class: "managed-nfs-storage"  #需要与上面创建的storageclass的名称一致
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Mi
EOF
kubectl sc-pvc.yaml
```      

测试
创建一个pod，将nfs存储挂载至容器的mnt目录，并创建一个success的文件，观察动态提供状况
```
cat > sc-pod.yaml <<EOF 
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
  - name: test-pod
    image: busybox:1.24
    command:
      - "/bin/sh"
    args:
      - "-c"
      - "touch /mnt/SUCCESS && exit 0 || exit 1"
    volumeMounts:
      - name: nfs-pvc
        mountPath: "/mnt"
  restartPolicy: "Never"
  volumes:
    - name: nfs-pvc
      persistentVolumeClaim:
        claimName: test-claim
EOF
```

动态创建总流程如下:
> pod-->test-claim(pvc)-->managed-nfd-storage(sc存储类)-->provisioner fuseim.pri/ifs(pv:nfs-client)












