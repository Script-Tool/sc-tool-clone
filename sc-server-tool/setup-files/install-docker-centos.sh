#!/bin/bash
vps=_TOTAL_VPS_

# echo -e "1\n1" | passwd
sed -re 's/^(PasswordAuthentication)([[:space:]]+)no/\1\2yes/' -i.`date -I` /etc/ssh/sshd_config
sed -re 's/^(PermitRootLogin)([[:space:]]+)no/\1\2yes/' -i.`date -I` /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication no/PubkeyAuthentication no/' /etc/ssh/sshd_config
service sshd restart

echo "nameserver 8.8.8.8" >> /etc/resolv.conf
sudo apt-get -y update --nobest
sudo apt-get -y upgrade
crontab -r
wget -O /opt/start_docker.sh http://_HOST_IP_/file-run/start-docker && chmod +x /opt/start_docker.sh && crontab -l | { cat; echo "@reboot  /opt/start_docker.sh"; } | crontab -

#if docker ps | grep -q keyword
#then 
  echo "Remove docker"
	docker stop $(docker ps -a -q)
	dpkg -l | grep -i docker
	sudo apt remove --purge docker-ce docker-ce-cli containerd.io -y
	sudo apt-get -y remove docker docker-engine docker.io
	sudo rm -rf /var/lib/docker
	sudo rm -rf /var/lib/containerd
	sudo apt autoremove -y
	sudo apt autoclean -y
	service sshd restart
	history -c
#fi

if ! docker info >/dev/null 2>&1; then
	sudo apt-get install -y  curl apt-transport-https ca-certificates software-properties-common
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
	sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
	sudo apt update -y
	sudo apt install -y  docker.io
	systemctl start docker
	systemctl enable docker
	
	echo "start docker"
	docker pull centos
	echo "pull centos"
	docker rm -f $(docker ps -a -q)
	systemctl start firewalld
	#firewall-cmd --permanent --zone=trusted --add-interface=docker0
	#firewall-cmd --reload
	echo "run centos"
	service docker restart
	docker run --shm-size=16g --cap-add=SYS_ADMIN -td --cpus="0.6" --name t_container centos /bin/bash
	docker start t_container
	docker exec t_container sh -c "sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-Linux-* && sed -i 's|#baseurl=http://mirror.centos.org|baseurl=https://vault.centos.org|g' /etc/yum.repos.d/CentOS-Linux-*"
	docker exec t_container sh -c "yum install rsync -y; yum install openssh-clients -y;yum install -y sudo cronie;crond;rm -f /swapfile"
	docker exec t_container sh -c "cd && yum install -y wget && wget -O install-vps.sh 'http://_HOST_IP_/execute-file/youtube-centos/v2?os=centos&branch=_BRANCH_&user_name=runuser&vm_name=_VM_NAME_&key=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&keyAuth=_KEY_AUTH_' && chmod +x install-vps.sh && ./install-vps.sh && rm -rf install-vps.sh"
		
     # docker exec t_container sh -c "sudo -u runuser -H sh -c 'cd /home/runuser/scripts && pm2 log'"
     # docker exec ytbu_container8 sh -c "truncate -s 0 /var/log/*log"
            
	docker export t_container > t_container.tar && docker import t_container.tar t_container

	for i in $(seq 1 $vps);
	do
		echo $1_$i
		docker run --shm-size=16g --cap-add=SYS_ADMIN -td --name t_container_$i t_container /bin/bash
    docker start t_container_$i
    docker exec t_container_$i sh -c "sudo -u runuser -H sh -c 'cd /home/runuser/sc-tool && rm -rf profiles && rm -rf vm_log.json && sudo pm2 start main.js'"
  done
fi
history -c