---
id: kubectl-commands
title: kubectl Command Reference
sidebar_label: kubectl Commands
description: Complete kubectl command reference — get, describe, apply, delete, exec, logs, port-forward, rollout, debug, and every flag you need for daily Kubernetes operations.
tags: [kubectl, kubernetes, commands, reference, cli, intermediate]
---

# kubectl Command Reference

> Your daily driver for interacting with Kubernetes clusters.

---

## Setup & Context

```bash
# ─── Cluster info ─────────────────────────────────────────────────
kubectl version                         # Client + server version
kubectl cluster-info                    # Cluster endpoint info
kubectl get nodes                       # List all nodes
kubectl get nodes -o wide               # With IPs and OS

# ─── Contexts (clusters) ──────────────────────────────────────────
kubectl config get-contexts             # List all clusters
kubectl config current-context          # Show active cluster
kubectl config use-context prod-cluster # Switch cluster
kubectl config set-context --current --namespace=production  # Set default namespace

# ─── Aliases (add to .bashrc / .zshrc) ────────────────────────────
alias k=kubectl
alias kgp='kubectl get pods'
alias kgd='kubectl get deployments'
alias kgs='kubectl get services'
alias kns='kubectl config set-context --current --namespace'
```

---

## Getting Resources

```bash
# ─── Get ──────────────────────────────────────────────────────────
kubectl get pods                          # Pods in current namespace
kubectl get pods -n production            # Specific namespace
kubectl get pods -A                       # All namespaces
kubectl get pods -o wide                  # With Node, IP
kubectl get pods --show-labels            # With labels
kubectl get pods -l app=my-api            # Filter by label
kubectl get pods -w                       # Watch (live updates)
kubectl get pods --sort-by=.metadata.creationTimestamp  # Sort

# ─── All resource types ───────────────────────────────────────────
kubectl get all                           # Pods, Services, Deployments, ReplicaSets
kubectl get all -n production
kubectl get all -A                        # All namespaces

# ─── Specific resources ───────────────────────────────────────────
kubectl get pod my-pod
kubectl get deployment my-api
kubectl get service my-api-svc
kubectl get ingress
kubectl get configmap
kubectl get secret
kubectl get pvc
kubectl get pv
kubectl get sc                            # StorageClass
kubectl get hpa                           # HorizontalPodAutoscaler
kubectl get pdb                           # PodDisruptionBudget
kubectl get events                        # Events in namespace
kubectl get events --sort-by='.lastTimestamp'
kubectl get events -n production -w       # Watch events live

# ─── Output formats ───────────────────────────────────────────────
kubectl get pod my-pod -o yaml            # Full YAML definition
kubectl get pod my-pod -o json            # JSON
kubectl get pods -o jsonpath='{.items[*].metadata.name}'    # Extract field
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

---

## Describe (Detailed Info + Events)

```bash
kubectl describe pod my-pod               # Full details + events
kubectl describe deployment my-api
kubectl describe service my-api-svc
kubectl describe node worker-node-1
kubectl describe pvc my-pvc
kubectl describe ingress my-ingress

# Tip: always describe when a Pod is stuck in Pending/CrashLoopBackOff
```

### What to Look for in `describe pod`
```
Events section — shows WHY a pod is failing:
  FailedScheduling     → Not enough resources on nodes, affinity issues
  Failed               → Image pull error, container crash
  BackOff              → Container keeps crashing (CrashLoopBackOff)
  OOMKilled            → Exceeded memory limit
  Unhealthy            → Probe failing
```

---

## Apply, Create, Delete

```bash
# ─── Apply (declarative — create or update) ───────────────────────
kubectl apply -f deployment.yaml          # Single file
kubectl apply -f ./k8s/                   # All files in directory
kubectl apply -f ./k8s/ -R               # Recursively
kubectl apply -k ./kustomize/             # Kustomize overlay

# Dry run (validate without applying)
kubectl apply -f deployment.yaml --dry-run=client
kubectl apply -f deployment.yaml --dry-run=server  # Server validation

# Diff before applying
kubectl diff -f deployment.yaml

# ─── Create (imperative) ──────────────────────────────────────────
kubectl create deployment my-api --image=myapp:1.0.0 --replicas=3
kubectl create service clusterip my-api --tcp=80:8080
kubectl create configmap app-config --from-literal=key=value
kubectl create secret generic db-secret --from-literal=password=secret

# Generate YAML without applying (useful as a starting point)
kubectl create deployment my-api --image=myapp:1.0.0 \
  --dry-run=client -o yaml > deployment.yaml

# ─── Delete ───────────────────────────────────────────────────────
kubectl delete pod my-pod
kubectl delete -f deployment.yaml         # Delete by file
kubectl delete -f ./k8s/                  # Delete by directory
kubectl delete deployment my-api
kubectl delete deployment,service my-api  # Multiple types at once
kubectl delete pods -l app=my-api         # By label
kubectl delete pods --all -n staging      # All pods in namespace
kubectl delete namespace staging          # Delete namespace + all resources
```

---

## Logs

```bash
kubectl logs my-pod                       # Pod logs
kubectl logs my-pod -c container-name     # Specific container in pod
kubectl logs my-pod --previous            # Logs from crashed container
kubectl logs -f my-pod                    # Follow (tail -f)
kubectl logs --tail=200 my-pod            # Last 200 lines
kubectl logs --since=1h my-pod            # Last 1 hour
kubectl logs --since-time="2024-01-01T10:00:00Z" my-pod

# All pods matching a label (aggregate logs)
kubectl logs -l app=my-api                # All pods with this label
kubectl logs -l app=my-api -f --max-log-requests=10

# Deployment logs (random pod)
kubectl logs deployment/my-api
kubectl logs deployment/my-api --all-containers=true
```

---

## Exec (Shell into Container)

```bash
kubectl exec -it my-pod -- bash           # Bash shell
kubectl exec -it my-pod -- sh             # sh (Alpine)
kubectl exec -it my-pod -c sidecar -- sh  # Specific container

# Run a single command
kubectl exec my-pod -- java -version
kubectl exec my-pod -- env | sort
kubectl exec my-pod -- cat /app/config/application.yml
kubectl exec my-pod -- ls /app

# Multi-container pod — specify container
kubectl exec -it my-pod -c api -- bash
```

---

## Port Forward (Debug Locally)

```bash
# Forward Pod port to localhost
kubectl port-forward pod/my-pod 8080:8080

# Forward Service port (routes to one of its Pods)
kubectl port-forward service/my-api 8080:80

# Forward Deployment (routes to one Pod)
kubectl port-forward deployment/my-api 8080:8080

# Background
kubectl port-forward service/my-api 8080:80 &

# Access after forwarding:
curl http://localhost:8080/actuator/health

# Common uses:
kubectl port-forward service/prometheus-server 9090:80 -n monitoring
kubectl port-forward service/grafana 3000:80 -n monitoring
kubectl port-forward service/postgres-svc 5432:5432 -n production
```

---

## Rollout Management

```bash
# Status
kubectl rollout status deployment/my-api
kubectl rollout status statefulset/postgres

# History
kubectl rollout history deployment/my-api
kubectl rollout history deployment/my-api --revision=3

# Undo
kubectl rollout undo deployment/my-api               # Roll back to previous
kubectl rollout undo deployment/my-api --to-revision=2

# Pause / Resume (manual canary)
kubectl rollout pause deployment/my-api
kubectl rollout resume deployment/my-api

# Restart all Pods (force rolling restart)
kubectl rollout restart deployment/my-api
kubectl rollout restart daemonset/log-collector
```

---

## Scaling

```bash
kubectl scale deployment my-api --replicas=5
kubectl scale deployment my-api --replicas=0  # Scale to 0 (no pods)
kubectl scale statefulset postgres --replicas=3

# Autoscale
kubectl autoscale deployment my-api --min=2 --max=20 --cpu-percent=70
kubectl get hpa
```

---

## Edit and Patch

```bash
# Interactive edit (opens in $EDITOR)
kubectl edit deployment my-api
kubectl edit configmap app-config

# Patch — change specific field
kubectl patch deployment my-api \
  -p '{"spec":{"replicas":5}}'

kubectl patch deployment my-api \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","image":"myapp:1.3.0"}]}}}}'

# Strategic merge patch
kubectl patch deployment my-api --type=merge \
  -p '{"spec":{"template":{"metadata":{"annotations":{"date":"'$(date +%s)'"}}}}}'

# Force rolling restart via annotation
kubectl patch deployment my-api -p \
  "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"kubectl.kubernetes.io/restartedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}}}}"
# Same as: kubectl rollout restart deployment/my-api
```

---

## Debugging

```bash
# ─── Run a debug container in the cluster ─────────────────────────
kubectl run debug --image=busybox --rm -it --restart=Never -- sh
kubectl run debug --image=nicolaka/netshoot --rm -it --restart=Never -- bash

# ─── Debug a specific node ────────────────────────────────────────
kubectl debug node/worker-1 -it --image=busybox

# ─── Copy Pod with extra debug container (K8s 1.25+) ──────────────
kubectl debug my-pod -it --copy-to=debug-pod --container=debug-container \
  --image=busybox

# ─── Check resource usage ─────────────────────────────────────────
kubectl top pods                          # CPU and memory usage
kubectl top pods -n production
kubectl top pods --sort-by=memory
kubectl top nodes

# ─── Events ───────────────────────────────────────────────────────
kubectl get events -n production --sort-by=.lastTimestamp
kubectl get events -n production --field-selector reason=BackOff
kubectl get events -n production --field-selector involvedObject.name=my-pod
```

---

## Node Management

```bash
kubectl get nodes
kubectl get nodes -o wide               # With IPs
kubectl describe node worker-1

# Cordon — prevent new Pods being scheduled (existing Pods stay)
kubectl cordon worker-1

# Drain — evict all Pods (for maintenance)
kubectl drain worker-1 \
  --ignore-daemonsets \                 # Ignore DaemonSet Pods
  --delete-emptydir-data \             # Delete emptyDir Pods
  --grace-period=60                    # 60s for graceful shutdown

# Uncordon — allow scheduling again
kubectl uncordon worker-1

# Labels on nodes
kubectl label node worker-1 node-type=compute
kubectl label node worker-1 gpu=true
```

---

## Copy Files

```bash
# From Pod to local
kubectl cp my-pod:/app/logs/app.log ./app.log
kubectl cp my-pod:/tmp/dump.hprof ./heap-dump.hprof

# From local to Pod
kubectl cp ./config.yml my-pod:/app/config/config.yml

# With namespace
kubectl cp -n production my-pod:/app/logs/app.log ./app.log

# With container specified
kubectl cp my-pod:/logs ./logs -c log-shipper
```

---

## Useful One-Liners

```bash
# Get a pod's IP
kubectl get pod my-pod -o jsonpath='{.status.podIP}'

# Get all pod IPs with names
kubectl get pods -o custom-columns=NAME:.metadata.name,IP:.status.podIP

# Find which node a pod is on
kubectl get pod my-pod -o jsonpath='{.spec.nodeName}'

# Delete all pods in CrashLoopBackOff
kubectl get pods -n production | grep CrashLoopBackOff | \
  awk '{print $1}' | xargs kubectl delete pod -n production

# Delete all completed Jobs
kubectl delete jobs --field-selector status.successful=1

# Force delete a stuck pod
kubectl delete pod my-pod --grace-period=0 --force

# Get decode a secret
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d

# Restart a deployment
kubectl rollout restart deployment/my-api

# Watch all pods until they're Running
kubectl get pods -w -n production

# Count pods by status
kubectl get pods -A | awk '{print $4}' | sort | uniq -c
```

---

## Interview Questions

1. What is the difference between `kubectl apply` and `kubectl create`?
2. How do you view logs of a container that already crashed?
3. How do you access a service that has no external endpoint, for debugging?
4. What is `kubectl drain` and when would you use it?
5. What is the difference between `kubectl cordon` and `kubectl drain`?
6. How do you perform a zero-downtime rolling restart of all Pods in a Deployment?
7. What does `kubectl describe pod` show that `kubectl get pod` doesn't?
8. How do you watch Pod status in real time?
9. How do you extract a value from a Kubernetes resource using `kubectl`?
10. How do you force delete a Pod that is stuck terminating?
