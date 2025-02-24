# Jitsi Meet Server Debug Log

## Server Information
- EC2 Instance IP: 44.218.104.132
- Domain: jitsi-meet.calemcnulty.com
- OS: Ubuntu (shown in SSH welcome message)

## Current Status
- Cannot reach server via ping or HTTP
- SSH access works fine
- DNS A record exists pointing jitsi-meet.calemcnulty.com to 44.218.104.132

## Server Configuration
### Nginx
- Running and properly configured
- Listening on port 80 (confirmed via `ss -tulpn`)
- Config files look correct
- Static files present in /var/www/jitsi-meet/

### Firewall Status
- AWS Security Group: Correctly configured
  - Port 80 (HTTP) open
  - Port 443 (HTTPS) open
  - Port 22 (SSH) open
  - Port 5432 (PostgreSQL) open
- iptables: No blocking rules (all policies set to ACCEPT)

### File Structure
- /var/www/jitsi-meet/ contains all necessary files
- JS files correctly placed in libs directory
- index.html and config files present

## Symptoms
1. SSH works (indicating basic network connectivity)
2. Ping fails (Request timeout)
3. HTTP access fails (ERR_CONNECTION_REFUSED)
4. All ports appear open in security group
5. No local firewall blocking
6. Nginx running and listening correctly

## Questions to Answer
1. Is the instance in a public subnet?
2. Is there a route table entry pointing to an Internet Gateway?
3. Are there any Network ACLs blocking traffic?
4. Is the instance's networking properly configured for public access? 