import { CorpBaseClass } from "CorpBaseClass.js";
import { Division } from "Division.js";

export class Corporation extends CorpBaseClass {
    constructor(ns, settings = {}) {
        super(ns, settings);
        if (!Object.keys(settings).includes("HQ")) {
            settings['HQ'] = "Sector-12";
        }
        this.started = false;
        this.divisionsObj = {};
        if (this.c.hasCorporation()) {
            if (!Object.keys(settings).includes("name")) {
                delete settings["name"];
            }   
        }
    }
    get name() {
        return this.c.getCorporation().name;
    }
    get Agriculture() {
        return this.divisionsObj['Agriculture'];
    }
    get Chemical() {
        return this.divisionsObj['Chemical'];
    }
    get ['Computer Hardware']() {
        return this.divisionsObj['Computer Hardware'];
    }
    get Energy() {
        return this.divisionsObj['Energy'];
    }
    get Fishing() {
        return this.divisionsObj['Fishing'];
    }
    get Food() {
        return this.divisionsObj['Food'];
    }
    get Healthcare() {
        return this.divisionsObj['Healthcare'];
    }
    get Mining() {
        return this.divisionsObj['Mining'];
    }
    get Pharmaceutical() {
        return this.divisionsObj['Pharmaceutical'];
    }
    get ['Real Estate']() {
        return this.divisionsObj['Real Estate'];
    }
    get Robotics() {
        return this.divisionsObj['Robotics'];
    }
    get Software() {
        return this.divisionsObj['Software'];
    }
    get Tobacco() {
        return this.divisionsObj['Tobacco'];
    }
    get ['Water Utilities']() {
        return this.divisionsObj['Water Utilities'];
    }
    async Start() {
        while ([undefined, false].includes(this.c.hasCorporation())) {
            try {
                this.c.createCorporation(settings.includes("name") ? settings.name : "jeekCo", this.ns.getPlayer().bitNodeN == 3 ? false : true);
                await this.ns.asleep(0);
            } catch {
                await this.ns.asleep(60000);
            }
        }
        await this.ns.asleep(1);
        if (!Object.keys(settings).includes("name")) {
            delete settings["name"];
        }
        this.divisionsObj = {};
        this.c.getCorporation().divisions.map(divname => Object({ "name": divname, "type": this.c.getDivision(divname).type })).map(x => this.divisionsObj[x.type] = new Division(this.ns, this, x.type, x.name, this.settings));
        if (!Object.keys(this.settings).includes("scam")) {
            Object.values(this.divisionsObj).map(x => x.Start());
        } else {
            if (Object.keys(this.divisionsObj).includes("Food")) {
                this.divisionsObj["Food"].Start();
            } else {
                if (Object.keys(this.divisionsObj).includes("Real Estate")) {
                    this.divisionsObj["Real Estate"].Start();
                } else {
                    if (Object.keys(this.divisionsObj).includes("Software")) {
                        this.divisionsObj["Software"].Start();
                    }
                }
            }
        }
        this.started = true;
        this.ns.toast("Corporation started.");
        this.Continue();
    }
    async Continue() {
        if (!Object.keys(this.settings).includes("scam") || this.settings.scam == false) {
            for (let i = 1; i <= 4; i++) {
                while (this.round == i && this.c.getInvestmentOffer().funds < (Object.keys(this.settings).includes("baseOffers") ? this.settings['baseOffers'][i - 1] : baseOffers[i - 1]) * this.ns.getBitNodeMultipliers().CorporationValuation) {
                    await this.WaitOneLoop();
                }
                if (this.round == i) {
                    this.ns.tprint("Ding! " + i.toString());
                    this.c.acceptInvestmentOffer();
                }
            }
            if (!this.c.getCorporation().public)
                this.c.goPublic(0);
        }
        while (this.round < 5)
            await this.WaitOneLoop();
        this.c.issueDividends(1);
        while (this.funds < 1e21)
            await this.WaitOneLoop();
        this.c.getConstants().unlockNames.map(unlock => this.c.hasUnlockUpgrade(unlock) ? true : this.c.unlockUpgrade(unlock));
    }
    async StartDivision(industry, settings = {}) {
        if (!Object.keys(this.divisionsObj).includes(industry)) {
            this.divisionsObj[industry] = new Division(this.ns, this, industry, settings);
            this.divisionsObj[industry].Start();
        } else {
            if (Object.keys(this.settings).includes("scam")) {
                this.divisionsObj[industry].Start();
            }
        }
    }
    async GetUpgrade(upgrade, level = 1) {
        while (this.c.getUpgradeLevel(upgrade) < level) {
            while (this.c.getUpgradeLevel(upgrade) < level && this.c.getUpgradeLevelCost(upgrade) <= this.funds) {
                this.c.levelUpgrade(upgrade);
            }
            if (this.c.getUpgradeLevel(upgrade) < level) {
                await this.WaitOneLoop();
            }
        }
    }
}