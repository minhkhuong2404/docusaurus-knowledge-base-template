---
id: helm
title: Helm — Package Manager for Kubernetes
sidebar_label: Helm
description: Complete Helm guide — charts, templates, values, release management, chart repositories, creating your own charts, Helmfile, and best practices for managing Kubernetes applications with Helm.
tags: [helm, kubernetes, charts, templates, values, package-manager, advanced]
---

# Helm — Package Manager for Kubernetes

> Helm is the Kubernetes equivalent of `apt`, `brew`, or `maven` — it packages, versions, and deploys Kubernetes applications.

---

## Why Helm?

Without Helm, deploying an application means maintaining dozens of individual YAML files.  
With Helm, it's a versioned, parameterised **chart** with a single command to install.

```bash
# Without Helm: apply 8+ files, manage env differences manually
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/hpa.yaml

# With Helm: one command
helm install my-api ./my-api-chart -f values.production.yaml
```

---

## Core Concepts

| Term | Definition |
|---|---|
| **Chart** | Package of K8s YAML templates + default values |
| **Release** | Installed instance of a chart |
| **Values** | Configuration that parameterises the chart |
| **Repository** | Remote store of charts (like Maven Central) |
| **Template** | YAML file with Go template variables |
| **Revision** | Numbered history of a release's changes |

---

## Helm Chart Structure

```
my-api/                       ← Chart directory (name = chart name)
├── Chart.yaml                ← Chart metadata
├── values.yaml               ← Default configuration values
├── values.production.yaml    ← Production overrides (not standard, by convention)
├── charts/                   ← Sub-charts (dependencies)
├── templates/                ← K8s YAML templates
│   ├── _helpers.tpl          ← Reusable template helpers (partial templates)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── hpa.yaml
│   ├── serviceaccount.yaml
│   └── NOTES.txt             ← Displayed after install
└── .helmignore               ← Files to exclude from packaging
```

---

## Chart.yaml

```yaml
apiVersion: v2                       # v2 for Helm 3
name: my-api
description: Spring Boot REST API service
type: application                    # application | library
version: 1.2.0                       # Chart version (semver)
appVersion: "2.5.0"                  # App version (informational)
keywords:
  - api
  - spring-boot
home: https://github.com/myorg/my-api
maintainers:
  - name: Backend Team
    email: backend@example.com

# Chart dependencies (sub-charts)
dependencies:
  - name: postgresql
    version: "13.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled    # Only include if postgresql.enabled=true

  - name: redis
    version: "18.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

---

## values.yaml (Default Values)

```yaml
# values.yaml — these are the defaults
replicaCount: 2

image:
  repository: myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: false
  className: nginx
  host: api.example.com
  tls: false
  tlsSecretName: ""

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 512Mi

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

config:
  springProfile: default
  logLevel: INFO
  dbHost: localhost
  dbPort: 5432
  dbName: mydb

postgresql:
  enabled: true                 # Install sub-chart
  auth:
    database: mydb
    username: myapp
    password: ""

redis:
  enabled: false

nodeSelector: {}
tolerations: []
affinity: {}
```

---

## Templates

Go template syntax renders values into YAML.

### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-api.fullname" . }}     # From _helpers.tpl
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "my-api.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-api.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-api.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        # ↑ Forces Pod restart when ConfigMap changes
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: {{ .Values.config.springProfile | quote }}
            - name: DB_HOST
              value: {{ .Values.config.dbHost | quote }}
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "my-api.fullname" . }}-secret
                  key: db-password
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### _helpers.tpl (Reusable Partials)
```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "my-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "my-api.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "my-api.labels" -}}
helm.sh/chart: {{ include "my-api.chart" . }}
{{ include "my-api.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "my-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

---

## Helm CLI Commands

```bash
# ─── Repository Management ────────────────────────────────────────
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable
helm repo update                       # Fetch latest chart versions
helm repo list
helm repo remove bitnami

# ─── Search ───────────────────────────────────────────────────────
helm search repo postgres              # Search added repos
helm search hub nginx                  # Search Artifact Hub (all public charts)
helm search repo bitnami/postgresql --versions  # List all versions

# ─── Install ──────────────────────────────────────────────────────
helm install my-api ./my-api           # From local chart
helm install my-api bitnami/postgresql # From repo
helm install my-api ./my-api \
  -f values.production.yaml            # Custom values file
helm install my-api ./my-api \
  --set image.tag=1.3.0 \             # Inline value override
  --set replicaCount=3

helm install my-api ./my-api \
  --namespace production \
  --create-namespace \                 # Create namespace if needed
  --wait                               # Wait for pods to be ready

# Dry run (render templates without installing)
helm install my-api ./my-api --dry-run --debug

# ─── Upgrade ──────────────────────────────────────────────────────
helm upgrade my-api ./my-api
helm upgrade my-api ./my-api -f values.production.yaml
helm upgrade my-api ./my-api --set image.tag=1.4.0
helm upgrade my-api ./my-api --reuse-values  # Keep existing values, only change specified

# Install if not exists, upgrade if exists
helm upgrade --install my-api ./my-api \
  -f values.production.yaml \
  --namespace production \
  --create-namespace

# ─── Rollback ─────────────────────────────────────────────────────
helm rollback my-api                   # Roll back to previous release
helm rollback my-api 2                 # Roll back to revision 2

# ─── Status / History ─────────────────────────────────────────────
helm list                              # All releases in current namespace
helm list -n production
helm list -A                           # All namespaces
helm status my-api                     # Release status
helm history my-api                    # Release revision history

# ─── Uninstall ────────────────────────────────────────────────────
helm uninstall my-api
helm uninstall my-api -n production
helm uninstall my-api --keep-history   # Uninstall but keep history

# ─── Template Debugging ───────────────────────────────────────────
helm template my-api ./my-api          # Render templates to stdout
helm template my-api ./my-api -f values.production.yaml
helm template my-api ./my-api --debug  # Verbose render with parsed values
helm lint ./my-api                     # Lint chart for errors

# ─── Inspect Chart ────────────────────────────────────────────────
helm show chart bitnami/postgresql     # Chart.yaml
helm show values bitnami/postgresql    # Default values.yaml
helm show all bitnami/postgresql       # Everything

# ─── Package and Push ─────────────────────────────────────────────
helm package ./my-api                  # Creates my-api-1.2.0.tgz
helm push my-api-1.2.0.tgz oci://registry.example.com/charts
```

---

## Values Override Patterns

```bash
# Multiple values files (merged in order, later files win)
helm upgrade --install my-api ./my-api \
  -f values.yaml \                     # Base defaults
  -f values.production.yaml \          # Production overrides
  -f values.secrets.yaml               # Secret values (not committed to git)

# Inline override (highest precedence)
helm upgrade my-api ./my-api \
  --set image.tag=$CI_COMMIT_SHA \
  --set replicaCount=5
```

---

## Dependencies (Sub-Charts)

```bash
# After adding dependencies to Chart.yaml:
helm dependency update ./my-api        # Downloads sub-charts to charts/

# Lock dependencies to exact versions
helm dependency build ./my-api         # Generates Chart.lock

# Install with embedded dependencies
helm install my-api ./my-api           # Deploys app + postgres + redis
```

---

## Creating a Chart from Scratch

```bash
# Scaffold a new chart
helm create my-api
# Creates standard directory structure with example templates

# Edit Chart.yaml, values.yaml, templates/
# Delete templates you don't need

# Test rendering
helm template my-api ./my-api

# Lint
helm lint ./my-api

# Install
helm install my-api ./my-api --dry-run
helm install my-api ./my-api
```

---

## Interview Questions

1. What is Helm and what problem does it solve?
2. What is the difference between a Helm chart and a Helm release?
3. What is `values.yaml` used for?
4. How do you override chart values at install time?
5. How do you roll back a Helm release?
6. What does `helm upgrade --install` do?
7. What is `helm template` used for?
8. What is a chart dependency?
9. How does Helm manage release history?
10. What is `helm lint` and why should you run it in CI?
