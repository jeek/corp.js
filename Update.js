class Update {
    constructor(ns, scriptName, repository) {
        this.ns = ns;
        this.scriptName = scriptName;
        this.repository = repository;
    }
    async Download() {
        let seen = [this.scriptName];
        for (let i = 0 ; i < seen.length ; i++) {
            await this.ns.wget(repository + seen[i], "/temp/" + this.scriptName + "/" + seen[i]);
            let thisFile = this.ns.read("/temp/" + this.scriptName + "/" + seen[i]).split("\n");
            for (let j = 0 ; j < thisFile.length ; j++) {
                if (j.length >= 6 && j.slice(0, 6) == "import") {
                    let newFile = j.split(" ")[5].replace('"', '').replace("'", '');
                    if (!seen.includes(newFile)) {
                        seen.push()
                    }
                }
            }
        }
    }
    async Build() {
        let seen = [this.scriptName];
        let code = "";
        for (let i = 0 ; i < seen.length ; i++) {
            let thisFile = this.ns.read("/temp/" + this.scriptName + "/" + seen[i]).split("\n");
            for (let j = 0 ; j < thisFile.length ; j++) {
                if (j.length >= 6 && j.slice(0, 6) == "import") {
                    let newFile = j.split(" ")[5].replace('"', '').replace("'", '');
                    if (!seen.includes(newFile)) {
                        seen.push()
                    }
                    thisFile.splice(j,1);
                    j -= 1;
                }
            }
            code = code + "\n" + thisFile.join("\n");
        }
        this.ns.write(this.scriptName, code, 'w');
    }
    async DownloadAndBuild() {
        await this.Download().then(this.Build());
    }
}