function getBrowserInstallCommand(browserName) {
  switch (browserName) {
    case "google-chrome-stable":
      return `
  wget -nc https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
  sudo yum --disablerepo="epel" install -y ./google-chrome-stable_current_*.rpm`;

    case "microsoft-edge":
      return `
  sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
  sudo dnf config-manager --add-repo https://packages.microsoft.com/yumrepos/edge
  sudo mv /etc/yum.repos.d/packages.microsoft.com_yumrepos_edge.repo /etc/yum.repos.d/microsoft-edge.repo
  sudo dnf install -y microsoft-edge-stable`;

    case "brave":
      return `
  wget https://github.com/brave/brave-browser/releases/download/v1.63.157/brave-browser-1.63.157-1.x86_64.rpm
  sudo dnf install -y brave-browser-1.63.157-1.x86_64.rpm`;

    case "vivaldi":
    case "vivaldi-stable":
      return `
  sudo dnf config-manager --add-repo https://repo.vivaldi.com/archive/vivaldi-fedora.repo
  sudo dnf install -y vivaldi-stable`;

    case "opera":
    case "opera-stable":
      return `
  sudo dnf config-manager --add-repo https://rpm.opera.com/rpm
  sudo rpm --import https://rpm.opera.com/rpmrepo.key
  sudo dnf install -y opera-stable`;

    default:
      return ""; // Return empty string for unknown browsers
  }
}

module.exports = getBrowserInstallCommand;
