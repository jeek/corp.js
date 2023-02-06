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
        await (new Update(ns, "corp.js", REPO)).DownloadAndBuild();
        let filteredArgs = ns.args.filter(x => x != "--update");
        if (0 == ns.run("corp.js", 1, ...filteredArgs)) {
            ns.spawn("corp.js", 1, ...filteredArgs);
        } else {
            ns.exit();
        }
    }
    let settings = {};
    if (cmdlineargs['scam']) {
        settings['scam'] = true;
        settings['Software'] = {'name': 'Software'};
        settings['Real Estate'] = {'name': 'Real Estate'};
        settings['Food'] = {'name': 'Food'}
        let Corp = new Corporation(ns, settings);
        Corp.Start();
        await ns.asleep(1000);
        while (Corp.started == false) {
            ns.toast("Corporation not started yet.");
            await ns.asleep(60000);
        }
        if (Corp.round == 1)
            await Corp.StartDivision("Software");
        if (Corp.round == 2)
            await Corp.StartDivision(Corp.funds < 680e9 ? "Software" : "Real Estate");
        if (Corp.round == 3)
            await Corp.StartDivision("Real Estate");
        Corp.StartDivision("Food");
        while (true) {
            await ns.asleep(10000);
        }
    } else {
        settings.baseOffers = [210e9, 5e15, 800e15, 500e18];
        let Corp = new Corporation(ns, settings);
        Corp.Start();
        await ns.asleep(1000);
        while (Corp.started == false) {
            ns.toast("Corporation not started yet.");
            await ns.asleep(60000);
        }
        Corp.StartDivision("Agriculture");
        while (Corp.round < 3) {
            await ns.asleep(10000);
        }
        Corp.StartDivision("Tobacco");
        while (true) {
            await ns.asleep(10000);
        }
    }
}