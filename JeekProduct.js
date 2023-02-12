import { ProductIndustry } from "ProductIndustry.js";
import { City } from "City.js";

class JeekProduct extends ProductIndustry {
    constructor(ns, Corp, industry, settings = {}) {
        super(ns, Corp, industry, settings);
    }
    async Start() {
        while (this.c.getCorporation().divisions.map(div => [div, this.c.getDivision(div).type]).filter(x => x[1] == this.industry).length == 0) {
            if (this.c.getIndustryData(this.industry).startingCost <= this.funds) {
                this.c.expandIndustry(this.industry, Object.keys(this.settings).includes("name") ? this.settings["name"] : this.industry);
            } else {
                await this.WaitOneLoop();
            }
        }
        this.Corp.pause += 1;
        this.Cities.map(city => this.citiesObj[city] = new City(this.ns, this.Corp, this, city, this.settings));
        await Promise.all(this.cities.map(city => city.Start()));
        this.Research(["Hi-Tech R&D Laboratory"])
        this.Research(["Market-TA.I", "Market-TA.II"]);
        var cmdlineargs = this.ns.flags(this.settings.cmdlineflags);
        this.Pricing();
        await this.enableSmartSupply();
        let promises = [];
        // Get Employees
        this.cities.map(city => promises.push(city.o.Hire({ "Operations": 1, "Engineer": 1, "Business": 1})));
        await this.WaitOneLoop();
        this.cities.map(city => promises.push(city.o.Hire(city.name == this.HQ ? { "Operations": 8, "Engineer": 9, "Business": 5, "Management": 8 } : { "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 })));
        // Buy 1 advert
        promises.push(this.Advert(cmdlineargs['jakobag'] ? 2 : 1));
        await Promise.all(promises);
        promises = [];
        this.Products();
        for (let upgrade of ["DreamSense"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        }
        for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, Math.ceil(20 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        }
        for (let upgrade of ["Project Insight"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        }
        while (this.getDivision.products.length == 0) {
            await this.WaitOneLoop();
        }
        this.Corp.pause -= 1;
        await Promise.all(promises);
        for (let upgrade of ["DreamSense"]) {
            this.Corp.GetUpgrade(upgrade, 10);
        }
        await this[this.HQ].o.Hire({ "Operations": Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5), "Engineer": Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5), "Business": this.c.getOffice(this.name, this.HQ).size - 3 * Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5), "Management": Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5) });
        while (true) {
            let WilsonInsight = (this.c.getUpgradeLevel("Wilson Analytics") / this.c.getIndustryData(this.industry).advertisingFactor < this.c.getUpgradeLevel("Project Insight") / this.c.getIndustryData(this.industry).scienceFactor) ? "Wilson Analytics" : "Project Insight";
            if (this.c.getUpgradeLevelCost(WilsonInsight) <= this.funds) {
                this.c.levelUpgrade(WilsonInsight);
            } else {
                if (this.c.getOfficeSizeUpgradeCost(this.name, this.HQ, 15) <= this.funds) {
                    let size = this.c.getOffice(this.name, this.HQ).size + 15;
                    let main = Math.floor(size / 3.5);
                    let bus = size - 3 * main;
                    await this[this.HQ].o.Hire({ "Operations": main, "Engineer": main, "Business": bus, "Management": main });
                }
                else {
                    if (this.c.getUpgradeLevel("Wilson Analytics") >= (10 * this.ns.getBitNodeMultipliers().CorporationValuation) && this.c.getHireAdVertCost(this.name) <= this.funds && this.getDivision.awareness + this.getDivision.popularity < 1e300) {
                        this.c.hireAdVert(this.name);
                    } else {
                        let didSomething = this.cities.map(city => city.o.size + 60 < this[this.HQ].o.size);
                        for (let city of this.getDivision.cities) {
                            if (this.c.getOffice(this.name, city).size + 60 < this.c.getOffice(this.name, this.HQ).size) {
                                if (this.c.getOfficeSizeUpgradeCost(this.name, city, 3) <= this.funds) {
                                    await this[city].o.Hire({ "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": this.c.getOffice(this.name, city).size - 1 });
                                    didSomething = true;
                                }
                            }
                        }
                        if (!didSomething) {
                            for (let upgrade of ["Smart Factories", "Project Insight", "Smart Storage"]) {
                                if (this.c.getUpgradeLevel(upgrade) < this.c.getUpgradeLevel("Wilson Analytics") && this.c.getLevelUpgradeCost(upgrade) < this.funds && (this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                                    this.c.levelUpgrade(upgrade);
                                }
                            }
                            for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"]) {
                                if (this.c.getUpgradeLevel(upgrade) / 2 < this.c.getUpgradeLevel("Wilson Analytics") && this.c.getLevelUpgradeCost(upgrade) < this.funds && (this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                                    this.c.levelUpgrade(upgrade);
                                }
                            }
                            await this.WaitOneLoop();
                        }
                    }
                }
            }
            await this.ns.asleep(0);
        }
    }
}