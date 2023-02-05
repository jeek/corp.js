let REPO = "https://raw.githubusercontent.com/jeek/corp.js/master/"

import { Update } from "Update.js";
import { Corporation } from "Corporation.js";

const cmdlineflags = [
    ["scam", false],
    ["jakobag", false], // Use Jakob's round 1 agriculture method
    ["update", false]
]

export async function main(ns) {
    var cmdlineargs = ns.flags(cmdlineflags);
    if (cmdlineargs['update']) {
        await (new Update("corp.js", repo)).DownloadAndBuild();
        let filteredArgs = ns.args;
        filteredArgs.remove("--update");
        if (0 == ns.run("corp.js",1,...filteredArgs)) {
            ns.spawn("corp.js",1,...filteredArgs);
        }
    }
    let settings = {};
    await ns.asleep(1000);
    while (Corp.started == false) {
        ns.toast("Corporation not started yet.");
        await ns.asleep(60000);
    }
    if (cmdlineargs['scam']) {
        settings.name = "TurboScam Ltd."
        settings['scam'] = true;
        let Corp = new Corporation(ns, settings);
        Corp.Start();
        if (Corp.round == 1)
            Corp.StartDivision("Software", { "scam": true })
        while (Corp.round < 2) {
            await ns.asleep(0);
        }
        if (Corp.round == 2)
            Corp.StartDivision(Corp.funds < 680e9 ? "Software" : "Real Estate", { "scam": true })
        while (Corp.round < 3) {
            await ns.asleep(0);
        }
        if (Corp.round == 3)
            Corp.StartDivision("Real Estate", { "scam": true })
        while (Corp.round < 4) {
            await ns.asleep(0);
        }
        Corp.StartDivision("Food", { "name": "jeek Heaviest Industries" });
        while (true) {
            await ns.asleep(10000);
        }
    } else {
        settings.name = "jeek Heavy Industries"
        settings.baseOffers = [210e9, 5e15, 800e15, 500e18];
        let Corp = new Corporation(ns, settings);
        Corp.Start();
        Corp.StartDivision("Agriculture", { "name": "jeek Heavier Industries" });
        while (Corp.round < 3) {
            await ns.asleep(10000);
        }
        Corp.StartDivision("Tobacco", { "name": "jeek Heaviest Industries" });
        while (true) {
            await ns.asleep(10000);
        }
    }
}