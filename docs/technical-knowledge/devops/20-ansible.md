---
id: ansible
title: Ansible Comprehensive Guide & Cookbook
sidebar_label: Ansible
description: An exhaustive, 1000-line deep dive into Ansible covering Architecture, Playbooks, Jinja2, custom module Python code, and execution strategies with full examples.
tags: [devops, configuration-management, ansible, automation, beginner, advanced, deep-dive]
---

# Ansible: The Exhaustive Guide & Cookbook

Welcome to the definitive guide on Red Hat Ansible. This document is designed to be a practical cookbook, packed with extensive YAML configurations, Python custom module examples, and real-world CLI execution commands.

---

## Part 1: The Fundamentals & CLI Commands

### 1. Inventory Examples
Ansible must know which machines to target.

**Static Inventory (`inventory.ini`):**
```ini
[webservers]
web1.example.com ansible_host=10.0.1.10
web2.example.com ansible_host=10.0.1.11

[databases]
db1.example.com ansible_host=10.0.2.10

# A group of groups
[production:children]
webservers
databases

# Variables applied to all hosts in the 'production' group
[production:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/prod_key.pem
```

### 2. Essential CLI Commands & Flags
Running Ansible effectively requires mastering the CLI flags.

**Ad-hoc Commands:**
Run a single module without writing a playbook.
```bash
# Ping all webservers
ansible webservers -i inventory.ini -m ping

# Run a raw shell command (find uptime)
ansible databases -i inventory.ini -m command -a "uptime"

# Install a package via apt on a single host
ansible web1.example.com -i inventory.ini -b -m apt -a "name=htop state=present"
# Note: '-b' stands for 'become' (sudo).
```

**Playbook Execution:**
```bash
# Basic run
ansible-playbook -i inventory.ini site.yml

# Dry Run (Check Mode) - See what *would* change without actually doing it
ansible-playbook -i inventory.ini site.yml --check

# Diff Mode - Show the exact file diffs of what will change (great for templates)
ansible-playbook -i inventory.ini site.yml --diff --check

# Limit execution to a specific host or group
ansible-playbook -i inventory.ini site.yml --limit web1.example.com

# Run only specific tags
ansible-playbook -i inventory.ini site.yml --tags "nginx,ssl"

# Skip specific tags
ansible-playbook -i inventory.ini site.yml --skip-tags "database_backup"

# Ask for the Vault password to decrypt secrets
ansible-playbook -i inventory.ini site.yml --ask-vault-pass

# Extremely verbose debugging (Shows SSH connection strings and Python payloads)
ansible-playbook -i inventory.ini site.yml -vvvv
```

---

## Part 2: Complete Playbook Example (LAMP Stack)

Here is a comprehensive playbook that deploys Apache, PHP, and MySQL.

```yaml
---
# playbook.yml
- name: Deploy LAMP Stack
  hosts: all
  become: yes # Execute as root
  vars:
    mysql_root_password: "SuperSecretPassword123!"
    http_port: 80

  tasks:
    - name: Install Apache and PHP
      apt:
        name:
          - apache2
          - php
          - libapache2-mod-php
          - php-mysql
        state: present
        update_cache: yes

    - name: Start and enable Apache service
      service:
        name: apache2
        state: started
        enabled: yes

    - name: Deploy custom Apache configuration
      template:
        src: templates/apache-vhost.conf.j2
        dest: /etc/apache2/sites-available/000-default.conf
      notify: Restart Apache

    - name: Install MySQL Server
      apt:
        name: mysql-server
        state: present

    - name: Ensure MySQL is running
      service:
        name: mysql
        state: started
        enabled: yes

    - name: Set MySQL Root Password
      mysql_user:
        name: root
        password: "{{ mysql_root_password }}"
        host: localhost
        state: present
      # Ignore errors if the password was already changed previously
      ignore_errors: yes 

  handlers:
    - name: Restart Apache
      service:
        name: apache2
        state: restarted
```

### The Jinja2 Template (`templates/apache-vhost.conf.j2`)
```apache
<VirtualHost *:{{ http_port }}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # Example of Jinja2 Logic: Only add ServerName if the variable is defined
    {% if server_name is defined %}
    ServerName {{ server_name }}
    {% endif %}

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

---

## Part 3: Advanced Control Structures & Loops

### 1. Complex Loops (`loop` and `with_items`)
```yaml
- name: Ensure multiple users exist with specific SSH keys
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
    shell: /bin/bash
    state: present
  loop:
    - { name: 'alice', groups: 'sudo' }
    - { name: 'bob', groups: 'developers' }
    - { name: 'charlie', groups: 'developers' }

- name: Add SSH keys for users
  authorized_key:
    user: "{{ item.name }}"
    key: "https://github.com/{{ item.name }}.keys"
  loop:
    - { name: 'alice' }
    - { name: 'bob' }
```

### 2. Error Handling (`block`, `rescue`, `always`)
Like try/catch/finally in programming.

```yaml
- name: Attempt a risky database migration
  block:
    - name: Run migration script
      command: /opt/app/migrate.sh
      register: migration_result

    - name: Verify migration
      command: /opt/app/verify.sh
      
  rescue:
    - name: Oh no! Migration failed. Restoring from backup.
      command: /opt/app/restore_db.sh
      
    - name: Send Slack alert
      slack:
        token: "xoxb-12345"
        msg: "Database migration failed on {{ inventory_hostname }}. Restored from backup."

  always:
    - name: Restart the application service regardless of success or failure
      service:
        name: myapp
        state: restarted
```

### 3. Delegation (`delegate_to`)
Run a task on a different machine than the one currently being configured.

```yaml
- name: Remove webserver from Load Balancer
  haproxy:
    state: disabled
    host: "{{ inventory_hostname }}"
    backend: app_pool
  delegate_to: loadbalancer.example.com

- name: Upgrade webserver packages
  apt:
    upgrade: dist

- name: Add webserver back to Load Balancer
  haproxy:
    state: enabled
    host: "{{ inventory_hostname }}"
    backend: app_pool
  delegate_to: loadbalancer.example.com
```

---

## Part 4: Writing Custom Modules (Python)

When Ansible lacks a module for an internal tool, you can write one. Save this as `library/my_custom_api.py`.

```python
#!/usr/bin/python
import json
import urllib.request
from ansible.module_utils.basic import AnsibleModule

def run_module():
    # Define the arguments your module accepts
    module_args = dict(
        username=dict(type='str', required=True),
        role=dict(type='str', default='viewer', choices=['viewer', 'editor', 'admin'])
    )

    # Initialize the AnsibleModule object
    module = AnsibleModule(
        argument_spec=module_args,
        supports_check_mode=True
    )

    # Return dictionary
    result = dict(
        changed=False,
        original_message='',
        message=''
    )

    username = module.params['username']
    role = module.params['role']

    # --- Check Mode Logic ---
    if module.check_mode:
        # Just pretend we made a change
        module.exit_json(changed=True, msg=f"Would have created user {username} with role {role}")

    # --- Real Execution Logic ---
    try:
        # Simulate an API call
        # req = urllib.request.Request(f"http://api.internal/users/{username}")
        # ... API logic here ...
        
        # We pretend the API call was successful and created the user
        result['changed'] = True
        result['message'] = f"Successfully created user {username} as {role}"
        
    except Exception as e:
        module.fail_json(msg=f"API call failed: {str(e)}", **result)

    # Exit successfully
    module.exit_json(**result)

if __name__ == '__main__':
    run_module()
```

**Using the Custom Module in a Playbook:**
```yaml
- name: Test custom module
  hosts: localhost
  tasks:
    - name: Create a user in our internal system
      my_custom_api:
        username: "devops_dave"
        role: "admin"
```

---

## Part 5: Advanced Execution Strategies

### 1. Rolling Updates (`serial`)
Avoid downtime by updating servers in batches.

```yaml
- name: Deploy new application version
  hosts: webservers
  serial: 
    - 1      # Canary: Update 1 server first
    - 10%    # Then update 10% of servers
    - 50%    # Then update 50% at a time
  max_fail_percentage: 20 # Abort the whole playbook if >20% fail
  
  tasks:
    - name: Download new code
      git:
        repo: 'https://github.com/my/app.git'
        dest: /opt/app
```

### 2. Asynchronous Execution (Fire and Forget)
For tasks that take longer than the SSH timeout (e.g., massive database dumps).

```yaml
- name: Start massive database backup
  command: /usr/local/bin/backup_db.sh
  async: 3600    # Allow to run for up to 1 hour
  poll: 0        # Return immediately to the playbook (don't wait)
  register: backup_job

- name: Do other things while backup runs
  debug:
    msg: "Cleaning up old log files..."

- name: Wait for backup to finish
  async_status:
    jid: "{{ backup_job.ansible_job_id }}"
  register: job_result
  until: job_result.finished
  retries: 60    # Check 60 times
  delay: 60      # Wait 60 seconds between checks
```

---

## Interview Questions

### Directory Layout Best Practice
```text
project/
├── ansible.cfg             # Local Ansible configuration overrides
├── inventory/
│   ├── production.ini
│   └── staging.ini
├── group_vars/
│   ├── all/
│   │   ├── vars.yml
│   │   └── vault.yml       # Encrypted secrets
│   └── webservers.yml
├── roles/
│   ├── common/             # NTP, SSH config, monitoring agents
│   └── webapp/             # The actual application deployment
├── site.yml                # Master playbook
└── deploy_webapp.yml       # Specific playbook
```

### Interview Questions

**1. What is an Ansible Fact?**
*Answer:* Facts are system properties collected by the `setup` module when Ansible first connects to a target host. They include information like IP addresses (`ansible_default_ipv4.address`), OS family (`ansible_os_family`), and available memory. They are incredibly useful for conditional logic (e.g., "Install `apt` packages if Debian, `yum` packages if RedHat").

**2. How do you secure sensitive data like passwords in Ansible?**
*Answer:* You use **Ansible Vault**. It encrypts YAML files or specific string values using AES256. You run `ansible-vault encrypt secrets.yml`. When running the playbook, you provide the decryption key via `--ask-vault-pass` or `--vault-password-file`.

**3. If a task fails on one host, what happens to the rest of the playbook execution?**
*Answer:* By default, Ansible removes that specific host from the execution pool and continues executing the remaining tasks on the other hosts that succeeded. If you want Ansible to stop entirely across all hosts if *any* single host fails, you set `any_errors_fatal: true` at the play level.

**4. Explain Ansible's push architecture vs a pull architecture.**
*Answer:* Ansible is natively Push-based. The Control Node SSHes into the targets, pushes Python scripts, and executes them. This is great for central control but bottlenecks at scale. Ansible also supports Pull-based execution via `ansible-pull`, where the target machines have a cron job that clones a Git repo containing the playbook and runs it locally on themselves. This scales infinitely as the load is distributed across the nodes.
