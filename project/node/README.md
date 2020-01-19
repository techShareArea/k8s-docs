#### 配置时间的cm
> kubectl create cm timezone --from-file=../timezone/timezone


#### 部署后端
##### 创建后端的cm文件配置
> kubectl create cm xxx-config --from-file=./config -n dev      

##### 部署backend deployment
> kubectl apply -f ./backend/front-deployment.yaml

###### 部署backend service
> kubectl apply -f ./backend/front-service.yaml

##### 部署backend ingress
> kubectl apply -f ./backend/front-ingress.yaml


#### 部署前端
##### 创建前端的cm文件配置
> kubectl create cm xxx --from-file=site.config.js -n dev

##### 部署front deployment
> kubectl apply -f ./front/front-deployment.yaml

##### 部署front service
> kubectl apply -f ./front/front-service.yaml

##### 部署front ingress
> kubectl apply -f ./front/front-ingress.yaml


#### 部署redis
##### 部署redis pod
> kubectl apply -f ../redis/redis-pod.yaml

#### 部署redis service
> kubectl apply -f ../redis/redis-svc.yaml


#### 部署zk
##### 部署zk pod
> kubectl apply -f ../zk/zk-pod.yaml

#### 部署zk service
> kubectl apply -f ../zk/zk-svc.yaml

#### 部署rabbitmq
##### 部署rabbitmq pod
> kubectl apply -f ../rabbitmq/rabbitmq-pod.yaml

#### 部署rabbitmq service
> kubectl apply -f ../rabbitmq/rabbitmq-svc.yaml

##### 部署rabbitmq ingress
> kubectl apply -f ../rabbitmq/rabbitmq-ingress.yaml

#### 部署rabbitmq service lb
> kubectl apply -f ../rabbitmq/rabbitmq-svc-lb.yaml

#### 部署rabbitmq service lb domain
> kubectl apply -f ../rabbitmq/rabbitmq-svc-lb-domain.yaml



