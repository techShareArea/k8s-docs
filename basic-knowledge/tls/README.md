#### 从给定的（public/private）公钥/私钥对创建TLS secret 
公共密钥证书必须是.PEM编码并匹配指定的私钥

#### 语法     
> tls NAME --cert=path/to/cert/file --key=path/to/key/file [--dry-run]      

#### 示例
> kubectl create secret tls tls-secret --cert=path/to/tls.cert --key=path/to/tls.key

#### 案例
```
cat > tls.yaml <<-EOF 
apiVersion: v1
data:
  tls.crt: xxx
  tls.key: xxx
kind: Secret
metadata:
  name: tls-ecaicn-com
  namespace: dev
type: kubernetes.io/tls
EOF
```