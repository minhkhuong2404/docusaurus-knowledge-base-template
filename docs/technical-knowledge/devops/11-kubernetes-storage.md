---
id: kubernetes-storage
title: Storage — PV, PVC, ConfigMaps & Secrets
sidebar_label: Storage & Config
description: Kubernetes storage guide — PersistentVolumes, PersistentVolumeClaims, StorageClasses, dynamic provisioning, ConfigMaps, Secrets, and how to inject configuration into Pods.
tags: [kubernetes, storage, persistentvolume, pvc, storageclass, configmap, secrets, intermediate]
---

# Storage — PV, PVC, ConfigMaps & Secrets

---

## Kubernetes Storage Concepts

```
StorageClass    ← Defines HOW to provision storage (AWS EBS, NFS, etc.)
     ↓
PersistentVolume (PV)   ← Actual storage resource (manually or dynamically created)
     ↓
PersistentVolumeClaim (PVC)  ← Pod's REQUEST for storage
     ↓
Pod                     ← Mounts the PVC as a volume
```

---

## PersistentVolume (PV)

A PV is a piece of storage in the cluster — provisioned manually by an admin or automatically via a StorageClass.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce              # See access modes table below
  reclaimPolicy: Retain          # Retain | Delete | Recycle
  storageClassName: fast-ssd
  # Backend: AWS EBS
  awsElasticBlockStore:
    volumeID: vol-0abcdef1234567890
    fsType: ext4
```

### Access Modes
| Mode | Short | Description |
|---|---|---|
| `ReadWriteOnce` | RWO | One node can read/write — **most common** |
| `ReadOnlyMany` | ROX | Many nodes can read |
| `ReadWriteMany` | RWX | Many nodes can read/write — needs NFS/EFS |
| `ReadWriteOncePod` | RWOP | Only one Pod can read/write (K8s 1.22+) |

### Reclaim Policy
| Policy | What happens when PVC is deleted |
|---|---|
| `Retain` | PV preserved — manual cleanup needed |
| `Delete` | PV and underlying storage deleted automatically |
| `Recycle` | Data deleted, PV made available again (deprecated) |

---

## PersistentVolumeClaim (PVC)

A PVC is a **request** for storage by a Pod. Kubernetes finds a matching PV (or creates one via StorageClass).

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd       # Must match StorageClass name
  resources:
    requests:
      storage: 20Gi
  # Optional: select a specific PV
  selector:
    matchLabels:
      type: ssd
```

### Use PVC in a Pod
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: postgres
      image: postgres:16-alpine
      volumeMounts:
        - mountPath: /var/lib/postgresql/data
          name: pgdata

  volumes:
    - name: pgdata
      persistentVolumeClaim:
        claimName: postgres-pvc   # Reference the PVC
```

---

## StorageClass (Dynamic Provisioning)

Automatically creates PVs when a PVC requests them. No manual PV creation needed.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"   # Default SC
provisioner: ebs.csi.aws.com         # AWS EBS CSI driver
volumeBindingMode: WaitForFirstConsumer  # Provision in same AZ as Pod
reclaimPolicy: Delete
parameters:
  type: gp3                          # EBS volume type
  iops: "3000"
  throughput: "125"
  encrypted: "true"
allowVolumeExpansion: true           # Allow PVC resize
```

### Common StorageClass Provisioners
| Cloud | Provisioner | Volume Type |
|---|---|---|
| AWS | `ebs.csi.aws.com` | EBS (gp3, io2) |
| AWS | `efs.csi.aws.com` | EFS (ReadWriteMany) |
| GCP | `pd.csi.storage.gke.io` | Persistent Disk |
| Azure | `disk.csi.azure.com` | Azure Disk |
| Local | `kubernetes.io/no-provisioner` | Local disk (no dynamic) |
| Any | `nfs.csi.k8s.io` | NFS |

```bash
# List StorageClasses
kubectl get sc

# Check PVC status
kubectl get pvc
# NAME          STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS
# postgres-pvc  Bound    pvc-abc123  20Gi       RWO            fast-ssd

# Describe for events and details
kubectl describe pvc postgres-pvc
```

---

## ConfigMap

Store **non-sensitive** configuration. Decouple config from container images.

### Create ConfigMap

```yaml
# ─── Key-value pairs ──────────────────────────────────────────────
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  # Simple key-value
  APP_NAME: "My Application"
  APP_ENV: "production"
  MAX_CONNECTIONS: "100"
  LOG_LEVEL: "INFO"

  # File content (multi-line value)
  application.yml: |
    server:
      port: 8080
    spring:
      application:
        name: my-api
      jpa:
        show-sql: false

  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://api:8080;
      }
    }
```

```bash
# Create from literal values
kubectl create configmap app-config \
  --from-literal=APP_NAME="My App" \
  --from-literal=LOG_LEVEL=INFO

# Create from file
kubectl create configmap app-config --from-file=application.yml

# Create from directory (all files become keys)
kubectl create configmap app-config --from-file=./config/
```

### Use ConfigMap in Pod

```yaml
# ─── Method 1: As individual env vars ─────────────────────────────
containers:
  - name: api
    env:
      - name: APP_NAME
        valueFrom:
          configMapKeyRef:
            name: app-config
            key: APP_NAME

# ─── Method 2: All keys as env vars (envFrom) ─────────────────────
containers:
  - name: api
    envFrom:
      - configMapRef:
          name: app-config     # All keys → env vars

# ─── Method 3: Mount as files (volume) ────────────────────────────
containers:
  - name: api
    volumeMounts:
      - name: config-vol
        mountPath: /app/config   # Files appear here
        readOnly: true

volumes:
  - name: config-vol
    configMap:
      name: app-config           # All keys become files
      # OR select specific keys:
      items:
        - key: application.yml
          path: application.yml  # Mounted as /app/config/application.yml
```

---

## Secrets

Store **sensitive** configuration — passwords, tokens, TLS certificates. Base64-encoded (not encrypted by default — use etcd encryption at rest).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
  namespace: production
type: Opaque                        # Generic key-value
data:
  # Values MUST be base64 encoded
  username: bXlhcHA=               # echo -n "myapp" | base64
  password: c3VwZXJzZWNyZXQ=       # echo -n "supersecret" | base64

# OR use stringData — K8s base64-encodes for you (not stored as plain text)
stringData:
  password: "supersecret"          # Convenient but shows in YAML
```

```bash
# Create from literal (kubectl handles encoding)
kubectl create secret generic db-secret \
  --from-literal=username=myapp \
  --from-literal=password=supersecret

# Create from file
kubectl create secret generic tls-secret \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key

# TLS secret (special type)
kubectl create secret tls my-tls \
  --cert=server.crt \
  --key=server.key

# Docker registry secret (for private image pulls)
kubectl create secret docker-registry my-registry-secret \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=password \
  --docker-email=user@example.com

# View (base64 decoded)
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
```

### Secret Types
| Type | Use |
|---|---|
| `Opaque` | Generic key-value |
| `kubernetes.io/tls` | TLS certificate |
| `kubernetes.io/dockerconfigjson` | Image pull secret |
| `kubernetes.io/service-account-token` | Service account token |
| `kubernetes.io/basic-auth` | Username + password |

### Use Secret in Pod

```yaml
# ─── Method 1: Individual env var ─────────────────────────────────
containers:
  - name: api
    env:
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: db-secret
            key: password

# ─── Method 2: All keys as env vars ───────────────────────────────
containers:
  - name: api
    envFrom:
      - secretRef:
          name: db-secret

# ─── Method 3: Mount as files (preferred for security) ────────────
# Files in /run/secrets are not visible in env (less exposure)
containers:
  - name: api
    volumeMounts:
      - name: secret-vol
        mountPath: /run/secrets/db
        readOnly: true

volumes:
  - name: secret-vol
    secret:
      secretName: db-secret
      defaultMode: 0400           # Permissions: owner read-only
```

### Spring Boot reads secrets as files
```yaml
# Mount secret as file, Spring reads it
spring:
  datasource:
    password: ${DB_PASSWORD}    # From env var
# OR with file mounting:
spring:
  config:
    import: "optional:configtree:/run/secrets/"
# /run/secrets/spring.datasource.password → becomes spring.datasource.password
```

---

## Encrypting Secrets at Rest

By default, K8s stores Secrets in etcd **base64-encoded** (not encrypted). Enable encryption:

```yaml
# kube-apiserver configuration
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-32-byte-key>
      - identity: {}   # Fallback — read unencrypted
```

**Better:** Use an external secrets manager:
- **AWS Secrets Manager** with `External Secrets Operator`
- **HashiCorp Vault** with `vault-agent-injector`
- **Sealed Secrets** by Bitnami (encrypt the YAML itself)

---

## emptyDir Volume

Temporary storage shared between containers in the same Pod. Deleted when Pod is removed.

```yaml
volumes:
  - name: cache-vol
    emptyDir:
      medium: Memory           # Optional: store in RAM (tmpfs)
      sizeLimit: 256Mi

containers:
  - volumeMounts:
      - name: cache-vol
        mountPath: /tmp/cache
```

---

## hostPath Volume (Use with Caution)

Mounts a path from the Node's filesystem.

```yaml
volumes:
  - name: host-logs
    hostPath:
      path: /var/log/pods        # Node path
      type: Directory            # Must exist | DirectoryOrCreate | File | etc.
```

> ⚠ Security risk: container can access the Node's filesystem. Only use in DaemonSets for legitimate system access (log collection, monitoring).

---

## Interview Questions

1. What is the difference between a PersistentVolume and a PersistentVolumeClaim?
2. What is a StorageClass and what does "dynamic provisioning" mean?
3. What are the three PVC access modes? When would you need ReadWriteMany?
4. What is the difference between a ConfigMap and a Secret?
5. Are Kubernetes Secrets actually encrypted? How do you make them secure?
6. How do you inject a Secret as an environment variable into a Pod?
7. What is the advantage of mounting a Secret as a file vs an env var?
8. What is an `emptyDir` volume and when would you use it?
9. When should you use `hostPath` volumes, and why are they risky?
10. How do you use External Secrets Operator to sync from AWS Secrets Manager?
