import { CorpBaseClass } from "CorpBaseClass.js";

class Warehouse extends CorpBaseClass {
    constructor(ns, City) {
        super(ns, City.settings);
        this.Corp = City.Corp;
        this.Division = City.Division;
        this.City = City;
        this.Optimizer = this.Division.Optimizer;
        this.pricing = {};
        this.name = this.City.name;
    }
    get size() {
        if (!this.c.hasUnlockUpgrade("Warehouse API")) {
            return null;
        }
        return this.c.getWarehouse(this.Division.name, this.name).size;
    }
    get industryData() {
        return this.Division.industryData;
    }
    async getAPI() {
        while (!this.c.hasUnlockUpgrade("Warehouse API")) {
            if (this.c.getUnlockUpgradeCost("Warehouse API") <= this.funds) {
                this.c.unlockUpgrade("Warehouse API");
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async Start() {
        await this.getAPI();
        while (!this.c.hasWarehouse(this.Division.name, this.name)) {
            if (this.c.getConstants().warehouseInitialCost <= this.funds) {
                this.c.purchaseWarehouse(this.Division.name, this.name);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async FF(mysize = -1, maintaining = false) {
        await this.getAPI();
        if (mysize == -1)
            mysize = this.size;
        mysize = Math.floor(mysize);
        if (mysize < 0)
            mysize = 0;
        let mymats = [0, 0, 0, 0, 0];
        for (let twice of [0, 1]) {
            mymats = this.Optimizer.optimize(mysize * [.50, .55, .55, .57, .57, .57][this.round]);
            while (this.c.getCorporation().state != "EXPORT") {
                await this.ns.asleep(400);
            }
            let didSomething = false;
            for (let material of ["AI Cores", "Hardware", "Real Estate", "Robots"]) {
                let matIndex = ["AI Cores", "Hardware", "Real Estate", "Robots"].indexOf(material);
                if ((!Object.keys(this.industryData).includes("producedMaterials") || !Object.keys(this.industryData.producedMaterials).includes(material)) && !maintaining) {
                    if (this.c.getMaterial(this.Division.name, this.name, material).qty >= mymats[matIndex]) {
                        this.c.buyMaterial(this.Division.name, this.name, material, 0);
                        this.c.sellMaterial(this.Division.name, this.name, material, (this.c.getMaterial(this.Division.name, this.name, material).qty - mymats[matIndex]) / 10, 0);
                        didSomething = true;
                    }
                    if (this.c.getMaterial(this.Division.name, this.name, material).qty <= mymats[matIndex]) {
                        this.c.buyMaterial(this.Division.name, this.name, material, (mymats[matIndex] - this.c.getMaterial(this.Division.name, this.name, material).qty) / 10);
                        this.c.sellMaterial(this.Division.name, this.name, material, 0, 0);
                        didSomething = true;
                    }
                }
            }
            if (!didSomething) {
                for (let material of ["AI Cores", "Hardware", "Real Estate", "Robots"]) {
                    let matIndex = ["AI Cores", "Hardware", "Real Estate", "Robots"].indexOf(material);
                    this.c.buyMaterial(this.Division.name, this.name, material, 0);
                    this.c.sellMaterial(this.Division.name, this.name, material, 0, 0);
                }
                return;
            }
            while (this.c.getCorporation().state == "EXPORT") {
                await this.ns.asleep(400);
            }
        }
    }
    async upgradeSize(size, growafterwards = false) {
        await this.getAPI();
        while (this.warehouseSize < size) {
            if (this.c.getUpgradeWarehouseCost(this.Division.name, this.name) <= this.funds) {
                this.c.upgradeWarehouse(this.Division.name, this.name, 1);
            } else {
                await this.WaitOneLoop();
            }
        }
        if (growafterwards) {
            this.FF();
        }
    }
    async upgradeLevel(level) {
        await this.getAPI();
        while (this.c.getWarehouse(this.Division.name, this.name).level < level) {
            if (this.c.getUpgradeWarehouseCost(this.Division.name, this.name) <= this.funds) {
                this.c.upgradeWarehouse(this.Division.name, this.name, 1);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async enableSmartSupply() {
        while (!this.c.hasUnlockUpgrade("Smart Supply")) {
            await this.ns.asleep(100);
            if (this.c.getUnlockUpgradeCost("Smart Supply") <= this.funds && !this.c.hasUnlockUpgrade("Smart Supply")) {
                this.c.unlockUpgrade("Smart Supply");
            }
        }
        // Enable Smart Supply
        await this.getAPI();
        this.c.setSmartSupply(this.Division.name, this.name, true);
    }
    sellMaterial(material, amount = "MAX", price = "MP") {
        this.c.sellMaterial(this.Division.name, this.name, material, amount, price);
    }
    async Pricing() {
        await this.getAPI();
        let phased = 0;
        for (let product of this.Division.getDivision.products) {
            this.c.sellProduct(this.Division.name, this.name, product, "MAX", "MP", false);
        }
        await this.WaitOneLoop();
        while (true) {
            while (this.c.getCorporation().state != "SALE") {
                await this.ns.asleep(400);
            }
            for (let product of this.Division.getDivision.products) {
                if (!this.c.hasResearched(this.Division.name, "Market-TA.II")) {
                    if (this.c.getProduct(this.Division.name, product).developmentProgress >= 100) {
                        if (!(Object.keys(this.pricing).includes(product))) {
                            this.c.sellProduct(this.Division.name, this.name, product, "MAX", "MP", false);
                            this.pricing[product] = {
                                'x_min': 1,
                                'x_max': 1,
                                'phase': 1
                            }
                        } else {
                            if (this.pricing[product].phase == 3) {
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] < this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    this.pricing[product].x_min = this.pricing[product].x_min + 1 >= 1 ? this.pricing[product].x_min + 1 : 1;
                                    this.pricing[product].x_max = this.pricing[product].x_min;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] > this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    this.pricing[product].x_min = this.pricing[product].x_min - 1 >= 1 ? this.pricing[product].x_min - 1 : 1;
                                    this.pricing[product].x_max = this.pricing[product].x_min;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][2] <= .001) {
                                    this.pricing[product].x_min /= 2;
                                    this.pricing[product].x_max *= 1.5;
                                    this.pricing[product].phase = 2;
                                }
                            }
                            if (this.pricing[product].phase == 2) {
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    this.pricing[product].x_min = (this.pricing[product].x_min + this.pricing[product].x_max) / 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] > this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    this.pricing[product].x_max = (this.pricing[product].x_min + this.pricing[product].x_max) / 2;
                                }
                                if (this.pricing[product].x_max - this.pricing[product].x_min < .5) {
                                    this.pricing[product].phase = 3;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][2] <= .001) {
                                    this.pricing[product].x_min /= 2;
                                    this.pricing[product].x_max *= 1.5;
                                    this.pricing[product].phase = 2;
                                }
                            }
                            if (this.pricing[product].phase == 1) {
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] == this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][0] == 0) {
                                        this.pricing[product].x_max *= 2;
                                    } else {
                                        this.pricing[product].x_max /= 2;
                                    }
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] < this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    this.pricing[product].x_max *= 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][1] > this.c.getProduct(this.Division.name, product).cityData[this.HQ][2]) {
                                    this.pricing[product].phase = 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[this.HQ][2] <= .001) {
                                    this.pricing[product].phase = 2;
                                }
                            }
                            this.c.sellProduct(this.Division.name, this.name, product, "MAX", (Math.floor((this.pricing[product].x_max + this.pricing[product].x_min) / 2)).toString() + "*MP", false);
                        }
                    }
                } else {
                    if (!(Object.keys(this.pricing).includes(product))) {
                        this.pricing[product] = {"phase": 4};
                    }
                    if (this.pricing[product].phase <= 4) {
                        this.pricing[product].phase = 5;
                        this.c.sellProduct(this.Division.name, this.name, product, "MAX", "MP", false);
                        this.c.setProductMarketTA1(this.Division.name, product, true);
                        this.c.setProductMarketTA2(this.Division.name, product, false);
                    } else {
                        if (this.pricing[product].phase==5) {
                            this.pricing[product].phase = 6;
                            this.c.setProductMarketTA1(this.Division.name, product, false);
                            this.c.setProductMarketTA2(this.Division.name, product, true);
                        }
                    }
                }
            }
            while (this.c.getCorporation().state == "SALE") {
                await this.ns.asleep(400);
            }
        }
    }
    async MaintainWarehouse() {
        await this.getAPI();
        let productSize = 0;
        for (let material of Object.keys(this.industryData.requiredMaterials)) {
            productSize += this.industryData.requiredMaterials[material] * this.c.getMaterialData(material).size;
        }
        while (true) {
            while (this.c.getCorporation().state != "SALE")
                await this.ns.asleep(100);
            let sizes = [0, 0, 0]; // Incoming, Outgoing, Qty
            let prod = (Object.keys(this.industryData).includes("producedMaterials") ? this.industryData.producedMaterials : [])
            for (let prodmat of prod) {
                let mysize = this.c.getMaterialData(prodmat).size;
                let myprod = this.c.getMaterial(this.Division.name, this.name, prodmat).prod;
                if (myprod < 10) {
                    myprod = 10;
                }
                sizes[1] += mysize * myprod;
                if (!["Hardware", "AI Cores", "Robots", "Real Estate"].includes(prodmat))
                    sizes[2] += mysize * this.c.getMaterial(this.Division.name, this.name, prodmat).qty;
                for (let material of Object.keys(this.industryData.requiredMaterials)) {
                    sizes[0] += myprod * this.c.getMaterialData(material).size * this.industryData.requiredMaterials[material];
                    if (!["Hardware", "AI Cores", "Robots", "Real Estate"].includes(material))
                        sizes[2] += this.c.getMaterialData(material).size * this.c.getMaterial(this.Division.name, this.name, material).qty;
                }
            }
            let products = (Object.keys(this.Division.getDivision).includes("products")) ? this.Division.getDivision.products : [];
            for (let product of products) {
                let myprod = this.c.getProduct(this.Division.name, product).cityData[this.name][1];
                if (myprod < 10) {
                    myprod = 10;
                }
                sizes[1] += productSize * myprod;
                sizes[2] += productSize * this.c.getProduct(this.Division.name, product).cityData[this.name][0];
                for (let material of Object.keys(this.industryData.requiredMaterials)) {
                    sizes[0] += myprod * this.c.getMaterialData(material).size * this.industryData.requiredMaterials[material];
                    if (!"AI Cores", ["Hardware", "Real Estate", "Robots"].includes(material))
                        sizes[2] += this.c.getMaterialData(material).size * this.c.getMaterial(this.Division.name, this.name, material).qty;
                }
            }
            let targetsize = this.c.getWarehouse(this.Division.name, this.name).size - (sizes[0] > sizes[1] ? sizes[0] : sizes[1]) - sizes[2];
            let sizecheck = this.Optimizer.optimize(targetsize / [.50, .70, .55, .57, .57, .57][this.round]);
            if (sizecheck[2] > this.c.getMaterial(this.Division.name, this.name, "Real Estate").qty) {
                await this.FF(targetsize, true);
            } else {
                if (this.c.getWarehouse(this.Division.name, this.name).sizeUse > this.c.getWarehouse(this.Division.name, this.name).size * .95) {
                    if (this.funds > this.c.getUpgradeWarehouseCost(this.Division.name, this.name)) {
                        this.c.upgradeWarehouse(this.Division.name, this.name);
                    }
                }
            }
            while (this.c.getCorporation().state == "SALE")
                await this.ns.asleep(1000);
        }
    }
    async Exporty() {
        while (!this.c.hasUnlockUpgrade("Export"))
            await this.WaitOneLoop();
        await this.getAPI();
        while (true) {
            while (this.c.getCorporation().state != "SALE") {
                await this.ns.asleep(100);
            }
            let providers = {};
            for (let material of Object.keys(this.industryData.requiredMaterials)) {
                if (!Object.keys(providers).includes(material))
                    providers[material] = this.c.getConstants().industryNames.map(x => [x, this.c.getIndustryData(x)]).filter(x => Object.keys(x[1]).includes("producedMaterials")).map(x => [x[0], x[1].producedMaterials]).filter(x => x[1].includes(material)).map(x => x[0]).flat().map(x => this.c.getCorporation().divisions.filter(y => this.c.getDivision(y).type == x)).flat();
                if (providers[material].length > 0) {
                    let needed = 0;
                    if (this.c.getIndustryData(type).producedMaterials) {
                        for (let outputmat of this.industryData.producedMaterials) {
                            needed += (this.c.getMaterial(divname, city, outputmat).prod) * this.c.getIndustryData(type).requiredMaterials[material];
                        }
                    }
                    if (this.Division.getDivision.products) {
                        for (let product of this.getDivision.products.filter(x => this.c.getProduct(this.Division.name, x).developmentProgress >= 100)) {
                            needed += (this.c.getProduct(this.Division.name, product).cityData[city][1]) * this.industryData.requiredMaterials[material];
                        }
                    }
                    try {
                        needed = [0, Math.floor(needed - this.c.getMaterial(this.Division.name, this.name, material).qty / 10 / (providers[material].length))].reduce((a, b) => a > b ? a : b);
                        for (let provider of providers[material]) {
                            if (this.c.getDivision(provider).cities.includes(this.name)) {
                                let currentExports = this.c.getMaterial(provider, this.name, material).exp.filter(x => (x.loc == this.name) && (x.div == this.Division.name));
                                currentExports.map(x => this.c.cancelExportMaterial(provider, this.name, this.Division.name, this.name, material, x.amt));
                                if (needed > 0) {
                                    this.c.exportMaterial(provider, this.name, this.Division.name, this.name, material, needed);
                                }
                            }
                        }
                    } catch { }
                }
            }
            while (this.c.getCorporation().state == "SALE") {
                await this.ns.asleep(100);
            }
        }
    }
}