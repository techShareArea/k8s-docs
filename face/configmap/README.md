### 简述
configMap允许你把配置文件从image镜像本地中解耦出来，来保持集装箱化应用的便携性。     
configMap可以通过监听在配置文件，命令行参数，环境变量等其它配置的架构中，然后在的pod容器和系统组件运行时，达到配置的加载功能。       

注:      
> configMap保存非敏感的配置信息           

### 应用

#### 命令行方式      
Ⅰ.--from-leteral             
> kubectl create configmap [NAME] [DATA]        
> eg:kubectl create cm filebeat-cfg -n config --from=redis_host="redis.rest.com" --from-literal=log_level="info"              

此为从字面读取，好处是快速和便捷，可以通过关键字参数的形式(**kargs),将配置信息传递至configmap,然后在pod启动的时候进行加载；   
弊端:做不到变量的更新，环境变量的加载只有在容器运行时才起作用。

使用此方法进行申明，得使用环境变量的方式，让容器读取到配置:
eg:
```
apiVersion: v1
kind: Pod
spec: 
  containers:
  - nginx: nginx
    image: nginx
    env: 
    - name: nginx_host
      valueFrom:
        configMapKeyRef:        #从configmap中读取
          key: redis_host       #上面我们定义的变量名     
```
be
注:具体字段配置，请查阅:
> kubectl explain pod.spec.containers.env.name.valueFrom.configMapKeyRef        

Ⅱ.--from-file       
从目录读取的好处:允许你更好的进行配置文件的管理        
> kubectl create configmap nginx-cfg -n config --from-file=/root/mainfast/conf.d/       
> --from-file指明需要从哪个目录下面读取，目录下的文件只要按照一档格式就可以成功加载        

注:      
> 通过目录加载configMap,其变量名是文件名，变量值是文件内容     

通过目录的方式进行配置加载，需要配合使用volume进行配置的读取，eg:
```
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMouts:
    - name: nginx-conf                  #自定义volume的名字，这里是引用
      mountPath: /etc/nginx/conf.d/     #挂载到pod中的路径
  volumes:
  - name: nginx-conf                    #自定义volume的名字，这里是定义
    configMap:
      defaultMode: 0644
      name: nginx-cfg                   #configMap名
      items:
      - key: server1.conf               #configMap中的变量名
        path: server1_new.conf          #期望以什么名字保存在pod目录中
```

注:具体字段查阅命令            
> kubectl explain pod sepc.volumes.configMap        

#### yaml配置文件方式     
查看configmap的配置字段信息
> kubectl explain configmap     

### 实战
Ⅰ.--from-literal        
注:      
> 此方式的配置环境变量，Pod生命周期内的配置变更不会热加载     

略







