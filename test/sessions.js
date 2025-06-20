const { expect } = require('chai');
const { deploy } = require("./lib/deploy");
const { getEventArguments } = require("../utils/utils");
const { ethers } = require('hardhat');

describe("Sessions", function() {
    before(async function() {
        const accounts = await ethers.getSigners();
        this.owner = accounts[0];
        this.simpleUser = accounts[1];
        this.adminUser = accounts[2];
        this.ocppProxy = accounts[3];

        this.contracts = await deploy({
            User: true,
            Balance: true,
            Location: true,
            LocationSearch: true,
            EVSE: true,
            Connector: true,
            Tariff: true,
            Sessions: true,
        });


        

        // Setup test environment
        await this.contracts.User.addUser(this.simpleUser.address);
        await this.contracts.User.addUser(this.adminUser.address);
        await this.contracts.User.addUser(this.ocppProxy.address);
        await this.contracts.User.addUser(this.contracts.Sessions.target);

        // Set access levels
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "Sessions", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.ocppProxy.address, "Sessions", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.contracts.Sessions.target, "Balance", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.simpleUser.address, "Sessions", 4);

        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "Location", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "EVSE", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "Connector", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "Tariff", 4);
        await this.contracts.UserAccess.setAccessLevelToModule(this.adminUser.address, "Balance", 4);

        // Add test location and EVSE
        const { location } = require("./lib/location_data");
        await this.contracts.Location.connect(this.adminUser).addLocation(location);
        
        const { EVSEdata } = require("./lib/evse_data");
        EVSEdata.ocpp_proxy = this.ocppProxy.address;
        await this.contracts.EVSE.connect(this.adminUser).add(EVSEdata, 1);
        
        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
                        
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(1, 1); // 1 = Available
        
        // Add test tariff
        const { free_tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(free_tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(1, 1);
        
    });

    it("should initialize with correct values", async function() {
        const version = await this.contracts.Sessions.getVersion();
        expect(version).to.equal("1.0");
    });

    it("should create reservation request and cancel", async function() {
        const tx = await this.contracts.Sessions.connect(this.simpleUser).createReservationRequest(1, 1, ethers.ZeroAddress);
        await this.contracts.Sessions.connect(this.ocppProxy).createReservationResponse(1, true);
        const event = await getEventArguments(tx, "ReservationRequest");
        
        expect(event.id).to.equal(1);
        expect(event.account).to.equal(this.simpleUser.address);
        expect(event.time_expire).to.be.gt(0);

        await this.contracts.Sessions.connect(this.simpleUser).cancelReservationRequest(1, ethers.ZeroAddress)
        await this.contracts.Sessions.connect(this.ocppProxy).cancelReservationResponse(1, true);
    });



    it("should start session with reservation with free tariff", async function() {
        

        await this.contracts.Balance.mint(this.simpleUser.address, ethers.parseEther("10"));


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy,
            evse_id: 1,
            connector_id: 1,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30,
            parking_duration:0,
            start_timestamp: Math.floor(Date.now() / 1000)
        }
        
        const cdr = await runTestSession(params, this.contracts);
        
        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.start_datetime).to.equal(params.start_timestamp, "start_datetime");
        expect(cdr.end_datetime).to.equal(params.start_timestamp + ((params.number_of_logs + 1) * params.time_increment), "end_datetime");
    });


    it("should start session with reservation with single energy tariff", async function(){


        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(2, 1); // 1 = Available

        // Add test tariff
        const { energy_tariff: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(2, 2);



        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 2,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 35,
            parking_duration:0,
            start_timestamp: Math.floor(Date.now() / 1000)
        }

        const total_cost_el_one = (params.meter_value_increment*BigInt(76))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_component_price_vat = ((total_cost_el_one/BigInt(100))*BigInt(tariff.elements[0].price_components[0].vat))+total_cost_el_one;

        let tx = await this.contracts.Balance.mint(this.simpleUser.address, total_component_price_vat+ethers.parseEther("10"));
        await tx.wait()

        const cdr = await runTestSession(params, this.contracts);
        const total_energy = BigInt(params.number_of_logs + 1) * params.meter_value_increment;
        expect(cdr.total_energy).to.equal(total_energy, "total_energy");
        
        expect(cdr.total_cost.excl_vat).to.equal(total_cost_el_one, "excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(total_component_price_vat, "incl_vat")
    })

    it("should start session with reservation with single time tariff", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(3, 1); // 1 = Available

        // Add test tariff
        const { time_tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(time_tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(3, 3);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 3,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:0,
            start_timestamp: Math.floor(Date.now() / 1000)
        }

        const total_component_price = (BigInt(params.number_of_logs + 1) * BigInt(params.time_increment))/BigInt(60)*time_tariff.elements[0].price_components[0].price;
        const total_component_price_vat = ((total_component_price/BigInt(100))*BigInt(time_tariff.elements[0].price_components[0].vat))+total_component_price;

        await this.contracts.Balance.mint(this.simpleUser.address, total_component_price_vat);

        const cdr = await runTestSession(params, this.contracts);


        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat)
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat)

        expect(cdr.elements[0].components[0].price.excl_vat).to.equal(total_component_price, "price.excl_vat")

        expect(cdr.elements[0].components[0].price.incl_vat).to.equal(total_component_price_vat,"price.incl_vat")

    })



    it("should start session with reservation with single flat tariff", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(4, 1); // 1 = Available

        // Add test tariff
        const { flat_tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(flat_tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(4, 4);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 4,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 15,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:0,
            start_timestamp: Math.floor(Date.now() / 1000)
        }
        const total_component_price = flat_tariff.elements[0].price_components[0].price;
        const total_component_price_vat = ((total_component_price/BigInt(100))*BigInt(flat_tariff.elements[0].price_components[0].vat))+total_component_price;

        await this.contracts.Balance.mint(this.simpleUser.address, total_component_price_vat);

        const cdr = await runTestSession(params, this.contracts);


        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        expect(cdr.elements[0].components[0].price.excl_vat).to.equal(total_component_price, "price.excl_vat")

        expect(cdr.elements[0].components[0].price.incl_vat).to.equal(total_component_price_vat,"price.incl_vat")

    })



    it("should start session with reservation with energy and parking tariff", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(5, 1); // 1 = Available

        // Add test tariff
        const { energy_and_parking } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(energy_and_parking);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(5, 5);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 5,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60000*60, // 1h
            start_timestamp: Math.floor(Date.now() / 1000)
        }

        const total_cost_el_one = (params.meter_value_increment*BigInt(76))*(energy_and_parking.elements[0].price_components[0].price/BigInt(10**18));
        const total_component_one_price_vat = ((total_cost_el_one/BigInt(100))*BigInt(energy_and_parking.elements[0].price_components[0].vat))+total_cost_el_one;


        const total_component_price = (energy_and_parking.elements[1].price_components[0].price/BigInt(60))*BigInt(params.parking_duration);
        const total_component_price_vat = ((total_component_price/BigInt(100))*BigInt(energy_and_parking.elements[1].price_components[0].vat))+total_component_price;

        await this.contracts.Balance.mint(this.simpleUser.address, total_component_price_vat+total_component_one_price_vat);

        const cdr = await runTestSession(params, this.contracts);


        

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[1].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[1].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        

        expect(cdr.elements[1].components[0].price.excl_vat).to.equal(total_component_price, "price.excl_vat")
        expect(cdr.elements[1].components[0].price.incl_vat).to.equal(total_component_price_vat,"price.incl_vat")
    })
  



    it("should start session with reservation with energy and parking tariff in one element", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(6, 1); // 1 = Available

        // Add test tariff
        const { energy_and_parking_2 } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(energy_and_parking_2);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(6, 6);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 6,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.now() / 1000)
        }

        const total_cost_el_one = (params.meter_value_increment*BigInt(76))*(energy_and_parking_2.elements[0].price_components[0].price/BigInt(10**18));
        const total_component_one_price_vat = ((total_cost_el_one/BigInt(100))*BigInt(energy_and_parking_2.elements[0].price_components[0].vat))+total_cost_el_one;

        const total_component_price = (energy_and_parking_2.elements[0].price_components[1].price/BigInt(60))*BigInt(params.parking_duration);
        const total_component_price_vat = ((total_component_price/BigInt(100))*BigInt(energy_and_parking_2.elements[0].price_components[1].vat))+total_component_price;

        await this.contracts.Balance.mint(this.simpleUser.address, total_component_price_vat+total_component_one_price_vat);
        const cdr = await runTestSession(params, this.contracts);


        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[0].components[1].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[0].components[1].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        

        expect(cdr.elements[0].components[1].price.excl_vat).to.equal(total_component_price, "price.excl_vat")
        expect(cdr.elements[0].components[1].price.incl_vat).to.equal(total_component_price_vat,"price.incl_vat")
    })



    it("should start session with reservation with energy and parking tariff in one element with time restrictions", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(7, 1); // 1 = Available

        // Add test tariff
        const { energy_with_time_restrictions } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(energy_with_time_restrictions);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(7, 7);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 7,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2024-02-26T23:00:00Z") / 1000)
        }

        await this.contracts.Balance.mint(this.simpleUser.address, ethers.parseEther("234.24"));
        

        const cdr = await runTestSession(params, this.contracts);
        
        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")
        expect(ethers.formatEther(cdr.total_cost.incl_vat)).to.equal("234.24")
        
    })




    it("should start session with reservation with energy and parking tariff in one element with date restrictions", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(8, 1); // 1 = Available

        // Add test tariff
        const { energy_with_date_restrictions: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(8, 8);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 8,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2024-02-26T22:30:00Z") / 1000)
        }
        
        await this.contracts.Balance.mint(this.simpleUser.address, ethers.parseEther("291.84"));
        const cdr = await runTestSession(params, this.contracts);
        
        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")
        expect(ethers.formatEther(cdr.total_cost.incl_vat)).to.equal("291.84")
        
    })

    it("should start session with reservation with energy and parking tariff in one element with kwh restrictions", async function(){


        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(9, 1); // 1 = Available

        // Add test tariff
        const { energy_with_kwh_restrictions: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(9, 9);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 9,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2024-02-26T22:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(15))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(61))*(tariff.elements[1].price_components[0].price/BigInt(10**18));

        const total_cost = total_cost_el_one+total_cost_el_two;
        
        const total_cost_vat = ((total_cost/BigInt(100))*BigInt(20))+total_cost;

        await this.contracts.Balance.mint(this.simpleUser.address, total_cost_vat);

        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[1].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[1].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        expect(cdr.total_cost.excl_vat).to.equal(total_cost_el_one+total_cost_el_two)
        
    })


    it("should start session with reservation with energy and parking tariff in one element with current restrictions", async function(){


        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(10, 1); // 1 = Available

        // Add test tariff
        const { energy_with_current_restrictions: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(10, 10);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 10,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2024-02-26T22:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(7))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(69))*(tariff.elements[1].price_components[0].price/BigInt(10**18));
        const total_cost = total_cost_el_one+total_cost_el_two;
        
        const total_cost_vat = ((total_cost/BigInt(100))*BigInt(20))+total_cost;

        await this.contracts.Balance.mint(this.simpleUser.address, total_cost_vat);

        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[1].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[1].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        expect(cdr.total_cost.excl_vat).to.equal(total_cost_el_one+total_cost_el_two, "cdr.total_cost.excl_vat")
        
    })


    it("should start session with reservation with energy and parking tariff in one element with power restrictions", async function(){


        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(11, 1); // 1 = Available

        // Add test tariff
        const { energy_with_power_restrictions: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(11, 11);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 11,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2024-02-26T22:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(7))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(69))*(tariff.elements[1].price_components[0].price/BigInt(10**18));

        const total_cost = total_cost_el_one+total_cost_el_two;
        
        const total_cost_vat = ((total_cost/BigInt(100))*BigInt(20))+total_cost;

        await this.contracts.Balance.mint(this.simpleUser.address, total_cost_vat);

        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[1].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[1].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        expect(cdr.total_cost.excl_vat).to.equal(total_cost_el_one+total_cost_el_two, "cdr.total_cost.excl_vat")
        
    })


    it("should start session with reservation with energy and parking tariff in one element with duration restrictions", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(12, 1); // 1 = Available

        // Add test tariff
        const { energy_with_duration_restrictions: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(12, 12);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 12,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2024-02-26T22:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(10))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(66))*(tariff.elements[1].price_components[0].price/BigInt(10**18));

                const total_cost = total_cost_el_one+total_cost_el_two;
        
        const total_cost_vat = ((total_cost/BigInt(100))*BigInt(20))+total_cost;

        await this.contracts.Balance.mint(this.simpleUser.address, total_cost_vat);

        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[1].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[1].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")

        expect(cdr.total_cost.excl_vat).to.equal(total_cost_el_one+total_cost_el_two, "cdr.total_cost.excl_vat")
        
    })


    it("should start session with reservation with energy and parking tariff in one element with day of week restrictions", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(13, 1); // 1 = Available

        // Add test tariff
        const { energy_with_day_of_week_restrictions: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(13, 13);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 13,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2025-06-16T23:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(59))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(17))*(tariff.elements[1].price_components[0].price/BigInt(10**18));

        const total_cost = total_cost_el_one+total_cost_el_two;
        
        const total_cost_vat = ((total_cost/BigInt(100))*BigInt(20))+total_cost;

        await this.contracts.Balance.mint(this.simpleUser.address, total_cost_vat);

        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(cdr.total_cost.excl_vat).to.equal(cdr.elements[0].components[0].price.excl_vat+cdr.elements[1].components[0].price.excl_vat, "total_cost.excl_vat == price.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(cdr.elements[0].components[0].price.incl_vat+cdr.elements[1].components[0].price.incl_vat, "total_cost.incl_vat == price.incl_vat")


        expect(cdr.total_cost.excl_vat).to.equal(total_cost_el_one+total_cost_el_two, "cdr.total_cost.excl_vat")
        
    })



    it("should start session with reservation with energy and parking tariff in one element with day of week and min price restrictions", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(14, 1); // 1 = Available

        // Add test tariff
        const { energy_with_day_of_week_restrictions_and_min_price: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(14, 14);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 14,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2025-06-16T23:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(59))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(17))*(tariff.elements[1].price_components[0].price/BigInt(10**18));

        await this.contracts.Balance.mint(this.simpleUser.address, tariff.min_price.incl_vat);
        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(total_cost_el_one).to.equal(cdr.elements[0].components[0].price.excl_vat, "total_cost_el_one")
        expect(total_cost_el_two).to.equal(cdr.elements[1].components[0].price.excl_vat, "total_cost_el_two")


        expect(cdr.total_cost.excl_vat).to.equal(tariff.min_price.excl_vat, "cdr.total_cost.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(tariff.min_price.incl_vat, "cdr.total_cost.incl_vat")
        
    })


    it("should start session with reservation with energy and parking tariff in one element with day of week and max price restrictions", async function(){

        // Add test connector
        const { connector } = require("./lib/evse_data");
        await this.contracts.Connector.connect(this.adminUser).add(connector, 1);
        // Set connector status to Available
        await this.contracts.Connector.connect(this.adminUser).setStatus(15, 1); // 1 = Available

        // Add test tariff
        const { energy_with_day_of_week_restrictions_and_max_price: tariff } = require("./lib/tariff_data");
        await this.contracts.Tariff.connect(this.adminUser).add(tariff);

        await this.contracts.Connector.connect(this.adminUser).setTariffs(15, 15);


        const params = {
            start_from: ethers.ZeroAddress,
            reservation: true,
            simpleUser: this.simpleUser,
            ocppProxy: this.ocppProxy, 
            evse_id: 1,
            connector_id: 15,
            percent_start: 1,
            percent_end: 100,
            number_of_logs: 75,
            meter_value_increment: ethers.parseEther("0.2"),
            time_increment: 30, // every 30 second
            parking_duration:60*60, // 1h
            start_timestamp: Math.floor(Date.parse("2025-06-16T23:30:00Z") / 1000)
        }
        
        

        const total_cost_el_one = (params.meter_value_increment*BigInt(59))*(tariff.elements[0].price_components[0].price/BigInt(10**18));
        const total_cost_el_two = (params.meter_value_increment*BigInt(17))*(tariff.elements[1].price_components[0].price/BigInt(10**18));

        await this.contracts.Balance.mint(this.simpleUser.address, tariff.max_price.incl_vat);
        const cdr = await runTestSession(params, this.contracts);

        expect(cdr.total_energy).to.equal(BigInt(params.number_of_logs + 1) * params.meter_value_increment, "total_energy");
        expect(total_cost_el_one).to.equal(cdr.elements[0].components[0].price.excl_vat, "total_cost_el_one")
        expect(total_cost_el_two).to.equal(cdr.elements[1].components[0].price.excl_vat, "total_cost_el_two")


        expect(cdr.total_cost.excl_vat).to.equal(tariff.max_price.excl_vat, "cdr.total_cost.excl_vat")
        expect(cdr.total_cost.incl_vat).to.equal(tariff.max_price.incl_vat, "cdr.total_cost.incl_vat")
        
    })
    
}); 




async function runTestSession(params, contracts) {


        var reservation_id = 0;
        var session_id = 0;
        var start_from = params.start_from;


        if(params.reservation){
            // Create and confirm reservation
            let reservationTx = await contracts.Sessions.connect(params.simpleUser).createReservationRequest(params.evse_id, params.connector_id, start_from);
            let reservation = await getEventArguments(reservationTx, "ReservationRequest");
            await contracts.Sessions.connect(params.ocppProxy).createReservationResponse(reservation.id, true)

            reservation_id = reservation.id;
        }




        // Start session from client
        const tx = await contracts.Sessions.connect(params.simpleUser).startSessionRequest(params.evse_id, params.connector_id, reservation_id, start_from);
        const event = await getEventArguments(tx, "SessionStartRequest");

        session_id = event.uid

        let address_check = "0x0000000000000000000000000000000000000000"
        if(start_from == "0x0000000000000000000000000000000000000000"){
            address_check = params.simpleUser.address
        }


        expect(event.evse_id).to.equal(params.evse_id);
        expect(event.connector_id).to.equal(params.connector_id);
        expect(event.account).to.equal(address_check);



        // Response start transaction from ocpp proxy 
        let tx2 = await contracts.Sessions.connect(params.ocppProxy).startSessionResponse(session_id, params.start_timestamp,0,true, "ok")

        const startSessionResponse = await getEventArguments(tx2, "SessionStartResponse");
        
        expect(startSessionResponse.session_id).to.equal(event.uid);
        expect(startSessionResponse.status).to.equal(true);
        expect(startSessionResponse.message).to.equal("ok");


        const startTimestamp = params.start_timestamp;
        const numberOfLogs = params.number_of_logs; // Количество логов между 50 и 100
        const meterValueIncrement = params.meter_value_increment; // Увеличение показаний счетчика для каждого лога
        const timeIncrement = params.time_increment; // Увеличение времени на 1 минуту для каждого лога
        

        // Создаем и отправляем множество логов
        for (var i = 1; i <= numberOfLogs; i++) {
            const percent = Number(Math.min(
                params.percent_end, 
                Math.max(
                        params.percent_start, 
                        params.percent_start + (i / numberOfLogs) * (params.percent_end - params.percent_start)
                    )
                ).toFixed(0));
                
            let power = 0;
            let current = 0;
            let voltage = 0;

            if(percent <= 10){
                power = 7000
                voltage = 350
                current = 32
            }

            if(percent > 10 && percent < 50){
                power = 120000
                voltage = 360
                current = 250
            }

            if(percent >= 50 && percent < 80){
                power = 90000
                voltage = 380
                current = 190
            }

            if(percent >= 80) {
                power = 20000
                voltage = 420
                current = 50
            }

            const sessionLog = {
                meter_value:meterValueIncrement * BigInt(i),
                percent: percent,
                power: power,
                current: current,
                voltage: voltage,
                timestamp: startTimestamp + (i * timeIncrement)
            };


            const tx = await contracts.Sessions.connect(params.ocppProxy).updateSession(startSessionResponse.session_id, sessionLog);
            const event = await getEventArguments(tx, "SessionUpdate");

            const sessionStopRequest = await getEventArguments(tx, "SessionStopRequest");

            if(typeof sessionStopRequest.session_id != "undefined"){
                console.log("sessionStopRequest", sessionStopRequest)
                break;
            }
            
            
            expect(event.session_id).to.equal(startSessionResponse.session_id);
            expect(event.meter_value).to.equal( sessionLog.meter_value);
            expect(event.percent).to.equal(percent);

        }

        const finalMeterValue = meterValueIncrement * BigInt(i);
        const finalTimestamp = startTimestamp + (i * timeIncrement);
        

        await contracts.Sessions.connect(params.simpleUser).stopSessionRequest(startSessionResponse.session_id);
        
        await contracts.Sessions.connect(params.ocppProxy).stopSessionResponse(startSessionResponse.session_id, finalMeterValue, finalTimestamp, true, "ok");
        
        await contracts.Sessions.connect(params.ocppProxy).endSession(startSessionResponse.session_id, finalTimestamp+params.parking_duration);
        


        const cdr = await contracts.Tariff.getCDR(startSessionResponse.session_id);
        
        return cdr;
}