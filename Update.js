class Update {
    constructor(ns, scriptName, repository) {
        this.ns = ns;
        this.scriptName = scriptName;
        this.repository = repository;
    }
    async Download() {
        this.ns.tprint("Getting " + this.scriptName);
        let seen = [this.scriptName];
        for (let i = 0 ; i < seen.length ; i++) {
            this.ns.tprint("    Downloading " + seen[i]);
            await this.ns.wget(this.repository + seen[i], "/temp/" + seen[i]);
            let thisFile = this.ns.read("/temp/" + seen[i]).split("\n");
            for (let j = 0 ; j < thisFile.length ; j++) {
                if (thisFile[j].length >= 6 && thisFile[j].slice(0, 6) == "import") {
                    let newFile = thisFile[j].split(" ")[5].replace('"', '').replace('"', '').replace(";", "");
                    this.ns.tprint("         ", newFile);
                    if (!seen.includes(newFile)) {
                        seen.push(newFile)
                    }
                }
            }
        }
    }
    async Build() {
        this.ns.tprint("    Parsing " + this.scriptName);
        let seen = [this.scriptName];
        let importOrder = [this.scriptName];
        let code = "";
        for (let i = 0 ; i < seen.length ; i++) {
            let thisFile = this.ns.read("/temp/" + seen[i]).split("\n");
            for (let j = 0 ; j < thisFile.length ; j++) {
                if (thisFile[j].length >= 6 && thisFile[j].slice(0, 6) == "import") {
                    let newFile = thisFile[j].split(" ")[5].replace('"', '').replace('"', '').replace(";", "");
                    this.ns.tprint("         ", newFile);
                    if (!seen.includes(newFile)) {
                        seen.push(newFile)
                    }
                    importOrder = [newFile].concat(...importOrder);
                    thisFile.splice(j, 1);
                    j -= 1;
                }
            }
        }
        this.ns.tprint("    Assembling " + this.scriptName);
        for (let i = 0 ; i < importOrder.length ; i) {
            this.ns.tprint("        " + thisfile[0]);
            let thisFile = this.ns.read("/temp/" + importOrder[0]).split("\n");
            for (let j = 0 ; j < thisFile.length ; j++) {
                if (thisFile[j].length >= 6 && thisFile[j].slice(0, 6) == "import") {
                    let newFile = thisFile[j].split(" ")[5].replace('"', '').replace('"', '').replace(";", "");
                    this.ns.tprint("         ", newFile);
                    if (!seen.includes(newFile)) {
                        seen.push(newFile)
                    }
                    thisFile.splice(j, 1);
                    j -= 1;
                }
            }
            code = code + "\n\n" + thisFile.join("\n");
            importOrder = importOrder.filter(x => x != importOrder[0]);
        }
        this.ns.write(this.scriptName, code, 'w');
    }
    async DownloadAndBuild() {
        await this.Download();
        await this.Build();
    }
}