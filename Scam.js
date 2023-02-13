import { MaterialIndustry } from "MaterialIndustry.js";
import { City } from "City.js";

class Scam extends MaterialIndustry {
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
        this.Cities.map(city => this.citiesObj[city] = new City(this.ns, this.Corp, this, city, this.settings));
        await Promise.all(this.cities.map(city => city.Start()));
        while (Object.keys(this.cities).length < 6) {
            await this.ns.asleep(0);
        }

        // Get Upgrades
        let promises = [];
        await Promise.all(this.cities.map(city => city.o.Hire({"Research & Development": [3,3,9,9,9,9][this.round]})));
        for (let i = 0 ; i <= 1 ; i+=.25) {
            this.Corp.GetUpgrade("Smart Storage", Math.ceil(i * [7,7,23,23,23,23][this.round]));
            this.Corp.GetUpgrade("Speech Processor Implants", Math.ceil(i * [0,0,15,15,15,15][this.round]));
            //this.Corp.GetUpgrade("Smart Factories", Math.ceil(i * [7,7,36,36,36,36][this.round]));
            ["Nuoptimal Nootropic Injector Implants", "Speech Processor Implants", "Neural Accelerators", "FocusWires"]
                .map(upgrade => this.Corp.GetUpgrade(upgrade, Math.ceil(i * [0,0,10,10,10,10][this.round])));
            this.Advert(Math.ceil(i * [3,3,21,21,21,21][this.round]));
            this.Corp.GetUpgrade("Project Insight", Math.ceil(i * [0,0,10,10,10,10][this.round]));
            this.Corp.GetUpgrade("ABC SalesBots", Math.ceil(i * [0,0,15,15,15,15][this.round]));
            this.Corp.GetUpgrade("Wilson Analytics", Math.ceil(i * [0,0,5,5,5,5][this.round]));
            this.cities.map(city => city.w.upgradeLevel(Math.ceil(i * [8,8,27,27,27,27][this.round])));
        }

        if (this.round >= 2) {
            await this.ns.asleep(0);
            for (let shell of this.c.getConstants().industryNames
                .filter(industry => !this.c.getCorporation().divisions
                    .map(division => this.c.getDivision(division).type).includes(industry)
                )
                .sort((a, b) => this.c.getIndustryData(a).startingCost - this.c.getIndustryData(b).startingCost)) {
                if (this.c.getIndustryData(shell).startingCost <= this.funds) {
                    let name = shell + " Shell";
                    if (Object.keys(this.Corp.settings).includes(shell) && Object.keys(this.Corp.settings[shell]).includes('name')) {
                        name = this.Corp.settings[shell].name;
                    }
                    this.c.expandIndustry(shell, name);
                    await this.ns.asleep(0);
                }
            }
            let done = false;
            while (!done) {
                for (let city of this.Cities.sorted((a, b) => this.c.getWarehouse(this.name, a).size - this.c.getWarehouse(this.name, b))) {
                    if (this.c.getUpgradeWarehouseCost(this.name, city) < this.funds) {
                        this.c.upgradeWarehouse(this.name, city);
                    } else {
                        done = true;
                    }
                }
            }
        }

        // Choose Output Material For Each City
        let outputMat = {};
        this.cities.map(city => outputMat[city.name] = this.industryData.producedMaterials.map(material => [material, this.c.getMaterial(this.name, city.name, material).cost / this.c.getMaterialData(material).size]).reduce((a, b) => a[1] > b[1] ? a : b)[0]);
        // If this is the second pass for an industry, need to disable the sell from earlier
        this.cities.map(city => this.c.sellMaterial(this.name, city.name, outputMat[city.name], 0, "MP"));
        
        // Get Happy
        await this.getHappy();

        // Buy Mats
        this.cities.map(city => this.c.buyMaterial(this.name, city.name, outputMat[city.name], (this.c.getWarehouse(this.name, city.name).size - this.c.getWarehouse(this.name, city.name).sizeUsed - 1)/10/this.c.getMaterialData(outputMat[city.name]).size));
        Object.keys(this.industryData.requiredMaterials).map(material => this.cities.map(city => this.c.buyMaterial(this.name, city.name, material, .0001)));
        await this.WaitOneLoop();
        this.cities.map(city => this.c.buyMaterial(this.name, city.name, outputMat[city.name], 0));
        Object.keys(this.industryData.requiredMaterials).map(material => this.cities.map(city => this.c.buyMaterial(this.name, city.name, material, 0)));

        // Make a Thing
        await Promise.all(this.cities.map(city => city.o.Hire({"Engineer": [3,3,9,27,81,343][this.round]})));
        await this.WaitOneLoop();

        // Sell All The Things
        while (this.c.getCorporation().state != "EXPORT") {
            await this.ns.asleep(0);
        }
        await Promise.all(this.cities.map(city => city.o.Hire({"Business": [3,3,9,27,81,343][this.round]})));
        this.cities.map(city => this.c.sellMaterial(this.name, city.name, outputMat[city.name], "MAX", "MP"))
        while (this.c.getCorporation().state == "EXPORT") {
            await this.ns.asleep(0);
        }

        // Wait 5 rounds and then accept the offer
        for (let i = 0 ; i < 5 ; i++) {
            await this.WaitOneLoop();
        }
        this.c.acceptInvestmentOffer();
    }
}