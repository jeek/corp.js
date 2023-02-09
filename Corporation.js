import { CorpBaseClass } from "CorpBaseClass.js";
import { GuideMaterial } from "GuideMaterial.js";
import { GuideProduct } from "GuideProduct.js";
import { JeekMaterial } from "JeekMaterial.js";
import { JeekProduct } from "JeekProduct.js";
import { Scam } from "Scam.js";

export class Corporation extends CorpBaseClass {
    constructor(ns, settings = {}) {
        super(ns, settings);
        if (!Object.keys(this.settings).includes("HQ")) {
            this.settings['HQ'] = "Sector-12";
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
                this.c.createCorporation(this.settings.includes("name") ? this.settings.name : "Corporation", this.ns.getPlayer().bitNodeN == 3 ? false : true);
                await this.ns.asleep(0);
            } catch {
                await this.ns.asleep(60000);
            }
        }
        await this.ns.asleep(1);
        if (Object.keys(this.settings).includes("name")) {
            delete this.settings["name"];
        }
        this.divisionsObj = {};
        for (let divname of this.c.getCorporation().divisions) {
            let type = this.c.getDivision(divname).type;
            this.StartDivision(type, this.settings);
        }
        this.started = true;
        this.ns.toast("Corporation started.");
        this.Continue();
    }
    async Continue() {
        if (!Object.keys(this.settings).includes("scam") || this.settings.scam == false) {
            for (let i = 1; i <= 4; i++) {
                while (this.round == i && this.c.getInvestmentOffer().funds < (Object.keys(this.settings).includes("baseOffers") ? this.settings['baseOffers'][i - 1] : [210e9, 5e12, 800e12, 500e15]) * this.ns.getBitNodeMultipliers().CorporationValuation) {
                    await this.WaitOneLoop();
                }
                if (this.round == i) {
                    this.c.acceptInvestmentOffer();
                    await this.WaitOneLoop();
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
    async StartDivision(type, settings = {}) {
        if (Object.keys(this.divisionsObj).includes(type)) {
            return;
        }
        let plan = "Guide";
        if (Object.keys(this.settings).includes(type) && Object.keys(this.settings[type]).includes("plan")) {
            plan = this.settings[type].plan;
        }
        let makesProducts = Object.keys(this.c.getIndustryData(type)).includes("product");
        let makesMaterials = Object.keys(this.c.getIndustryData(type)).includes("producedMaterials");
        switch (plan) {
            case "Scam":
                this.divisionsObj[type]=new Scam(this.ns, this, type, this.settings);
                break;
            case "Shell":
                this.divisionsObj[type]=new Shell(this.ns, this, type, this.settings);
                break;
            case "Guide":
                if (makesMaterials) {
                    this.divisionsObj[type]=new GuideMaterial(this.ns, this, type, this.settings);
                }
                if (makesProducts) {
                    this.divisionsObj[type]=new GuideProduct(this.ns, this, type, this.settings);
                }
                break;
            case "Jeek":
            default:
                if (makesMaterials) {
                    this.divisionsObj[type]=new JeekMaterial(this.ns, this, type, this.settings);
                }
                if (makesProducts) {
                    this.divisionsObj[type]=new JeekProduct(this.ns, this, type, this.settings);
                }
        }
        this.divisionsObj[type].Start();
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