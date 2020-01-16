#### configmap配置挂载

#### 示例
使用ConfigMap中的数据来配置Redis缓存
```
cat > redis-config <<-EOF 
maxmemory 2mb
maxmemory-policy allkeys-lru
EOF
```
将pod的资源配置添加到kustomization.yaml文件中
```
cat > kustomization.yaml <<-EOF 
configMapGenerator:
- name: example-redis-config
  files:
  - redis-config
resources:
  - redis-pod.yaml
EOF
```
pod配置
```
cat redis-pod.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: redis
  namespace: dev
spec:
  containers:
  - name: redis
    image: kubernetes/redis:v1
    env:
    - name: MASTER
      value: "true"
    ports:
    - containerPort: 6379
    resources:
      limits:
        cpu: "0.1"
    volumeMounts:
    - mountPath: /redis-master-data
      name: data
    - mountPath: /redis-master
      name: config
  volumes:
    - name: data
      emptyDir: {}
    - name: config
      configMap:
        name: example-redis-config
        items:
        - key: redis-config
          path: redis.conf
EOF
```
创建ConfigMap和Pod对象
> kubectl apply -k .        

检查创建的对象
> kubectl get -k .      

说明：
配置卷挂载在/redis-master下。它使用path将redis-config密钥添加到名为redis.conf的文件中。因此，redis配置的文件路径为/redis-master/redis.conf。 这是镜像将在其中查找redis master的配置文件的位置。

使用kubectl exec进入pod并运行redis-cli工具来验证配置已正确应用：
> $ kubectl exec -it redis redis-cli        
> 127.0.0.1:6379> CONFIG GET maxmemory          
> 1) "maxmemory"        
> 2) "2097152"  
> 127.0.0.1:6379> CONFIG GET maxmemory-policy       
> 1) "maxmemory-policy"         
> 2) "allkeys-lru"       

删除创建的pod
> kubectl delete pod redis         