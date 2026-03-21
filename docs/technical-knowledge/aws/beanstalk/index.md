---
id: index
title: AWS Elastic Beanstalk
sidebar_label: "🌱 Elastic Beanstalk"
description: >
  Elastic Beanstalk for DVA-C02. Deployment policies (All at once, Rolling,
  Rolling with additional batch, Immutable, Blue/Green), .ebextensions, .platform,
  environment tiers, database decoupling, and Java Spring Boot deployment.
tags:
  - elastic-beanstalk
  - beanstalk
  - deployment
  - java
  - spring-boot
  - rolling
  - blue-green
  - rds
  - dva-c02
  - domain-3
---

# AWS Elastic Beanstalk

> **Core concept**: Elastic Beanstalk is a **Platform as a Service (PaaS)**. You upload your application code (e.g., a Java JAR/WAR), and Beanstalk automatically handles the deployment, from capacity provisioning and load balancing to auto-scaling and application health monitoring.

---

## Architecture & Environment Tiers

When creating a Beanstalk environment, you must choose a tier. You **cannot** change the tier after creation.

| Tier                | Architecture                                        | Primary Use Case                                                                            |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Web Server Tier** | Route 53 → Load Balancer → Auto Scaling Group (EC2) | Handling standard HTTP/HTTPS web requests and REST APIs.                                    |
| **Worker Tier**     | SQS Queue → Auto Scaling Group (EC2) running `sqsd` | Processing background jobs, long-running tasks, or offloading heavy work from the Web Tier. |

:::tip Exam: The Worker Tier Daemon (`sqsd`)
In a Worker Tier, Beanstalk installs a daemon called `sqsd` on each EC2 instance. This daemon constantly pulls messages from an SQS queue and sends them as HTTP POST requests to your application running on `localhost`. Your app just needs to expose a local HTTP endpoint to process the work!
:::

### Periodic Tasks (`cron.yaml`)
To schedule recurring background tasks in a **Worker Tier**, you place a `cron.yaml` file in the root of your source bundle. Beanstalk will automatically configure a CloudWatch Events rule to push messages to the SQS queue on that schedule.

---

## Configuration Files: `.ebextensions` vs `.platform` vs `Procfile`

Modern Beanstalk environments (Amazon Linux 2 and Amazon Linux 2023) use a specific hierarchy for configuration files.

### 1. `.ebextensions/` (Infrastructure & Pre-deploy)
Used to configure the environment and provision AWS resources using CloudFormation syntax.
- Must be at the root of your source bundle.
- Files must end in `.config` (e.g., `01_setup.config`).
- **Use cases**: Adding an ElastiCache cluster, modifying the Load Balancer, setting environment variables, or running commands *before* the application is extracted.

### 2. `.platform/` (Reverse Proxy & Post-deploy Hooks)
Used specifically for Amazon Linux 2/2023 to configure the reverse proxy and run hooks.
- **Use cases**: Configuring Nginx (`.platform/nginx/conf.d/`), or running scripts *after* the application is deployed but before traffic is routed to it (`.platform/hooks/postdeploy/`).

### 3. `Procfile` (Application Execution)
Tells Beanstalk exactly how to run your application.
- Placed at the root of the source bundle.
- **Java Spring Boot Example**:
  ```text
  web: java -jar application.jar --server.port=5000
  ```

---

## Database Decoupling (Highly Testable!)

By default, you can configure Beanstalk to launch an RDS instance *inside* its CloudFormation stack. 

:::warning Danger for Production
If you delete the Beanstalk environment, **the RDS database is deleted with it**. This is fine for Dev/Test, but disastrous for Production.
:::

**How to decouple an existing RDS database from Beanstalk (Exam Scenario):**
1. Take a manual snapshot of the RDS database.
2. Enable deletion protection on the RDS instance.
3. Create a new RDS database outside of Beanstalk (or restore from the snapshot).
4. Update the Beanstalk environment variables (`DB_URL`, etc.) to point to the new external RDS instance.
5. (Optional) Safely terminate the old Beanstalk environment/internal RDS.

---

## Deployment Policies

| Policy                            | How it works                                                                                                                       | Downtime | Rollback Speed               | Best For                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| **All at Once**                   | Deploys new version to all instances simultaneously.                                                                               | ✅ Yes    | Slow (Redeploy)              | Dev/Test. Fastest deployment time.                                                     |
| **Rolling**                       | Deploys in batches. Detaches batch from ELB, updates, reattaches.                                                                  | ❌ No     | Slow (Redeploy)              | Environments that can handle reduced capacity during deployment.                       |
| **Rolling with Additional Batch** | Provisions a *new* batch of instances, deploys to them, then updates older batches.                                                | ❌ No     | Slow (Redeploy)              | Production environments that must maintain **100% capacity** at all times.             |
| **Immutable**                     | Spins up a temporary Auto Scaling Group with the new version. If healthy, moves instances to the main ASG and terminates old ones. | ❌ No     | **Fast** (Terminate new ASG) | Production environments requiring the safest deployment and fastest in-place rollback. |
| **Traffic Splitting**             | Canary testing. Sends a percentage of traffic (e.g., 10%) to a new batch of instances for a specified time before full rollout.    | ❌ No     | Fast                         | Testing new features on a subset of users.                                             |

### Blue/Green Deployments (Swap URLs)
Blue/Green is **not** a direct Beanstalk deployment policy. Instead, it is an operational strategy:
1. Clone the current environment (Blue) to create a new environment (Green).
2. Deploy the new app version to the Green environment.
3. Use the Beanstalk Console or CLI to **Swap Environment URLs** (CNAME swap).
4. Traffic instantly routes to Green. If it fails, swap the URLs back for an **instant rollback**.

---

## Troubleshooting & Logging

If your Beanstalk deployment fails (e.g., Health transitions to "Red"), you need to investigate:
- **Request Logs**: You can request the last 100 lines of logs or full logs directly from the Beanstalk console/CLI. They are compiled into a ZIP file and stored in S3.
- **CloudWatch Logs**: You can configure Beanstalk to stream application logs and web server logs (Nginx/Apache) directly to CloudWatch Logs for real-time monitoring.
- **Key Log Locations (EC2)**:
  - `/var/log/eb-engine.log` (Deployment lifecycle logs)
  - `/var/log/nginx/access.log` (Web server logs)
  - `/var/log/web.stdout.log` (Your Java application console output)

---

## 🧪 Practice Questions

**Q1.** You are managing a Java Spring Boot application deployed via Elastic Beanstalk. The application processes video files, which takes several minutes per file. Currently, the Web Tier handles this, but users are experiencing HTTP timeout errors. How should you re-architect this?

A) Increase the idle timeout on the Elastic Load Balancer to 15 minutes.  
B) Change the deployment policy to Immutable to ensure fresh instances.  
C) Create a Beanstalk Worker Tier environment, place messages in an SQS queue, and let the `sqsd` daemon push tasks to the new Worker instances.  
D) Place a `cron.yaml` file in the Web Tier to schedule the video processing off-hours.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Long-running background tasks should be offloaded to a **Worker Tier**. The web tier can drop a message in SQS and immediately return a `200 OK` to the user. The Worker Tier's `sqsd` daemon will pull the message and hand it to the application for processing. ELB timeouts have a hard limit, and long-running HTTP requests are an anti-pattern.
</details>

---

**Q2.** A development team originally created a Beanstalk environment with an attached RDS database. They are moving to production and realize that if the Beanstalk environment is accidentally deleted, the database will be destroyed. What is the safest way to decouple the database?

A) Modify the `.ebextensions` file to set `RDS_DELETION_POLICY=Retain`.  
B) Use the AWS CLI to execute `eb detach-rds`.  
C) Create a manual snapshot of the RDS instance, launch a new RDS instance outside Beanstalk from the snapshot, update the Beanstalk environment variables to point to the new database, and then safely terminate the old Beanstalk environment.  
D) Migrate the Beanstalk environment from a Web Tier to a Worker Tier.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — This is the standard AWS-recommended procedure for decoupling an RDS database that was created inside a Beanstalk CloudFormation stack. There is no `eb detach-rds` command.
</details>

---

**Q3.** You need to configure the Nginx reverse proxy settings for an Elastic Beanstalk application running on Amazon Linux 2023. Where should you place the configuration files in your deployment ZIP?

A) `.ebextensions/nginx/nginx.conf`  
B) `.platform/nginx/conf.d/`  
C) `nginx.yaml` in the root directory.  
D) `Procfile`  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — In modern Amazon Linux 2/2023 Beanstalk environments, reverse proxy configurations (like Nginx) and post-deploy hooks belong in the **`.platform/`** directory, not `.ebextensions`.
</details>

---

## 🔗 Resources

- [Elastic Beanstalk Worker Environments](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features-managing-env-tiers.html)
- [Decoupling Amazon RDS from Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/AWSHowTo.RDS.html)
- [Extending Elastic Beanstalk Linux platforms (.platform)](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-linux-extend.html)
- [Blue/Green deployments with Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.CNAMESwap.html)
- [Elastic Beanstalk Deployment Policies](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.deploy-existing-version.html)
- [Elastic Beanstalk Logs and Troubleshooting](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.logging.html)
- [Deploying Java Spring Boot to Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/java-spring-tutorial.html)