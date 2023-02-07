import { CorpBaseClass } from "CorpBaseClass.js";
import { City } from "City.js";
import { WarehouseOptimizer } from "WarehouseOptimizer.js";

class Division extends CorpBaseClass {
    constructor(ns, Corp, industry, settings = {}) {
        super(ns, settings);
        this.Corp = Corp;
        this.industry = industry;
        this.citiesObj = {};
        this.lastProduct = 2e9 / 1.1;
        if (Object.keys(this.settings).includes(industry)) {
            for (let objKey of Object.keys(this.settings[industry])) {
                this.settings[objKey] = this.settings[industry][objKey];
            }
        }
        for (let industryIt of this.c.getConstants().industryNames) {
            if (Object.keys(this.settings).includes(industryIt)) {
                delete this.settings[industryIt];
            }
        }
        // Stored here so all six warehouses can share a cache
        this.Optimizer = new WarehouseOptimizer(...(["aiCoreFactor", "hardwareFactor", "realEstateFactor", "robotFactor"].map(factor => Object.keys(this.c.getIndustryData(this.industry)).includes(factor) ? this.c.getIndustryData(this.industry)[factor] : 0)), ns);
    }
    get name() {
        return this.c.getCorporation().divisions.map(div => [div, this.c.getDivision(div).type]).filter(x => x[1] == this.industry)[0][0];
    }
    get cities() {
        return Object.values(this.citiesObj);
    }
    get industryData() {
        return this.c.getIndustryData(this.industry);
    }
    get Aevum() {
        return this.citiesObj['Aevum'];
    }
    get Chongqing() {
        return this.citiesObj['Chongqing'];
    }
    get Ishima() {
        return this.citiesObj['Ishima'];
    }
    get ['New Tokyo']() {
        return this.citiesObj['New Tokyo'];
    }
    get ['Sector-12']() {
        return this.citiesObj['Sector-12'];
    }
    get Volhaven() {
        return this.citiesObj['Volhaven'];
    }
    get getDivision() {
        return this.c.getDivision(this.name);
    }
    async Advert(toLevel = 1) {
        while (this.c.getHireAdVertCount(this.name) < toLevel) {
            if (this.getDivision.awareness + this.getDivision.popularity > 1e300)
                return;
            if (this.funds >= this.c.getHireAdVertCost(this.name)) {
                this.c.hireAdVert(this.name);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async getHappy() {
        while (!this.c.getCorporation().divisions.map(x => this.c.getDivision(x).type).includes(this.industry)) {
            await this.WaitOneLoop();
        }
        await Promise.all(this.cities.map(city => city.o.getHappy()));
    }
    async Pricing() {
        this.cities.map(city => city.w.Pricing());
    }
    async enableSmartSupply() {
        await Promise.all(this.cities.map(city => city.w.enableSmartSupply()));
    }
    async WaitOneLoop() {
        await this.Corp.WaitOneLoop();
    }
    async Research(queue) {
        while (queue.map(x => this.c.hasResearched(this.name, x)).reduce((a, b) => a && b) == false) {
            let cost = queue.filter(x => !this.c.hasResearched(this.name, x)).map(x => this.c.getResearchCost(this.name, x)).reduce((a, b) => a + b, 0) * 2;
            if (this.getDivision.research >= cost) {
                for (let item of queue) {
                    this.c.research(this.name, item);
                }
            }
            await this.WaitOneLoop();
        }
    }

    async MaintainWarehouse() {
        this.cities.map(city => city.w.MaintainWarehouse);
    }
}