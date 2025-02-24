#!/bin/zsh

# Build the project
npm run build

# Deploy to EC2
echo "Deploying to server..."
scp -i /Users/calemcnulty/Workspaces/perms/cale-ssh.pem -r dist/* ubuntu@44.218.104.132:~/jitsi-meet/dist/

# SSH into the server and set permissions
echo "Setting permissions..."
ssh -i /Users/calemcnulty/Workspaces/perms/cale-ssh.pem ubuntu@44.218.104.132 "sudo cp -r ~/jitsi-meet/dist/* /var/www/jitsi-meet/ && sudo chown -R www-data:www-data /var/www/jitsi-meet"

echo "Deployment complete!" 