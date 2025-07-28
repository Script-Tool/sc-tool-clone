#!/bin/bash
docker start $(docker ps -a -q --filter "status=exited")
containers=$(sudo docker ps | awk '{if(NR>1) print $NF}')
host=$(hostname)
for container in $containers
do
	echo "Container: $container"
	docker exec $container sh -c "crond"
	docker exec $container sh -c "sudo -u runuser -H sh -c 'cd /home/runuser/sc-tool && pm2 start main.js'"
	echo ================================
done