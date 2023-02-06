import { CorpBaseClass } from "CorpBaseClass.js";

class Office extends CorpBaseClass {
    constructor(ns, City) {
        super(ns, City.settings);
        this.Corp = City.Corp;
        this.Division = City.Division;
        this.City = City;
        this.name = this.City.name;
    }
    get size() {
        return this.c.getOffice(this.Division.name, this.name).size;
    }
    get size() {
        return this.c.getOffice(this.Division.name, this.name).employees;
    }
    get industryData() {
        return this.Division.industryData;
    }
    get getOffice() {
        return this.c.getOffice(this.Division.name, this.name);
    }
    async Start() {
        await this.getAPI();
        if (this.size == 3 && this.c.getOffice(this.Division.name, this.name).employeeJobs["Unassigned"] == 3)
            await this.Hire({ "Operations": 1, "Engineer": 1, "Business": 1 })
        this.coffeeparty();
    }
    async getAPI() {
        while (!this.c.hasUnlockUpgrade("Office API")) {
            if (this.c.getUnlockUpgradeCost("Office API") <= this.funds) {
                this.c.unlockUpgrade("Office API");
            } else {
                await this.WaitOneLoop();
            }
        }
    }
    async Hire(roles) {
        for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]) {
            if (!Object.keys(roles).includes(job)) {
                roles[job] = 0;
            }
        }
        let total = Object.values(roles).reduce((a, b) => a + b, 0);
        await this.getAPI();
        while (this.size < total) {
            if (this.c.getOfficeSizeUpgradeCost(this.Division.name, this.name, 3) <= this.funds) {
                this.c.upgradeOfficeSize(this.Division.name, this.name, 3);
            } else {
                await this.WaitOneLoop();
            }
            for (let job of ["Operations", "Engineer", "Management", "Business", "Research & Development"]
                .sort((a, b) => -this.c.getOffice(this.Division.name, this.name).employeejobs[a] + roles[a] + this.c.getOffice(this.Division.name, this.name).employeejobs[b] - roles[b])
            ) {
                while (this.employees < this.size && (this.getOffice.employeeJobs[job] < roles[job])) {
                    this.c.hireEmployee(this.Division.name, this.name, job);
                }
            }
        }
        while (this.employees < this.size) {
            this.c.hireEmployee(this.Division.name, this.name, "Unassigned");
        }
        let good = true;
        for (let job of Object.keys(roles)
            .sort((a, b) => -this.c.getOffice(this.Division.name, this.name).employeejobs[a] + roles[a] + this.c.getOffice(this.Division.name, this.name).employeejobs[b] - roles[b])
        ) {
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
        await this.getAPI();
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
        await this.getAPI();
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