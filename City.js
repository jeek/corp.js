import { CorpBaseClass } from "CorpBaseClass.js";

class City extends CorpBaseClass {
    constructor(ns, Corp, Division, CityName, settings={}) {
        super(ns, settings);
        this.name = CityName;
        this.Corp = Corp;
        this.Division = Division;
        if (Object.keys(this.settings).includes(CityName)) {
            for (let objKey of Object.keys(this.settings[CityName])) {
                this.settings[objKey] = this.settings[CityName][objKey];
            }
        }
        for (let cityIt of this.Cities) {
            if (Object.keys(this.settings).includes(cityIt)) {
                delete this.settings[cityIt];
            }
        }
        this.pricing = {};
        if (!Object.keys(settings).includes("minEnergy")) {
            this.settings['minEnergy'] = 98;
        }
        if (!Object.keys(settings).includes("minHappy")) {
            this.settings['minHappy'] = 98;
        }
        if (!Object.keys(settings).includes("minMorale")) {
            this.settings['minMorale'] = 98;
        }
        this.mults = ["aiCoreFactor", "hardwareFactor", "realEstateFactor", "robotFactor"].map(factor => Object.keys(this.c.getIndustryData(this.Division.industry)).includes(factor) ? this.c.getIndustryData(this.Division.industry)[factor] : 0);
    }
    get getOffice() {
        return this.c.getOffice(this.Division.name, this.name);
    }
    get officeSize() {
        return this.getOffice.size;
    }
    get industryData() {
        return this.Division.industryData;
    }
    get getWarehouse() {
        return this.c.getWarehouse(this.Division.name, this.name);
    }
    get warehouseSize() {
        return this.getWarehouse.size;
    }
    calc(ai = 0, hw = 0, re = 0, rob = 0) {
        return (((.002 * ai + 1) ** this.mults[0]) * ((.002 * hw + 1) ** this.mults[1]) * ((.002 * re + 1) ** this.mults[2]) * ((.002 * rob + 1) ** this.mults[3])) ** .73
    }
    optimizerr(size) {
        if (size == 0) {
            return [0, 0, 0];
        }
        let searchmin = 0;
        let searchmax = size;
        let divs = (searchmax - searchmin) * .1;
        let scores = [[this.calc(0, 0, 0, size / .5), 0, size]];
        while (divs > .00005 && searchmin < searchmax) {
            let i = searchmin;
            while (i <= searchmax + divs) {
                if (i <= size && i >= 0) {
                    scores = scores.concat([[this.calc(0, 0, i / .005, (size - i) / .5), i, size - i]]);
                }
                i += divs;
            }
            scores = scores.sort((a, b) => { return a[0] - b[0]; });
            searchmin = scores[scores.length - 1][0] - divs;
            searchmax = scores[scores.length - 1][0] + divs;
            divs *= .1;
        }
        return [scores[scores.length - 1][0], scores[scores.length - 1][1], size - scores[scores.length - 1][1]];
    }
    optimizeah(size) {
        if (size == 0) {
            return [0, 0, 0];
        }
        let searchmin = 0;
        let searchmax = size;
        let divs = (searchmax - searchmin) * .1;
        let scores = [[this.calc(0, size / .06, 0, 0), 0, size]];
        while (divs > .00005 && searchmin < searchmax) {
            let i = searchmin;
            while (i <= searchmax + divs) {
                if (i <= size && i >= 0) {
                    scores = scores.concat([[this.calc(i / .1, (size - i) / .06, 0, 0), i, size - i]]);
                }
                i += divs;
            }
            scores = scores.sort((a, b) => { return a[0] - b[0]; });
            searchmin = scores[scores.length - 1][0] - divs;
            searchmax = scores[scores.length - 1][0] + divs;
            divs *= .1;
        }
        return [scores[scores.length - 1][0], scores[scores.length - 1][1], size - scores[scores.length - 1][1]];
    }
    optimize(size) {
        if (size == 0) {
            return [0, 0, 0, 0, 0];
        }
        let searchmin = 0;
        let searchmax = size;
        let divs = (searchmax - searchmin) * .1;
        let scores = [[0, 0, 0, 0, 0, 0, 0, 0]];
        while (divs > .00005 && searchmin < searchmax) {
            let i = searchmin;
            while (divs > .00005 && i <= searchmax + divs) {
                if (i <= size && i >= 0) {
                    let rr = this.optimizerr(i);
                    let ah = this.optimizeah(size - i);
                    scores = scores.concat([[ah[0] * rr[0], i, size - i, ah[1] / .1, ah[2] / .06, rr[1] / .005, rr[2] / .5]]);
                }
                i += divs;
            }
            scores.sort((a, b) => { return a[0] - b[0]; });
            searchmin = scores[scores.length - 1][1] - divs;
            searchmax = scores[scores.length - 1][1] + divs;
            divs *= .1;
        }
        let finalcheck = [[Math.floor(scores[scores.length - 1][3]), Math.floor(scores[scores.length - 1][4]), Math.floor(scores[scores.length - 1][5]), Math.floor(scores[scores.length - 1][6])]];
        for (let ai = finalcheck[0][0]; ai <= finalcheck[0][0] + 20 && ai * .1 <= size; ai++) {
            for (let hw = finalcheck[0][1]; hw <= finalcheck[0][1] + 32 && ai * .1 + hw * .06 <= size; hw++) {
                for (let re = finalcheck[0][2]; re <= finalcheck[0][2] + 100 && ai * .1 + hw * .06 + re * .005 <= size; re++) {
                    for (let rob = finalcheck[0][3]; rob <= finalcheck[0][3] + 4 && ai * .1 + hw * .06 + re * .005 + rob * .5 <= size; rob++) {
                        finalcheck.push([ai, hw, re, rob]);
                    }
                }
            }
        }
        finalcheck = finalcheck.filter(x => x[0] * .1 + x[1] * .06 + x[2] * .005 + x[3] * .5 <= size);
        finalcheck = finalcheck.sort((a, b) => this.calc(a[0], a[1], a[2], a[3]) - this.calc(b[0], b[1], b[2], b[3]));
        finalcheck[finalcheck.length - 1].push(6 * this.calc(finalcheck[finalcheck.length - 1][0], finalcheck[finalcheck.length - 1][1], finalcheck[finalcheck.length - 1][2], finalcheck[finalcheck.length - 1][3]));
        return finalcheck[finalcheck.length - 1];
    }
    async Start() {
        while (!this.Division.getDivision.cities.includes(this.name)) {
            await this.ns.asleep(100);
            try {
                this.c.expandCity(this.Division.name, this.name);
            } catch { }
        }
        await this.getWarehouseAPI();
        await this.getOfficeAPI();
        await this.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })
        this.coffeeparty();
    }
    async getWarehouseAPI() {
        while (!this.c.hasUnlockUpgrade("Warehouse API")) {
            if (this.c.getUnlockUpgradeCost("Warehouse API") <= this.funds) {
                this.c.unlockUpgrade("Warehouse API");
            } else {
                await this.WaitOneLoop();
            }
        }
        while (!this.c.hasWarehouse(this.Division.name, this.name)) {
            if (this.c.getConstants().warehouseInitialCost <= this.funds) {
                this.c.purchaseWarehouse(this.Division.name, this.name);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async getOfficeAPI() {
        while (!this.c.hasUnlockUpgrade("Office API")) {
            if (this.c.getUnlockUpgradeCost("Office API") <= this.funds) {
                this.c.unlockUpgrade("Office API");
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async warehouseFF(mysize = -1, maintaining = false) {
        if (mysize == -1)
            mysize = this.warehouseSize;
        mysize = Math.floor(mysize);
        if (mysize < 0)
            mysize = 0;
        let mymats = [0, 0, 0, 0, 0];
        for (let twice of [0, 1]) {
            mymats = this.optimize(mysize * [.50, .55, .55, .57, .57, .57][this.round]);
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
    async upgradeWarehouseSize(size, growafterwards = false) {
        await this.getWarehouseAPI();
        while (this.warehouseSize < size) {
            if (this.c.getUpgradeWarehouseCost(this.Division.name, this.name) <= this.funds) {
                this.c.upgradeWarehouse(this.Division.name, this.name, 1);
            } else {
                await this.WaitOneLoop();
            }
        }
        if (growafterwards) {
            this.warehouseFF();
        }
    }
    async upgradeWarehouseLevel(level) {
        await this.getWarehouseAPI();
        while (this.getWarehouse.level < level) {
            if (this.c.getUpgradeWarehouseCost(this.Division.name, this.name) <= this.funds) {
                this.c.upgradeWarehouse(this.Division.name, this.name, 1);
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async Hire(roles) {
        await this.getOfficeAPI();
        for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
            if (!Object.keys(roles).includes(job)) {
                roles[job] = 0;
            }
        }
        let total = Object.values(roles).reduce((a, b) => a + b, 0);
        await this.getOfficeAPI();
        while (this.getOffice.size < total) {
            if (this.c.getOfficeSizeUpgradeCost(this.Division.name, this.name, 3) <= this.funds) {
                this.c.upgradeOfficeSize(this.Division.name, this.name, 3);
            } else {
                await this.WaitOneLoop();
            }
            for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
                while (this.getOffice.employees < this.getOffice.size && (this.getOffice.employeeJobs[job] < roles[job])) {
                    this.c.hireEmployee(this.Division.name, this.name, job);
                }
            }
        }
        while (this.getOffice.employees < this.getOffice.size) {
            this.c.hireEmployee(this.Division.name, this.name, "Unassigned");
        }
        let good = true;
        for (let job of Object.keys(roles)) {
            if (this.getOffice.employeeJobs[job] < roles[job]) {
                try {
                    if (this.c.setAutoJobAssignment(this.Division.name, this.name, job, roles[job])) {
                    } else {
                        good = false;
                    }
                } catch {
                    good = false;
                }
            }
        }
        if (!good) {
            await this.WaitOneLoop();
            for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
                this.c.setAutoJobAssignment(this.Division.name, this.name, job, 0);
            }
            await this.WaitOneLoop();
            for (let job of Object.keys(roles)) {
                if (this.getOffice.employeeJobs[job] < roles[job]) {
                    try {
                        if (this.c.setAutoJobAssignment(this.Division.name, this.name, job, roles[job])) {
                        } else {
                            good = false;
                        }
                    } catch {
                        good = false;
                    }
                }
            }
        }
    }
    async getHappy() {
        while (true) {
            let happy = true;
            if (this.getOffice.avgEne < this.settings.minEnergy) {
                happy = false;
            }
            if (this.getOffice.avgHap < this.settings.minHappy) {
                happy = false;
            }
            if (this.getOffice.avgMor < this.settings.minMorale) {
                happy = false;
            }
            if (happy) {
                return;
            }
            await this.WaitOneLoop();
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
        this.c.setSmartSupply(this.Division.name, this.name, true);
    }
    sellMaterial(material, amount = "MAX", price = "MP") {
        this.c.sellMaterial(this.Division.name, this.name, material, amount, price);
    }
    async Pricing() {
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
                    if (phased == 0) {
                        phased = 1;
                        this.c.sellProduct(this.Division.name, this.name, product, "MAX", "MP", false);
                        this.c.setProductMarketTA1(this.Division.name, product, true);
                        this.c.setProductMarketTA2(this.Division.name, product, false);
                    } else {
                        if (phased == 1) {
                            phased = 2;
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
            let sizecheck = this.optimize(targetsize / [.50, .70, .55, .57, .57, .57][this.round]);
            if (sizecheck[2] > this.c.getMaterial(this.Division.name, this.name, "Real Estate").qty) {
                await this.warehouseFF(targetsize, true);
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
    async coffeeparty() {
        while (true) {
            while (this.c.getCorporation().state != "START") {
                await this.ns.asleep(400);
            }
            if (this.getOffice.employees > 0) {
                if (this.getOffice.avgEne < this.settings.minEnergy && this.getOffice.employees * this.c.getConstants().coffeeCostPerEmployee < this.funds) {
                    this.c.buyCoffee(this.Division.name, this.name);
                }
                if ((this.getOffice.avgHap < this.settings.minHappy || this.getOffice.avgMor < this.settings.minMorale) && this.getOffice.employees * this.c.getConstants().coffeeCostPerEmployee < this.funds) {
                    this.c.throwParty(this.Division.name, this.name, this.c.getConstants().coffeeCostPerEmployee);
                }
            }
            while (this.c.getCorporation().state == "START") {
                await this.ns.asleep(400);
            }
        }
    }
    async Exporty() {
        while (!this.c.hasUnlockUpgrade("Export"))
            await this.WaitOneLoop();
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