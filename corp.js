import { Update } from "Update.js";
import { Corporation } from "Corporation.js";

const cmdlineflags = [
    ["scam", false],
    ["guide", false], // Use code based on Mughur's Guide
    ["jeek", false], // Jeek's Strategy
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
    let settings = {'cmdlineflags': cmdlineflags};
    if (cmdlineargs['scam']) {
        settings['scam'] = true;
        settings['Software'] = {'name': 'Software', 'plan': 'Scam'};
        settings['Real Estate'] = {'name': 'Real Estate', 'plan': 'Scam'};
        settings['Food'] = {'name': 'Food', 'plan': 'Guide'}
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
    }
    if (cmdlineargs['guide']) {
        settings.baseOffers = [210e9, 5e12, 800e12, 500e15];
        settings['Agriculture'] = {'name': 'Agriculture', 'plan': 'Guide'};
        settings['Tobacco'] = {'name': 'Tobacco', 'plan': 'Guide'};
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
    if (cmdlineargs['jeek'] || (cmdlineargs['jeek'] + cmdlineargs['guide'] + cmdlineargs['scam'] == 0)) {
        settings.baseOffers = [210e9, 5e12, 800e12, 500e15];
        settings['Agriculture'] = {'name': 'Agriculture', 'plan': 'Jeek'};
        settings['Food'] = {'name': 'Food', 'plan': 'Jeek'};
        let Corp = new Corporation(ns, settings);
        Corp.Start();
        await ns.asleep(1000);
        while (Corp.started == false) {
            ns.toast("Corporation not started yet.");
            await ns.asleep(60000);
        }
        Corp.StartDivision("Agriculture");
        while (Corp.round < 2) {
            await ns.asleep(10000);
        }
        while (!Corp.c.hasUnlockUpgrade("Export")) {
            await ns.asleep(100);
            if (Corp.c.getUnlockUpgradeCost("Export") <= Corp.funds && !Corp.c.hasUnlockUpgrade("Export")) {
                Corp.c.unlockUpgrade("Export");
            }
        }
        Corp.StartDivision("Water Utilities");
        while (Corp.round < 3) {
            await ns.asleep(10000);
        }
        Corp.StartDivision("Computer Hardware");
        Corp.StartDivision("Mining");
        while (Corp.round < 4) {
            await ns.asleep(10000);
        }
        Corp.StartDivision("Food");
        Corp.StartDivision("Robotics");
        while (true) {
            await ns.asleep(10000);
        }
    }
}