const ServiceService = require("./service-service");

class ScriptService {
  static async getNewScript(pid) {
    const Script = await getModel("Script");
    const scripts = await this.getActiveScripts(Script);

    if (scripts.length === 0) {
      return {};
    }

    const scriptPosition = this.getScriptPosition(scripts, pid);
    const reorderedScripts = this.reorderScripts(scripts, scriptPosition);

    const service = await this.findAvailableService(reorderedScripts, pid);
    if (service) {
      const directLinkData = await ServiceService.getRandomDirectLinkService();

      return directLinkData.link
        ? { ...service, directLink: directLinkData.link }
        : service;
    }

    return {};
  }

  static async getActiveScripts(Script) {
    return Script.find(
      { status: true },
      { code: 1, position: 1, status: 1, is_break: 1 },
      { sort: { position: 1 } }
    ).lean();
  }

  static getScriptPosition(scripts, pid) {
    const posSc = global.pid_script_position[pid] || -1;
    return scripts.findIndex((script) => script.position === posSc) + 1;
  }

  static reorderScripts(scripts, scriptPosition) {
    return [
      ...scripts.slice(scriptPosition),
      ...scripts.slice(0, scriptPosition),
    ];
  }

  static async findAvailableService(scripts, pid) {
    for (const script of scripts) {
      if (!script.status) continue;

      const service = await ServiceService.getService(script, pid);
      if (service) {
        global.pid_script_position[pid] = script.position;
        return service;
      }
    }
    return null;
  }
}

module.exports = ScriptService;
