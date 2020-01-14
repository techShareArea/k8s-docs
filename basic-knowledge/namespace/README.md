#### 用途
当团队或项目中具有许多用户时，可以考虑使用Namespace来区分，如果是少量用户集群，可以不需要考虑使用Namespace。
默认情况下，相同Namespace中的对象将具有相同的访问控制策略。
对于稍微不同的资源没必要使用多个Namespace来划分，例如同一软件的不同版本，可以使用labels(标签)来区分同一Namespace中的资源。

#### 使用
##### 一.创建
法1: 在命令行直接创建
> kubectl create ns/namespace dev/test/uat/prod     

法2. 通过文件创建
```
cat > dev.yaml <<-EOF       
apiVersion: v1        
kind: Namespace       
metadata:     
  name: dev   
EOF     
kubectl create -f ./dev.yaml
```

注意：命名空间名称满足正则表达式[a-z0-9]([-a-z0-9]*[a-z0-9])?,最大长度为63位

##### 二.删除
> kubectl delete ns/namespace dev/test/uat/prod      
or            
> kubectl delete -f ./dev.yaml      

注意:
1. 删除一个namespace会自动删除所有属于该namespace的资源；
2. default和kube-system命名空间不可删除；
3. PersistentVolumes是不属于任何namespace的，但PersistentVolumeClaim是属于某个特定namespace的；
4. Events是否属于namespace取决于产生events的对象。

#### 查看ns/namespace
> kubectl get ns/namespace