### 简述
job控制器负责批量处理短暂的一次性任务，即仅执行一次的任务，并根据Spec字段的属性创建Pod资源，并持续监控Pod的状态，直至其状态为Completed；如果失败，则根据restartPolicy重启策略决定是否创建新的Pod再次重试任务。

### 作用
1. 文件日志备份
2. 数据迁移操作

### 核心配置
```
restartPolicyL
  "OnFailure"   #失败就重启
  "Never"       #就算失败也不重启
```

### 示例
Ⅰ.单任务串行
```
cat > simple-job.yaml <<EOF 
apiVersion: batch/v1
kind: Job
metadata:
  name: job-demo
spec:
  template:
    metadata:
      labels:
        app: myjob
    spec:
      containers:
      - name: myjob
        image: alpine
        command:
          - /bin/sh
          - -c
          - sleep 10
      restartPolicy: Never
EOF
kubectl apply -f simple-job.yaml
```

查看执行情况
> kubectl get pod --show-labels -A -l app=myjob     
```
NAMESPACE   NAME             READY   STATUS      RESTARTS   AGE   LABELS
default     job-demo-9wxcp   0/1     Completed   0          42s   app=myjob,controller-uid=b86db210-53ef-11ea-968f-00163e06fdcf,job-name=job-demo
```
注:STATUS为Completed时，即为job任务完成

Ⅱ.多任务串行
```
cat > mul-job.yaml <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: job-demo
spec:
  completions: 5
  parallelism: 2
  template:
    metadata:
      labels:
        app: myjob
    spec:
      containers:
      - name: myjob
        image: alpine
        command:
          - /bin/sh
          - -c
          - sleep 10
      restartPolicy: Never
EOF
kubectl apply -f mul-job.yaml
```

查看执行情况
```
kubectl get pod --show-labels -A -l app=myjob
NAMESPACE   NAME             READY   STATUS      RESTARTS   AGE   LABELS
default     job-demo-8vxzl   0/1     Completed   0          48s   app=myjob,controller-uid=edd9d5b4-53f0-11ea-968f-00163e06fdcf,job-name=job-demo
default     job-demo-9c76b   0/1     Completed   0          48s   app=myjob,controller-uid=edd9d5b4-53f0-11ea-968f-00163e06fdcf,job-name=job-demo
default     job-demo-nn6dn   0/1     Completed   0          31s   app=myjob,controller-uid=edd9d5b4-53f0-11ea-968f-00163e06fdcf,job-name=job-demo
default     job-demo-pmp67   0/1     Completed   0          28s   app=myjob,controller-uid=edd9d5b4-53f0-11ea-968f-00163e06fdcf,job-name=job-demo
default     job-demo-xbtgg   0/1     Completed   0          16s   app=myjob,controller-uid=edd9d5b4-53f0-11ea-968f-00163e06fdcf,job-name=job-demo

```































