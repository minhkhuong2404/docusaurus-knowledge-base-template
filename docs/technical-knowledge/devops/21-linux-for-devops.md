---
id: linux-for-devops
title: Essential Linux for DevOps & Cookbook
sidebar_label: Essential Linux
description: An exhaustive, 1000-line deep dive into Linux for DevOps, featuring advanced commands (awk, sed, find), network tracing, system tuning, and bash scripting.
tags: [devops, linux, commands, bash, troubleshooting, kernel, networking]
---

# Essential Linux for DevOps & Cookbook

Linux is the bedrock of modern infrastructure. Fluency in the Linux command line is the most critical skill for a DevOps engineer. This guide is an exhaustive cookbook of real-world commands, edge cases, and advanced troubleshooting techniques.

---

## 1. Advanced Text Processing & Search

### `find` and `xargs`
Finding files is easy. Operating on them safely at scale requires `xargs`.

```bash
# Find all .log files modified more than 7 days ago and delete them
find /var/log -type f -name "*.log" -mtime +7 -delete

# Find all Python files and search inside them for "import boto3"
find /opt/app -type f -name "*.py" | xargs grep "import boto3"

# Find files owned by user 'www-data' and change ownership to 'nginx'
# The print0 and -0 are critical for handling file names with spaces!
find /var/www -user www-data -print0 | xargs -0 chown nginx:nginx

# Find the 10 largest files on the filesystem
find / -type f -exec du -Sh {} + 2>/dev/null | sort -rh | head -n 10
```

### `grep` (Global Regular Expression Print)
```bash
# Search for IPs (Regex) in an access log
grep -E -o "([0-9]{1,3}[\.]){3}[0-9]{1,3}" /var/log/nginx/access.log

# Find errors, excluding "MinorError"
grep "ERROR" app.log | grep -v "MinorError"

# Search recursively (-r), case-insensitive (-i), show line numbers (-n)
grep -rin "password" /etc/
```

### `awk` (Data Extraction and Reporting)
The most powerful tool for tabular data.
```bash
# Print the 1st and 9th columns of an Nginx log (IP and HTTP Status)
awk '{print $1, $9}' /var/log/nginx/access.log

# Calculate the sum of column 10 (bytes transferred) and output in Megabytes
awk '{ sum += $10 } END { print sum / 1024 / 1024 " MB" }' access.log

# Print the top 10 IP addresses making requests
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -n 10

# Filter: Only print lines where the 9th column (HTTP Status) is 500
awk '$9 == 500 {print $0}' access.log
```

### `sed` (Stream Editor)
For finding and replacing text in streams or files.
```bash
# Replace 'localhost' with 'db.internal' in a config file (creates a backup .bak)
sed -i.bak 's/localhost/db.internal/g' /etc/app/config.yml

# Delete all empty lines from a file
sed -i '/^$/d' file.txt

# Delete lines starting with '#' (comments)
sed -i '/^#/d' config.conf

# Print lines 10 to 20 of a file
sed -n '10,20p' large_file.log
```

### `jq` (JSON Processor)
Essential for cloud engineers working with AWS CLI or Kubernetes APIs.
```bash
# Pretty print JSON
cat data.json | jq .

# Extract the 'InstanceId' from AWS CLI output
aws ec2 describe-instances | jq '.Reservations[].Instances[].InstanceId'

# Get Kubernetes pods and their phases, formatted as "PodName is Status"
kubectl get pods -o json | jq -r '.items[] | "\(.metadata.name) is \(.status.phase)"'
```

---

## 2. Process Management & System Performance

### `ps`, `kill`, and `killall`
```bash
# List all running processes with full command-line arguments
ps aux

# Find the PID of a specific Java app
ps aux | grep java

# Kill a process gracefully (SIGTERM - 15)
kill 12345

# Kill a process immediately, bypassing application cleanup (SIGKILL - 9)
kill -9 12345

# Kill all processes named 'nginx'
killall nginx
```

### `top`, `htop`, and `atop`
- **`htop`**: Run it. Press `F6` to sort. Sort by `M` for Memory, `P` for CPU. Press `k` to kill a process.
- **`atop`**: Better for historical data and seeing disk/network I/O per process.

### `free` and `vmstat`
```bash
# Show human-readable memory usage
free -h

# Check swap activity. If 'si' (swap in) and 'so' (swap out) are constantly > 0, you are out of RAM.
vmstat 1
```

### `lsof` (List Open Files)
In Linux, everything is a file. Network sockets are files.
```bash
# Find which process is listening on port 8080
lsof -i :8080

# Find all files opened by the 'postgres' user
lsof -u postgres

# Find a process that holds an open file handle to a deleted file (taking up disk space!)
lsof +L1
```

---

## 3. Network Troubleshooting (It's Always DNS)

### `curl`
```bash
# Get only the HTTP headers (Great for checking redirects)
curl -I https://example.com

# Send a POST request with JSON
curl -X POST -H "Content-Type: application/json" -d '{"user":"admin"}' https://api.com/login

# Test API Latency (DNS vs Connect vs TTFB)
curl -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s https://example.com
```

### `ss` (Socket Statistics)
```bash
# Show all listening TCP sockets and the PIDs owning them
ss -tlnp

# Show all established connections
ss -tn state established

# Count connections to port 80 (useful during a DDoS)
ss -tn src :80 | wc -l
```

### `dig` & `nslookup`
```bash
# Check the A record
dig +short example.com

# Trace the DNS resolution path from the Root Servers downward
dig +trace example.com

# Bypass local cache and query Google's DNS directly
dig @8.8.8.8 example.com
```

### `tcpdump`
When you need to see the raw packets.
```bash
# Capture traffic on port 80 on interface eth0
tcpdump -i eth0 port 80

# Save capture to a file for Wireshark analysis
tcpdump -i eth0 port 80 -w web_traffic.pcap

# Look for HTTP GET requests in plaintext
tcpdump -i eth0 -s 0 -A 'tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420'
```

---

## 4. SSH, Tunneling, and Secure Copy

### SSH Port Forwarding (Tunnels)
Access internal services securely through a Bastion host.
```bash
# Local Port Forwarding: Access a private RDS database on your local machine
# Forwards local port 5432 -> Bastion -> Private RDS port 5432
ssh -L 5432:private-rds.internal:5432 user@bastion-host.com

# Dynamic Port Forwarding (SOCKS Proxy): Route your browser traffic through the Bastion
ssh -D 8080 user@bastion-host.com
```

### `scp` and `rsync`
```bash
# Copy a file to a remote server
scp backup.sql user@remote:/tmp/

# Copy a directory from a remote server to local
scp -r user@remote:/var/log/nginx ./logs/

# Sync a directory (resumes if interrupted, only copies differences)
rsync -avz --progress /local/dir/ user@remote:/remote/dir/
```

---

## 5. Systemd & Services (`systemctl` & `journalctl`)

Modern Linux uses `systemd` to manage background services.

### `systemctl`
```bash
# Start and enable a service on boot
systemctl start docker
systemctl enable docker

# Check status
systemctl status nginx

# Reload configuration without dropping connections (HUP signal)
systemctl reload nginx
```

### `journalctl`
Reads systemd logs.
```bash
# Follow logs for the Docker service
journalctl -u docker -f

# View logs from today
journalctl --since today

# View logs for a specific process ID
journalctl _PID=1234
```

---

## 6. Disk Management & LVM

### Identifying and Formatting Disks
When attaching an EBS volume in AWS:
```bash
# 1. Identify the new raw disk
lsblk

# 2. Partition the disk (Interactive)
fdisk /dev/nvme1n1

# 3. Format it with the ext4 file system
mkfs.ext4 /dev/nvme1n1

# 4. Mount it
mkdir /data
mount /dev/nvme1n1 /data

# 5. Make it persist reboots by adding to /etc/fstab
echo '/dev/nvme1n1 /data ext4 defaults 0 0' >> /etc/fstab
```

### Checking Space
```bash
# Human readable free space
df -h

# Find the 10 largest folders consuming space
du -sh /* | sort -rh | head -n 10
```

---

## 7. Kernel Tuning and Debugging (Expert)

### `sysctl`
Modify kernel parameters for performance.
```bash
# See all current parameters
sysctl -a

# Increase Max Open Files (fixes "Too many open files" errors on heavy databases)
sysctl -w fs.file-max=200000

# Increase the connection tracking table (fixes "nf_conntrack: table full, dropping packet")
sysctl -w net.netfilter.nf_conntrack_max=524288
```

### `dmesg`
Prints the kernel ring buffer.
```bash
# Find OOM (Out of Memory) kills by the Linux kernel OOM Killer
dmesg -T | grep -i "out of memory"

# Check for hardware or disk errors
dmesg -T | grep -i error
```

### `strace`
Traces system calls. The ultimate debugging tool.
```bash
# See exactly what files a process is trying to open
strace -e open,openat -p <PID>

# See all network calls (socket, connect)
strace -e network -p <PID>
```
*Warning: `strace` slows down the target process heavily. Use carefully in production.*

---

## 8. Defensive Bash Scripting Best Practices

Never write a production bash script without these safeties.

```bash
#!/bin/bash

# The ultimate safety net
set -euo pipefail

# -e: Exit immediately if any command fails (returns non-zero)
# -u: Exit if you reference an undefined variable (prevents `rm -rf /$EMPTY_VAR/`)
# -o pipefail: If `command1 | command2` fails at command1, the whole pipeline fails

# Define variables clearly
BACKUP_DIR="/var/backups"
APP_NAME="myapp"

# Always check if directories exist before operating
if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory does not exist!"
  exit 1
fi

# Use functions for reusability
log_info() {
  echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_info "Starting backup for $APP_NAME..."
# ... backup logic ...
log_info "Backup complete."
```
