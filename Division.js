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
        if (!Object.keys(this.settings).includes("productNames")) {
            this.settings.productNames = ["A","B","C","D","E"].map(x => this.industry + " " + x);
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
        let makesMaterials = Object.keys(this.industryData).includes("producedMaterials");
        let makesProducts = Object.keys(this.industryData).includes("product");
        if (this.settings.scam && makesMaterials) {
            this.Scam();
        } else {
            (makesMaterials && makesProducts) ? this.Simple().then(this.Product()) : makesProducts ? this.Product() : this.Simple();
        }
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
    async Simple() {
        var cmdlineargs = this.ns.flags(this.settings.cmdlineflags);
        while (!(this.c.getCorporation().divisions.map(x => this.c.getDivision(x)).map(x => x.type).includes(this.industry))) {
            await this.WaitOneLoop();
        }
        this.Research(["Hi-Tech R&D Laboratory"]).then(this.Research(["Market-TA.I", "Market-TA.II"]));
        this.Pricing();
        await this.enableSmartSupply();
        let promises = [];
        // Get Employees
        this.cities.map(city => promises.push(city.o.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })));
        // Buy 1 advert
        promises.push(this.Advert(cmdlineargs['jakobag'] ? 2 : 1));
        if (cmdlineargs['jakobag']) {
            promises.push(this.Corp.GetUpgrade("Smart Storage", 3));
            this.cities.map(city => promises.push(city.w.upgradeLevel(5)));
        } else {
            this.cities.map(city => promises.push(city.w.upgradeLevel(3)));
            for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Smart Factories"]) {
                promises.push(this.Corp.GetUpgrade(upgrade, 2));
            }
        }
        // Upgrade Each City's Storage to 300
        // Set produced materials to be sold
        this.industryData.producedMaterials.map(material => this.cities.map(city => city.w.sellMaterial(material)));
        if (this.round <= 1) {
            await this.o.getHappy();
        }
        await Promise.all(promises); promises = [];
        if (this.round <= 1) {
            await this.o.getHappy();
        }
        // Adjust Warehouses
        if (this.round == 1 || this.round == 3 || this.c.getMaterial(this.name, this.HQ, "AI Cores").qty==0 || this.c.getMaterial(this.name, this.HQ, "Hardware").qty==0 || this.c.getMaterial(this.name, this.HQ, "Real Estate").qty==0 || this.c.getMaterial(this.name, this.HQ, "Robots").qty==0)
            await Promise.all(this.cities.map(city => city.w.FF()));
        while (this.round <= 1) {
            await this.WaitOneLoop();
        }
        // Get Employees
        let redo = false;
        if (this.getDivision.research < 2 || this.cities.map(city => city.o.size).reduce((a, b) => a > b ? b : a) < 9) {
            redo = true;
            this.cities.map(city => promises.push(city.o.Hire({ "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 })))
        } else {
            this.cities.map(city => promises.push(city.o.Hire({ "Operations": 3, "Engineer": 2, "Business": 2, "Management": 2, "Research & Development": 0 })))
        }
        // Get Upgrades
        promises.push(this.Corp.GetUpgrade("Smart Factories", Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation)));
        promises.push(this.Corp.GetUpgrade("Smart Storage", Math.ceil(10* this.ns.getBitNodeMultipliers().CorporationValuation)));
        for (let i = 1 ; i <= Math.ceil(10 * this.ns.getBitNodeMultipliers().CorporationValuation) ; i++) {
            this.cities.map(city => promises.push(city.w.upgradeLevel(i)));
        }
        if (redo) {
            while (this.getDivision.research < 2) {
                await this.WaitOneLoop();
            }
        }
        await Promise.all(promises); promises = [];
        if (this.round >= 2) {
            promises.push(this.Corp.GetUpgrade("Smart Factories", 10));
            promises.push(this.Corp.GetUpgrade("Smart Storage", 10));
            this.cities.map(city => promises.push(city.o.Hire({ "Operations": 3, "Engineer": 2, "Business": 2, "Management": 2, "Research & Development": 0 })))
            for (let i = 1 ; i <= 10 ; i++) {
                this.cities.map(city => promises.push(city.w.upgradeLevel(i)));
            }
            }
        if (this.round <= 2) {
            await this.getHappy();
            await Promise.all(promises); promises = [];
            await this.getHappy();
        }
        // Adjust Warehouses
        if (this.round == 2)
            await Promise.all(this.cities.map(city => city.w.FF()));
        while (this.round <= 2) {
            await this.WaitOneLoop();
        }
        // Upgrade Each City's Storage to 3800
        for (let i = 1 ; i <= 19 ; i++) {
            this.cities.map(city => promises.push(city.w.upgradeLevel(i)));
        }
        await Promise.all(promises); promises = [];
        this.MaintainWarehouse();
        return true;
    }
    async Product() {
        this.Research(["Hi-Tech R&D Laboratory"])
        this.Research(["Market-TA.I", "Market-TA.II"]);
        var cmdlineargs = this.ns.flags(this.settings.cmdlineflags);
        this.Pricing();
        await this.enableSmartSupply();
        let promises = [];
        // Get Employees
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
        await Promise.all(promises);
        this.MaintainWarehouse();
        for (let upgrade of ["DreamSense"]) {
            this.Corp.GetUpgrade(upgrade, 10);
        }
        await this[this.HQ].o.Hire({ "Operations": Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5), "Engineer": Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5), "Business": this.c.getOffice(this.name, this.HQ).size - 3 * Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5), "Management": Math.floor(this.c.getOffice(this.name, this.HQ).size / 3.5) });
        while (true) {
            if (this.c.getUpgradeLevelCost("Wilson Analytics") <= this.funds) {
                this.c.levelUpgrade("Wilson Analytics");
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
    async Scam() {
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
        while (this.c.getCorporation().state != "START") {
            await this.ns.asleep(0);
        }
        await Promise.all(this.cities.map(city => city.o.Hire({"Business": [3,3,9,27,81,343][this.round]})));
        this.cities.map(city => this.c.sellMaterial(this.name, city.name, outputMat[city.name], "MAX", "MP"))

        // Wait 5 rounds and then accept the offer
        for (let i = 0 ; i < 5 ; i++) {
            await this.WaitOneLoop();
        }
        this.c.acceptInvestmentOffer();
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
    async Products() {
        let currentProducts = this.getDivision.products;
        if (currentProducts.length == 0) {
            while (this.funds < 2e9) {
                await this.WaitOneLoop();
            }
            this.c.makeProduct(this.name, this.HQ, this.settings.productNames[0], 1e9, 1e9);
            this.lastProductPrice = 2e9;
        }
        while (true) {
            while (this.c.getProduct(this.name, this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                await this.WaitOneLoop();
            }
            this.cities.map(city =>
                (Object.keys(city.w.pricing).includes(this.c.getProduct(this.name, this.getDivision.products[this.getDivision.products.length - 1]))) ?
                    delete city.w.pricing[this.c.getProduct(this.name, this.getDivision.products[this.getDivision.products.length - 1])] : 0 )
            if (this.getDivision.products.length == 3 + this.c.hasResearched(this.name, "uPgrade: Capacity.I") + this.c.hasResearched(this.name, "uPgrade: Capacity.II")) {
                let qlts = [];
                for (let product of this.getDivision.products) {
                    qlts.push([this.c.getProduct(this.name, product).qlt, product]);
                }
                qlts = qlts.sort((a, b) => -a[0] + b[0]);
                while (this.funds < this.lastProduct) {
                    await this.WaitOneLoop();
                }
                try {
                    delete this.pricing[qlts[0][1]];
                } catch { }
                this.c.discontinueProduct(this.name, qlts[0][1]);
            }
            while (this.funds < this.lastProduct) {
                await this.WaitOneLoop();
            }
            this.lastProduct = this.funds * 1.1;
            let done = false;
            while (!done) {
                try {
                    this.c.makeProduct(this.name, this.HQ, this.settings.productNames.filter(x => !this.getDivision.products.includes(x))[0], Math.floor(this.funds / 2.1), Math.floor(this.funds / 2.1));
                    done = true;
                } catch {
                    await this.WaitOneLoop();
                }
            }
            await this.WaitOneLoop();
        }
    }
    async MaintainWarehouse() {
        this.cities.map(city => city.w.MaintainWarehouse);
    }
}