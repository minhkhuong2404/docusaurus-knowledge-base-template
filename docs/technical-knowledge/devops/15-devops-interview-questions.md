---
id: devops-interview-questions
title: Docker & Kubernetes Interview Questions
sidebar_label: Interview Questions
description: Comprehensive Docker and Kubernetes interview question bank covering containers, images, networking, storage, workloads, services, security, and troubleshooting scenarios.
tags: [docker, kubernetes, interview-prep, questions, devops]
---

# Docker & Kubernetes Interview Questions

---

## Docker — Core Concepts

### Q1: What is the difference between a Docker image and a container?
**Answer:** An image is an immutable, layered blueprint — a read-only snapshot of a filesystem and configuration. A container is a running (or stopped) instance of an image with a thin writable layer on top. You can run many containers from one image. When the container is removed, its writable layer is deleted; the image remains.

---

### Q2: What are Docker image layers and why do they matter?
**Answer:** Each instruction in a Dockerfile creates a new read-only layer. Layers are cached and shared. If a layer hasn't changed, Docker reuses it from cache — dramatically speeding up builds. The key implication: put instructions that change rarely (install dependencies) before instructions that change often (copy source code). This way, only the frequently-changing layers are rebuilt on each commit.

---

### Q3: What is a multi-stage build and why would you use it?
**Answer:** A multi-stage build uses multiple `FROM` instructions in one Dockerfile. You build in an early stage (with full JDK, build tools) and copy only the compiled artifact to a minimal final stage (JRE only). This separates build-time dependencies from runtime — resulting in images 3–5× smaller, fewer CVEs (no build tools exposed), and faster deploys.

---

### Q4: Explain the difference between `CMD` and `ENTRYPOINT`.
**Answer:** Both define what runs when the container starts. `ENTRYPOINT` sets the fixed executable that cannot be overridden — arguments are appended to it. `CMD` provides default arguments that are replaced entirely when you pass a command to `docker run`. Best practice: combine both — `ENTRYPOINT ["java"]` + `CMD ["-jar", "app.jar"]` means the container always runs Java, but you can override the JAR path at runtime.

---

### Q5: What happens when a container exceeds its memory limit?
**Answer:** The container is OOM-killed (Out of Memory killed) by the Linux kernel's OOM killer. Kubernetes then restarts it (if the restart policy allows). This is why you should set memory limits: to control the blast radius of a memory leak and prevent one container from starving the entire node. Important: CPU limits throttle (slow down) but do NOT kill.

---

## Docker — Networking and Storage

### Q6: What is the difference between a user-defined bridge network and the default bridge?
**Answer:** The default bridge network doesn't provide DNS — containers can only reach each other by IP. A user-defined bridge network provides automatic DNS resolution by container name, making `curl http://postgres:5432` work. User-defined networks also provide better isolation — only explicitly connected containers can communicate.

---

### Q7: What is the difference between a named volume and a bind mount?
**Answer:** A named volume is managed by Docker (stored in `/var/lib/docker/volumes/`) and survives container removal. A bind mount links a specific host path directly into the container — useful for dev (live code reload) but ties the container to the host's filesystem layout. Named volumes are preferred in production; bind mounts are preferred in local development.

---

## Docker Compose

### Q8: What does `docker compose down -v` do?
**Answer:** It stops and removes all containers and networks defined in the Compose file (`docker compose down`), and ALSO removes all named volumes (`-v`). This destroys all persistent data (database, file uploads). Safe for a clean reset in development; **never run in production** without explicit intent.

---

### Q9: How does service name resolution work in Docker Compose?
**Answer:** Docker Compose creates a shared network for all services in the file. Each service name becomes a DNS hostname on that network. So `api` can reach `postgres` by using `postgres` as the hostname — Docker's internal DNS resolves it to the container's IP. No need for hardcoded IPs.

---

## Kubernetes — Architecture

### Q10: Explain the Kubernetes reconciliation loop.
**Answer:** Kubernetes controllers continuously watch the desired state (stored in etcd) and compare it with the actual state of the cluster. When they differ, the controller takes action to close the gap. For example, if a Deployment specifies 3 replicas but only 2 Pods exist (one crashed), the ReplicaSet controller creates a new Pod. This loop runs forever — Kubernetes is always self-healing.

---

### Q11: What is etcd and what would happen if it was lost?
**Answer:** etcd is the distributed key-value store that holds the entire cluster state — all resource definitions, secrets, and configurations. Losing etcd without a backup means losing the entire cluster configuration — you'd know pods are running but have no record of what was supposed to be running. Always back up etcd in production; cloud-managed K8s (EKS, GKE) handles this automatically.

---

### Q12: What is the role of the kube-scheduler?
**Answer:** The scheduler watches for newly created Pods with no assigned node and decides which node they should run on. It evaluates each node based on: available resources (respecting requests), node selectors, affinity rules, taints and tolerations, and topology spread constraints. It never moves running Pods — it only places new ones.

---

## Kubernetes — Pods and Workloads

### Q13: What is the difference between a liveness probe and a readiness probe?
**Answer:**
- **Liveness probe:** "Is this container alive?" If it fails, Kubernetes restarts the container. Use for detecting a deadlocked or hung app.
- **Readiness probe:** "Is this container ready to serve traffic?" If it fails, Kubernetes removes the Pod from the Service's endpoints — no traffic is routed to it. Use during startup or temporary overload.
- A Pod can be live (not restarted) but not ready (not receiving traffic) — this is the intended behaviour during a rolling update.

---

### Q14: What is the difference between a Deployment and a StatefulSet?
**Answer:** A Deployment manages stateless, interchangeable Pods (random names, any order). A StatefulSet is for stateful apps needing: stable network identity (pod-0, pod-1... with consistent DNS), ordered startup/shutdown (pod-0 before pod-1), and per-Pod persistent storage (each Pod gets its own PVC via `volumeClaimTemplates`). Use StatefulSets for databases (Cassandra, Kafka, Elasticsearch).

---

### Q15: What is a DaemonSet and give a real-world use case.
**Answer:** A DaemonSet ensures exactly one Pod runs on every Node (or selected nodes). When a new node joins the cluster, the DaemonSet Pod is automatically scheduled on it. Real-world uses: log collectors (Fluentd, Filebeat), monitoring agents (Prometheus Node Exporter, Datadog agent), network plugins (CNI agents), security agents (Falco, CrowdStrike).

---

## Kubernetes — Services and Networking

### Q16: Trace an HTTP request from a user's browser to a Pod.
**Answer:**
1. User DNS resolves `api.example.com` → external IP
2. Cloud load balancer receives the request on port 443
3. Load balancer forwards to a NodePort on one of the cluster nodes
4. `kube-proxy` iptables/IPVS rules NAT the packet to a ClusterIP
5. ClusterIP load-balances to one of the backing Pod IPs
6. Pod receives the request on its container port (e.g. 8080)

---

### Q17: What is the difference between ClusterIP, NodePort, and LoadBalancer service types?
**Answer:**
- **ClusterIP:** Internal-only virtual IP. Only reachable from within the cluster. Most common type.
- **NodePort:** Opens a port (30000–32767) on every Node. External access via `<NodeIP>:<NodePort>`. Used for on-premise without cloud LB.
- **LoadBalancer:** Provisions a cloud load balancer (AWS ALB/NLB). Gets an external IP. One LB per Service — expensive for many services; use Ingress instead.

---

### Q18: What is an Ingress and why is it better than multiple LoadBalancer services?
**Answer:** An Ingress is an HTTP routing layer sitting in front of multiple Services. One cloud load balancer handles all HTTP/HTTPS traffic; the Ingress Controller routes to different Services based on hostname or path (`api.example.com/v1` → service-v1, `api.example.com/v2` → service-v2). Cost: 1 load balancer instead of N. Also centralises TLS termination.

---

## Kubernetes — Storage and Configuration

### Q19: What is the difference between a ConfigMap and a Secret?
**Answer:** Both store configuration. ConfigMaps are for non-sensitive data (app settings, feature flags, config files). Secrets are for sensitive data (passwords, tokens, certificates) — they're base64-encoded and have additional access controls. Important caveat: base64 is **not encryption**. For true secret security, enable etcd encryption at rest or use external secrets managers (Vault, AWS Secrets Manager via External Secrets Operator).

---

### Q20: What is a StorageClass and what is dynamic provisioning?
**Answer:** A StorageClass defines a "class" of storage (e.g., "fast-ssd" using AWS EBS gp3). Dynamic provisioning means when a PVC is created requesting a StorageClass, Kubernetes automatically creates a matching PersistentVolume by calling the cloud provider's API — no manual PV creation needed. Without a StorageClass, an admin must manually create PVs.

---

## Kubernetes — Production Patterns

### Q21: What should every production Deployment include?
**Answer:** 
- Multiple replicas (≥ 2)
- `maxUnavailable: 0` rolling update (zero downtime)
- Resource `requests` AND `limits` on every container
- Liveness and readiness probes
- Non-root user in security context
- Read-only root filesystem
- Pod anti-affinity to spread across nodes
- Pod Disruption Budget (PDB) to protect during node maintenance

---

### Q22: A Pod is in `CrashLoopBackOff`. How do you debug it?
**Answer:**
```bash
# 1. Check the events
kubectl describe pod <pod-name> -n <namespace>
# Look at: Events section, Last State, Exit Code

# 2. Check logs of crashed container
kubectl logs <pod-name> --previous
# (--previous shows logs from the last crashed container)

# 3. Check exit code
# Exit 1 = application error
# Exit 137 = OOMKilled (memory limit exceeded)
# Exit 139 = Segfault
# Exit 143 = SIGTERM (graceful shutdown)

# 4. Try running command manually
kubectl exec -it <pod-name> -- sh
# Or if container won't start:
kubectl debug <pod-name> -it --copy-to debug-pod --container debug --image=busybox
```

---

### Q23: How do you achieve zero-downtime deployments?
**Answer:**
1. **Readiness probe:** Kubernetes only routes traffic to a new Pod after it passes the readiness probe
2. **`maxUnavailable: 0`:** No old Pods are removed until new ones are ready
3. **`minAvailable` PDB:** Ensures minimum Pods remain running during the rollout
4. **Graceful shutdown:** `preStop` lifecycle hook + `terminationGracePeriodSeconds` to drain existing connections
5. **Health endpoint:** Spring Boot's `/actuator/health/readiness` — mark NOT_READY when shutdown begins

---

## Helm

### Q24: What is the difference between `helm install` and `helm upgrade --install`?
**Answer:** `helm install` fails if the release already exists. `helm upgrade --install` is idempotent — it installs if the release doesn't exist, upgrades if it does. This is the standard pattern in CI/CD pipelines where you don't know if it's the first deployment or not.

---

## Quick-Fire Reference

| Question | Answer |
|---|---|
| Default Docker network driver? | bridge |
| Port range for NodePort services? | 30000–32767 |
| K8s smallest deployable unit? | Pod |
| What stores all K8s state? | etcd |
| How many containers share a Pod's IP? | All of them (same IP) |
| What kills a container over its memory limit? | OOM killer → container OOMKilled |
| What slows (but doesn't kill) over CPU limit? | CPU throttling |
| What K8s resource ensures 1 Pod per node? | DaemonSet |
| What makes StatefulSet Pods unique? | Stable name + DNS + own PVC |
| Helm equivalent of `kubectl apply`? | `helm upgrade --install` |
| How to port-forward a K8s service locally? | `kubectl port-forward svc/my-svc 8080:80` |
| What does `EXPOSE` in Dockerfile actually do? | Documentation only — doesn't publish ports |
| Difference between `docker stop` and `docker kill`? | stop = SIGTERM → wait → SIGKILL; kill = immediate SIGKILL |
| What is a headless Service? | Service with `clusterIP: None` — returns Pod IPs directly |
