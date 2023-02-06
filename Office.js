import { CorpBaseClass } from "CorpBaseClass.js";

class Office extends CorpBaseClass {
    constructor(ns, City) {
        super(ns, City.settings);
        this.Corp = City.Corp;
        this.Division = City.Division;
        this.City = City;
    }
    get size() {
        return this.c.getOffice(this.Division.name, this.name);
    }
    get industryData() {
        return this.Division.industryData;
    }
    async Start() {
        await this.o.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })
        this.coffeeparty();
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
}