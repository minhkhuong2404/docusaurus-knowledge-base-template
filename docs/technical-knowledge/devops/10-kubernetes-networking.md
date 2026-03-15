---
id: kubernetes-networking
title: Services & Networking
sidebar_label: Services & Networking
description: Kubernetes networking guide — Service types (ClusterIP, NodePort, LoadBalancer, ExternalName), Ingress, DNS, NetworkPolicy, and how traffic flows from the internet to a Pod.
tags: [kubernetes, services, networking, ingress, clusterip, loadbalancer, dns, networkpolicy, intermediate]
---

# Services & Networking

> Pods are ephemeral — they come and go with new IPs each time. A **Service** gives you a stable endpoint to reach them.

---

## Why Services Exist

```
Before Service:
  Pod A → connects to Pod B at 10.244.1.5
  Pod B crashes → recreated at 10.244.2.7
  Pod A → ??? (IP changed, connection broken)

With Service:
  Service "my-api" → stable ClusterIP: 10.96.0.42
  Pod A → connects to 10.96.0.42 (always works)
  Service load-balances to healthy backing Pods automatically
```

---

## Service Types

### 1. ClusterIP (Default)
Internal-only. Accessible only within the cluster.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api
spec:
  type: ClusterIP          # Default — can omit
  selector:
    app: my-api            # Route to Pods with this label
  ports:
    - name: http
      port: 80             # Service port (what clients connect to)
      targetPort: 8080     # Container port (what the Pod listens on)
      protocol: TCP
    - name: management
      port: 9090
      targetPort: 9090
```

```
Inside cluster:
  curl http://my-api         # Resolves via DNS → ClusterIP
  curl http://my-api:80      # Explicit port
  curl http://my-api.default.svc.cluster.local  # Fully qualified
```

---

### 2. NodePort
Exposes service on each Node's IP at a static port (30000–32767).

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api-nodeport
spec:
  type: NodePort
  selector:
    app: my-api
  ports:
    - port: 80            # ClusterIP port
      targetPort: 8080    # Container port
      nodePort: 30080     # Port on every Node (omit for random)
```

```
Traffic flow:
  External → NodeIP:30080 → ClusterIP:80 → Pod:8080
```

**Use case:** Development, on-premise without cloud load balancer. Rarely used in production cloud deployments.

---

### 3. LoadBalancer
Provisions a cloud load balancer. Most common for production.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api-lb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"  # AWS NLB
    service.beta.kubernetes.io/aws-load-balancer-internal: "false"
spec:
  type: LoadBalancer
  selector:
    app: my-api
  ports:
    - port: 80
      targetPort: 8080
```

```
Traffic flow:
  Internet → AWS ALB/NLB (external IP) → NodePort → Pod:8080
```

**Problem with LoadBalancer:** One external IP / load balancer per service = expensive and complex. Use Ingress for HTTP traffic instead.

---

### 4. ExternalName
Maps a service to an external DNS name. No proxying — just DNS CNAME.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-database
spec:
  type: ExternalName
  externalName: mydb.rds.amazonaws.com   # External hostname
```

```
Inside cluster:
  jdbc:postgresql://my-database:5432/mydb
  → resolves to mydb.rds.amazonaws.com via DNS
```

**Use case:** Reference external services (RDS, ElastiCache) from within the cluster using Kubernetes DNS names.

---

### 5. Headless Service
No ClusterIP — direct Pod IPs returned by DNS. Used by StatefulSets.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None         # ← headless
  selector:
    app: postgres
  ports:
    - port: 5432
```

```
DNS lookup for postgres-headless returns ALL Pod IPs:
  nslookup postgres-headless → 10.244.1.1, 10.244.2.1, 10.244.3.1

StatefulSet Pods get individual DNS:
  postgres-0.postgres-headless.default.svc.cluster.local → 10.244.1.1
```

---

## Ingress

HTTP/HTTPS routing into the cluster from outside. One LoadBalancer handles all HTTP services.

```
Without Ingress:                   With Ingress:
  /api  → LoadBalancer #1            One LoadBalancer
  /web  → LoadBalancer #2          → Ingress Controller
  /docs → LoadBalancer #3          → Routes by path/host
  Cost: 3× load balancers          Cost: 1 load balancer
```

### Ingress Resource

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"   # Auto TLS cert

spec:
  ingressClassName: nginx          # Which Ingress Controller to use

  # TLS
  tls:
    - hosts:
        - api.example.com
        - www.example.com
      secretName: my-tls-secret    # Certificate stored as Secret

  # Routing rules
  rules:
    # Route by host
    - host: api.example.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: api-v1-svc
                port:
                  number: 80

          - path: /v2
            pathType: Prefix
            backend:
              service:
                name: api-v2-svc
                port:
                  number: 80

    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
```

### Path Types
| Type | Behaviour |
|---|---|
| `Exact` | Exactly matches `/foo` — not `/foo/` or `/foo/bar` |
| `Prefix` | Matches `/foo` and `/foo/bar` and `/foo/baz` |
| `ImplementationSpecific` | Controller-defined |

### Popular Ingress Controllers
| Controller | Notes |
|---|---|
| **nginx** | Most common. `kubectl apply -f ingress-nginx.yaml` |
| **Traefik** | Dynamic config, auto-discovers services |
| **AWS ALB** | Native AWS integration (`aws-load-balancer-controller`) |
| **GCE** | Native GKE integration |
| **Istio** | Full service mesh with gateway |

```bash
# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Check Ingress status
kubectl get ingress
kubectl describe ingress my-ingress
```

---

## Kubernetes DNS

Every Service gets a DNS entry: `<service>.<namespace>.svc.cluster.local`

```
Service: my-api  in namespace: production

Full name:  my-api.production.svc.cluster.local
Short name: my-api.production    (from other namespaces)
Shortest:   my-api               (within same namespace)
```

```bash
# Test DNS from inside a Pod
kubectl run -it --rm dns-test --image=busybox --restart=Never -- sh
  $ nslookup my-api
  $ nslookup my-api.production.svc.cluster.local
  $ nslookup kubernetes.default.svc.cluster.local
```

### CoreDNS
Kubernetes uses **CoreDNS** as its cluster DNS server. Runs as a Deployment in `kube-system`.

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get configmap coredns -n kube-system -o yaml   # CoreDNS config
```

---

## Network Policy

Controls which Pods can communicate with each other. Default: all traffic allowed.

```yaml
# Deny ALL ingress to "api" Pods — then explicitly allow needed traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: my-api            # Apply to Pods labeled app=my-api

  policyTypes:
    - Ingress
    - Egress

  ingress:
    # Allow traffic from nginx ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080

    # Allow monitoring from Prometheus
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
          podSelector:
            matchLabels:
              app: prometheus
      ports:
        - port: 9090

  egress:
    # Allow outbound to postgres
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - port: 5432

    # Allow DNS
    - to:
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
```

> ⚠ NetworkPolicy requires a CNI plugin that supports it: **Calico**, **Cilium**, **WeaveNet**. Flannel does NOT support NetworkPolicy.

---

## Traffic Flow: Internet to Pod

```
1. User → DNS → myapp.example.com → External IP
2. External IP → Cloud Load Balancer (AWS ALB)
3. ALB → Kubernetes NodePort (30080) on any Node
4. Node iptables/IPVS → kube-proxy rules → Service ClusterIP
5. ClusterIP → load balanced to one of the backing Pods
6. Pod → Container listening on port 8080

In full:
  User → ALB:443 → NodePort:30443 → Service:443 → Pod:8080
```

---

## Service Discovery Pattern for Spring Boot

```yaml
# application.yml in Kubernetes
spring:
  datasource:
    url: jdbc:postgresql://postgres-svc.production.svc.cluster.local:5432/mydb
    # OR short name (same namespace):
    url: jdbc:postgresql://postgres-svc:5432/mydb
  data:
    redis:
      host: redis-svc   # K8s Service name as hostname
      port: 6379
```

---

## Interview Questions

1. What is a Kubernetes Service and why is it needed?
2. What are the four Service types? When would you use each?
3. What is the difference between a ClusterIP and a LoadBalancer service?
4. What is an Ingress and why is it preferable to multiple LoadBalancer services?
5. How does Kubernetes DNS work? What is the format of a fully qualified service name?
6. What is a headless Service and why do StatefulSets use them?
7. What is a NetworkPolicy? What is the default behaviour without one?
8. Trace the path of an HTTP request from a user's browser to a container running in Kubernetes.
9. What is an Ingress Controller and how does it relate to the Ingress resource?
10. What CNI plugin do you need for NetworkPolicy to work?
