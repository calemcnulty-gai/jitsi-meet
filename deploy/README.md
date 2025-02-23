# Jitsi Meet EC2 Deployment Guide

This guide provides instructions for deploying Jitsi Meet on Amazon EC2.

## Prerequisites

1. An AWS account with EC2 access
2. A domain name pointed to your EC2 instance
3. Basic knowledge of AWS and Linux administration

## EC2 Instance Requirements

- **Instance Type:** t2.medium or better (2 vCPU, 4GB RAM minimum)
- **Operating System:** Ubuntu 22.04 LTS
- **Storage:** 20GB+ EBS volume
- **Security Group Settings:**
  - HTTP (80)
  - HTTPS (443)
  - Custom TCP (10000-20000) for WebRTC
- **Elastic IP** (recommended for static IP)

## Deployment Steps

1. **Launch EC2 Instance:**
   - Launch a Ubuntu 22.04 LTS instance
   - Attach an Elastic IP
   - Configure security groups as mentioned above

2. **DNS Setup:**
   - Point your domain to the EC2 instance's Elastic IP
   - Wait for DNS propagation (can take up to 48 hours)

3. **Deploy Application:**
   ```bash
   # Connect to your EC2 instance
   ssh -i your-key.pem ubuntu@your-instance-ip

   # Create deployment directory
   mkdir -p ~/deploy
   
   # Copy the setup script
   scp -i your-key.pem setup.sh ubuntu@your-instance-ip:~/deploy/
   
   # Make the script executable
   chmod +x ~/deploy/setup.sh
   
   # Run the setup script
   cd ~/deploy
   ./setup.sh
   ```

4. **Post-Deployment Configuration:**
   - Update the domain in Nginx config:
     ```bash
     sudo nano /etc/nginx/sites-available/jitsi-meet
     # Replace YOUR_DOMAIN with your actual domain
     ```
   - Setup SSL certificate:
     ```bash
     sudo certbot --nginx -d your-domain.com
     ```
   - Update Jitsi Meet configuration:
     ```bash
     sudo nano /opt/jitsi-meet/config.js
     # Update configuration as needed
     ```

5. **Verify Deployment:**
   - Visit https://your-domain.com
   - Test video conferencing functionality
   - Check WebRTC connectivity

## Maintenance

- **View Logs:**
  ```bash
  sudo journalctl -u jitsi-meet
  sudo tail -f /var/log/nginx/error.log
  ```

- **Restart Services:**
  ```bash
  sudo systemctl restart jitsi-meet
  sudo systemctl restart nginx
  ```

- **Update Application:**
  ```bash
  cd /opt/jitsi-meet
  git pull
  npm install
  make
  sudo systemctl restart jitsi-meet
  ```

## Troubleshooting

1. **SSL Issues:**
   - Verify SSL certificate: `sudo certbot certificates`
   - Renew certificate: `sudo certbot renew`

2. **Connection Issues:**
   - Check security group settings
   - Verify WebRTC ports are open
   - Check Nginx configuration

3. **Application Issues:**
   - Check application logs: `sudo journalctl -u jitsi-meet`
   - Verify Node.js version: `node --version`
   - Check npm dependencies: `npm list`

## Security Considerations

1. **Firewall:**
   - Only necessary ports should be open
   - Consider using AWS WAF for additional protection

2. **Updates:**
   - Regularly update the system: `sudo apt update && sudo apt upgrade`
   - Keep Node.js and npm packages updated

3. **SSL:**
   - Keep certificates up to date
   - Use strong SSL configuration in Nginx

## Support

For issues and support:
- Check the [Jitsi Meet documentation](https://jitsi.github.io/handbook/)
- Visit the [Jitsi Meet GitHub repository](https://github.com/jitsi/jitsi-meet)
- Join the [Jitsi community](https://community.jitsi.org/) 