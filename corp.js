// Tunables
let minHappy = 98;
let minEnergy = 98;
let minMorale = 98;
let baseOffers = [210e9, 5e15, 800e15, 500e18];
let divisionNames = {
    "Agriculture": "Jeek Heavier Industries",
    "Chemical": "Based Acidics",
    "Computer Hardware": "JeekCom",
    "Energy": "JeekElec",
    "Fishing": "Smells Like Fish",
    "Food": "Jeek Heaviest Industries",
    "Healthcare": "Ambulance Chasees",
    "Mining": "Going Deeper",
    "Pharmaceutical": "Drugs",
    "Real Estate": "Land Ho",
    "Robotics": "Roku's Basilisks",
    "Software": "BitIgniters",
    "Tobacco": "Pole Smokers",
    "Water Utilities": "Wet Ones"
}
let productNames = {
    "Tobacco": ["Tobacco Classic", "New Tobacco", "Diet Tobacco", "Cherry Tobacco", "Tobacco Zero"],
    "Food": ["Colon Blow", "Rectal Delight", "Fecalicious", "Poop Pastries", "All You Can Yeet Buffet"],
    "Pharmaceutical": ["Cocaine", "Weed", "Acid", "Fent", "Molly"],
    "Software": ["A", "B", "C", "D", "E"],
    "Real Estate": ["A", "B", "C", "D", "E"]
}
let HQ = "Sector-12";

// Constants
const cmdlineflags = [
    ["jakobag", false] // Use Jakob's round 1 agriculture method
]

class City {
    constructor(ns, Corp, Division, CityName) {
        this.ns = ns;
        this.c = this.ns.corporation;
        this.name = CityName;
        this.Corp = Corp;
        this.Division = Division;
        this.pricing = {};
        this.mults = ["aiCoreFactor","hardwareFactor","realEstateFactor","robotFactor"].map(factor => Object.keys(this.c.getIndustryData(this.Division.industry)).includes(factor) ? this.c.getIndustryData(this.Division.industry)['factor'] : 0)
    }
    get funds() {
        return this.c.getCorporation().funds;
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
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
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
        for (let ai = finalcheck[0][0]; ai <= finalcheck[0][0] + 20 && ai*.1<=size; ai++) {
            for (let hw = finalcheck[0][1]; hw <= finalcheck[0][1] + 32 && ai*.1+hw*.06<=size; hw++) {
                for (let re = finalcheck[0][2]; re <= finalcheck[0][2] + 100 && ai*.1+hw*.06+re*.005<=size; re++) {
                    for (let rob = finalcheck[0][3]; rob <= finalcheck[0][3] + 4 && ai*.1+hw*.06+re*.005+rob*.5<=size; rob++) {
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
    async warehouseFF(mysize = -1) {
        if (mysize == -1)
            mysize = this.warehouseSize;
        mysize = Math.floor(mysize);
        if (mysize < 0)
            mysize = 0;
        let mymats = [0, 0, 0, 0, 0];
        for (let twice of [0, 1]) {
            mymats = this.optimize(mysize * [.50, .70, .55, .57, .57, .57][this.round]);
            while (this.c.getCorporation().state != "EXPORT") {
                await this.ns.asleep(400);
            }
            let didSomething = false;
            for (let material of ["AI Cores", "Hardware", "Real Estate", "Robots"]) {
                let matIndex = ["AI Cores", "Hardware", "Real Estate", "Robots"].indexOf(material);
                if (!Object.keys(this.industryData).includes("producedMaterials") || !Object.keys(this.industryData.producedMaterials).includes(material)) {
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
    async Hire(roles) {
        for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
            if (!Object.keys(roles).includes(job)) {
                roles[job] = 0;
            }
        }
        let operations = Object.keys(roles).includes("Operations") ? roles["Operations"] : 0;
        let engineer = Object.keys(roles).includes("Engineer") ? roles["Engineer"] : 0;
        let rnd = Object.keys(roles).includes("Research & Development") ? roles["Research & Development"] : 0;
        let management = Object.keys(roles).includes("Management") ? roles["Management"] : 0;
        let business = Object.keys(roles).includes("Business") ? roles["Business"] : 0;
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
    async getHappy() {
        while (true) {
            let happy = true;
            if (this.getOffice.avgEne < minEnergy) {
                happy = false;
            }
            if (this.getOffice.avgHap < minHappy) {
                happy = false;
            }
            if (this.getOffice.avgMor < minMorale) {
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
            try {
                this.c.unlockUpgrade("Smart Supply");
            } catch { }
        }
        // Enable Smart Supply
        this.c.setSmartSupply(this.Division.name, this.name, true);
    }
    sellMaterial(material, amount = "MAX", price = "MP") {
        this.c.sellMaterial(this.Division.name, this.name, material, amount, price);
    }
    async Pricing() {
        let phased = 0;
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
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_min = this.pricing[product].x_min + 1 >= 1 ? this.pricing[product].x_min + 1 : 1;
                                    this.pricing[product].x_max = this.pricing[product].x_min;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] > this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_min = this.pricing[product].x_min - 1 >= 1 ? this.pricing[product].x_min - 1 : 1;
                                    this.pricing[product].x_max = this.pricing[product].x_min;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][2] <= .001) {
                                    this.pricing[product].x_min /= 2;
                                    this.pricing[product].x_max *= 1.5;
                                    this.pricing[product].phase = 2;
                                }
                            }
                            if (this.pricing[product].phase == 2) {
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_min = (this.pricing[product].x_min + this.pricing[product].x_max) / 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] > this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_max = (this.pricing[product].x_min + this.pricing[product].x_max) / 2;
                                }
                                if (this.pricing[product].x_max - this.pricing[product].x_min < .5) {
                                    this.pricing[product].phase = 3;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][2] <= .001) {
                                    this.pricing[product].x_min /= 2;
                                    this.pricing[product].x_max *= 1.5;
                                    this.pricing[product].phase = 2;
                                }
                            }
                            if (this.pricing[product].phase == 1) {
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] <= this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].x_max *= 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][1] > this.c.getProduct(this.Division.name, product).cityData[HQ][2]) {
                                    this.pricing[product].phase = 2;
                                }
                                if (this.c.getProduct(this.Division.name, product).cityData[HQ][2] <= .001) {
                                    this.pricing[product].phase = 2;
                                }
                            }
// try {
                                this.c.sellProduct(this.Division.name, this.name, product, "MAX", (Math.floor((this.pricing[product].x_max + this.pricing[product].x_min) / 2)).toString() + "*MP", false);
//                            } catch { }
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
    async WaitOneLoop() {
        await this.Corp.WaitOneLoop();
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
                    if (!["Hardware", "AI Cores", "Robots", "Real Estate"].includes(material))
                        sizes[2] += this.c.getMaterialData(material).size * this.c.getMaterial(this.Division.name, this.name, material).qty;
                }
            }
            let targetsize = this.c.getWarehouse(this.Division.name, this.name).size - (sizes[0] > sizes[1] ? sizes[0] : sizes[1]) * 1.1 - sizes[2];
            let sizecheck = this.optimize(targetsize / [.50, .70, .55, .57, .57, .57][this.round]);
            if (sizecheck[0] > this.c.getMaterial(this.Division.name, this.name, "AI Cores").qty) {
                await this.warehouseFF(targetsize);
            } else {
                if (this.funds > this.c.getUpgradeWarehouseCost(this.Division.name, this.name)) {
                    this.c.upgradeWarehouse(this.Division.name, this.name);
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
                if (this.getOffice.avgEne < minEnergy) {
                    try {
                        this.c.buyCoffee(this.Division.name, this.name);
                    } catch { }
                }
                if (this.getOffice.avgHap < minHappy ||
                    this.getOffice.avgMor < minMorale) {
                    try {
                        this.c.throwParty(this.Division.name, this.name, this.c.getConstants().coffeeCostPerEmployee);
                    } catch { }
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

class Division {
    constructor(ns, Corp, industry, settings = {}) {
        this.ns = ns;
        this.c = this.ns.corporation;
        this.Corp = Corp;
        this.industry = industry;
        this.settings = settings;
        this.citiesObj = {};
    }
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
    }
    get name() {
        return this.c.getCorporation().divisions.map(div => [div, this.c.getDivision(div).type]).filter(x => x[1] == this.industry)[0][0];
    }
    get funds() {
        return this.c.getCorporation().funds;
    }
    get Cities() {
        return Object.values(this.ns.enums.CityName);
    }
    get cities() {
        return Object.values(this.citiesObj);
    }
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
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
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
    }
    async Start() {
        while (this.c.getCorporation().divisions.map(div => [div, this.c.getDivision(div).type]).filter(x => x[1] == this.industry).length == 0) {
            //            try {
            this.c.expandIndustry(this.industry, Object.keys(this.settings).includes("name") ? this.settings["name"] : Object.keys(divisionNames).includes(this.industry) ? divisionNames[this.industry] : this.industry);
            //            } catch {
            //               for (let i = 0; i < 6; i++)
            await this.WaitOneLoop();
            //         }
        }
        this.Cities.map(city => this.citiesObj[city] = new City(this.ns, this.Corp, this, city));
        await Promise.all(this.cities.map(city => city.Start()));
        this.HQ = this.citiesObj[HQ];
        switch (this.industry) {
            case 'Agriculture':
            case 'Chemical':
            case 'Energy':
            case 'Fishing':
            case 'Mining':
            case 'Water Utilities':
                this.Simple();
                break;
            case 'Food':
            case 'Healthcare':
            case 'Tobacco':
                this.Product();
                break;
            case 'Computer Hardware':
            case 'Pharmaceutical':
            case 'Real Estate':
            case 'Robotics':
            case 'Software':
                this.Simple().then(this.Product());
                break;
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
        let promises = this.cities.map(city => city.getHappy());
        await Promise.all(promises);
    }
    async Simple() {
        var cmdlineargs = this.ns.flags(cmdlineflags);
        while (!(this.c.getCorporation().divisions.map(x => this.c.getDivision(x)).map(x => x.type).includes(this.industry))) {
            try {
                await this.WaitOneLoop();
            } catch {
                for (let i = 0; i < 6; i++)
                    await this.WaitOneLoop();
            }
        }
        this.Research(["Hi-Tech R&D Laboratory"]).then(this.Research(["Market-TA.I", "Market-TA.II"]));
        this.Pricing();
        await Promise.all(this.cities.map(city => city.enableSmartSupply()));
        let promises = [];
        // Get Employees
        this.cities.map(city => promises.push(city.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })));
        // Buy 1 advert
        promises.push(this.Advert(cmdlineargs['jakobag'] ? 2 : 1));
        if (cmdlineargs['jakobag']) {
            await this.Corp.GetUpgrade("Smart Storage", 3);
        }
        // Upgrade Each City's Storage to 300
        this.cities.map(city => promises.push(city.upgradeWarehouseSize(cmdlineargs['jakobag'] ? 650 : 300)));
        // Set produced materials to be sold
        this.industryData.producedMaterials.map(material => this.cities.map(city => city.sellMaterial(material)));
        if (!cmdlineargs['jakobag']) {
            for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants", "Smart Factories"]) {
                promises.push(this.GetUpgrade(upgrade, 2));
            }
        }
        if (this.round <= 1) {
            await this.getHappy();
        }
        await Promise.all(promises); promises = [];
        if (this.round <= 1) {
            await this.getHappy();
        }
        // Adjust Warehouses
//        if (this.round == 1 || round == 3)
        await Promise.all(this.cities.map(city => city.warehouseFF()));
        while (this.round <= 1) {
            await this.WaitOneLoop();
        }
        // Get Employees
        let redo = false;
        if (this.getDivision.research < 2 || this.cities.map(city => city.getOffice.size).reduce((a, b) => a > b ? b : a) < 9) {
            redo = true;
            this.cities.map(city => promises.push(city.Hire({ "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 })))
        }
        // Get Upgrades
        await this.Corp.GetUpgrade("Smart Factories", 10);
        await this.Corp.GetUpgrade("Smart Storage", 10);
        for (let i = 100; i <= 2000; i += 100) {
            await Promise.all(this.cities.map(city => city.upgradeWarehouseSize(i)));
        }
        if (redo) {
            while (this.getDivision.research < 2) {
                await this.WaitOneLoop();
            }
        }
        await Promise.all(promises); promises = [];
        if (this.round >= 2) {
            this.cities.map(city => promises.push(city.Hire({ "Operations": 3, "Engineer": 2, "Business": 2, "Management": 2, "Research & Development": 0 })))
        }
        if (this.round <= 2) {
            await this.getHappy();
            await Promise.all(promises); promises = [];
            await this.getHappy();
        }
        // Adjust Warehouses
        if (this.round == 2)
            await Promise.all(this.cities.map(city => city.warehouseFF()));
        while (this.round <= 2) {
            await this.WaitOneLoop();
        }
        // Upgrade Each City's Storage to 3800
        for (let i = 100; i <= 3800; i += 100) {
            await Promise.all(this.cities.map(city => city.upgradeWarehouseSize(i)));
        }
        await Promise.all(promises); promises = [];
        this.cities.map(city => city.MaintainWarehouse());
        return true;
    }
    async Product() {
        this.Research(["Hi-Tech R&D Laboratory"]).then(this.Research(["Market-TA.I", "Market-TA.II"]));
        var cmdlineargs = this.ns.flags(cmdlineflags);
        this.Pricing();
        await this.enableSmartSupply();
        let promises = [];
        // Get Employees
        this.cities.map(city => promises.push(city.Hire(city.name == HQ ? { "Operations": 8, "Engineer": 9, "Business": 5, "Management": 8 } : { "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": 5 })));
        // Buy 1 advert
        promises.push(this.Advert(cmdlineargs['jakobag'] ? 2 : 1));
        await Promise.all(promises);
        promises = [];
        this.Products();
        for (let upgrade of ["DreamSense"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, 10));
        }
        for (let upgrade of ["FocusWires", "Neural Accelerators", "Speech Processor Implants", "Nuoptimal Nootropic Injector Implants"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, 20));
        }
        for (let upgrade of ["Project Insight"]) {
            promises.push(this.Corp.GetUpgrade(upgrade, 10));
        }
        while (this.getDivision.products.length == 0) {
            await this.WaitOneLoop();
        }
        this.MaintainWarehouse();
        while (true) {
            if (this.c.getUpgradeLevelCost("Wilson Analytics") <= this.funds) {
                this.c.levelUpgrade("Wilson Analytics");
            } else {
                if (this.c.getOfficeSizeUpgradeCost(this.name, HQ, 15) <= this.funds) {
                    let size = this.c.getOffice(this.name, HQ).size + 15;
                    let main = Math.floor(size / 3.5);
                    let bus = size - 3 * main;
                    await this.HQ.Hire({ "Operations": main, "Engineer": main, "Business": bus, "Management": main });
                }
                else {
                    if (this.c.getUpgradeLevel("Wilson Analytics") >= 10 && this.c.getHireAdVertCost(this.name) <= this.funds && this.getDivision.awareness + this.getDivision.popularity < 1e300) {
                        this.c.hireAdVert(this.name);
                    } else {
                        let didSomething = this.cities.map(city => city.officeSize + 60 < this.HQ.officeSize);
                        for (let city of this.getDivision.cities) {
                            if (this.c.getOffice(this.name, city).size + 60 < this.HQ.size) {
                                if (this.c.getOfficeSizeUpgradeCost(this.name, city, 3) <= this.funds) {
                                    await this[city].Hire({ "Operations": 1, "Engineer": 1, "Business": 1, "Management": 1, "Research & Development": this.c.getOffice(this.name, city).size - 1 });
                                    didSomething = true;
                                }
                            }
                        }
                        if (!didSomething) {
                            for (let upgrade of this.c.getConstants().upgradeNames) {
                                if (this.c.getUpgradeLevelCost(upgrade) * 100 < this.funds && (this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress >= 100) {
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
    get getDivision() {
        return this.c.getDivision(this.name);
    }
    async Pricing() {
        this.cities.map(city => city.Pricing());
    }
    async enableSmartSupply() {
        await Promise.all(this.cities.map(city => city.enableSmartSupply()));
    }
    async WaitOneLoop() {
        await this.Corp.WaitOneLoop();
    }
    async Research(queue) {
        while (queue.map(x => this.c.hasResearched(this.name, x)).reduce((a, b) => a && b) == false) {
            let cost = queue.filter(x => !this.c.hasResearched(this.name, x)).map(x => this.c.getResearchCost(this.name, x)).reduce((a, b) => a + b, 0) * 2;
            if (this.c.getDivision.research >= cost) {
                for (let item of queue) {
                    try {
                        this.c.research(this.name, item);
                    } catch { }
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
            this.c.makeProduct(this.name, HQ, productNames[this.industry][0], 1e9, 1e9);
            this.lastProductPrice = 2e9;
        }
        while (true) {
            while (this.c.getProduct(this.name, this.getDivision.products[this.getDivision.products.length - 1]).developmentProgress < 100) {
                await this.WaitOneLoop();
            }
            if (this.getDivision.products.length == 3 + this.c.hasResearched(this.name, "uPgrade: Capacity.I") + this.c.hasResearched(this.name, "uPgrade: Capacity.II")) {
                let qlts = [];
                for (let product of this.c.getDivision.products) {
                    qlts.push([this.c.getProduct(this.name, product).qlt, product]);
                }
                qlts = qlts.sort((a, b) => -a[0] + b[0]);
                while (this.funds < this.lastProduct[type]) {
                    await this.WaitOneLoop();
                }
                delete this.pricing[qlts[0][1]];
                this.c.discontinueProduct(this.name, qlts[0][1]);
            }
            while (this.funds < this.lastProduct) {
                await this.WaitOneLoop();
            }
            this.lastProduct = this.funds * 1.1;
            let done = false;
            while (!done) {
                try {
                    this.c.makeProduct(this.name, HQ, productNames[this.industry].filter(x => !this.getDivision.products.includes(x))[0], Math.floor(this.funds / 2.1), Math.floor(this.funds / 2.1));
                    done = true;
                } catch {
                    await this.WaitOneLoop();
                }
            }
            await this.WaitOneLoop();
        }
    }
    async MaintainWarehouse() {
        this.cities.map(city => city.MaintainWarehouse);
    }
}

export class Corporation {
    constructor(ns, settings = {}) {
        this.ns = ns;
        this.settings = settings;
        this.c = this.ns.corporation;
        this.started = false;
        this.divisionsObj = {}
    }
    get round() {
        if (this.c.getCorporation().public)
            return 5;
        return this.c.getInvestmentOffer().round;
    }
    get funds() {
        return this.c.getCorporation().funds;
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
        this.divisionsObj = {};
        this.c.getCorporation().divisions.map(divname => Object({ "name": divname, "type": this.c.getDivision(divname).type })).map(x => this.divisionsObj[x.type] = new Division(this.ns, this, x.type, x.name))
        Object.values(this.divisionsObj).map(x => x.Start());
        this.started = true;
        this.ns.toast("Corporation started.");
        this.Continue();
    }
    async Continue() {
        for (let i = 1; i <= 4; i++) {
            while (this.round == i && this.c.getInvestmentOffer().funds < (Object.keys(this.settings).includes("baseOffers") ? this.settings['baseOffers'][i - 1] : baseOffers[i - 1]) * this.ns.getBitNodeMultipliers().CorporationValuation) {
                await this.WaitOneLoop();
            }
            if (this.round == i) {
                this.c.acceptInvestmentOffer();
            }
        }
        if (!this.c.getCorporation().public)
            this.c.goPublic(0);
        this.c.issueDividends(1);
        while (this.funds < 1e21)
            await this.WaitOneLoop();
        this.c.getConstants().unlockNames.map(unlock => this.c.hasUnlockUpgrade(unlock) ? true : this.c.unlockUpgrade(unlock));
    }
    async StartDivision(industry, settings = {}) {
        if (!Object.keys(this.divisionsObj).includes(industry)) {
            this.divisionsObj[industry] = new Division(this.ns, this, industry, settings);
            this.divisionsObj[industry].Start();
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
    async WaitOneLoop() {
        let state = this.c.getCorporation().state;
        while (this.c.getCorporation().state == state) {
            await this.ns.asleep(this.c.getBonusTime() > 0 ? 100 : 200);
        }
        while (this.c.getCorporation().state != state) {
            await this.ns.asleep(this.c.getBonusTime() > 0 ? 200 : 2000);
        }
    }
}

export async function main(ns) {
    let Corp = new Corporation(ns, { "name": "jeek Heavy Industries" });
    Corp.Start();
    await ns.asleep(1000);
    while (Corp.started == false) {
        ns.toast("Corporation not started yet.")
        await ns.asleep(60000);
    }
    Corp.StartDivision("Agriculture", { "name": "jeek Heavier Industries" });
    while (Corp.round < 3) {
        await ns.asleep(10000);
    }
    Corp.StartDivision("Tobacco", { "name": "jeek Heaviest Industries" });
    while (true) {
        await ns.asleep(10000);
    }
}