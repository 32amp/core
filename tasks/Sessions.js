const { loadContract } = require("./helpers/load_contract");
const inquirer = require("inquirer");
const { accountSelection } = require("./helpers/promt_selection");
const { scope } = require("hardhat/config");

const sessionsScope = scope("Sessions", "Tasks for Sessions module");

/// @notice Show the current version of the Sessions contract
sessionsScope.task("version", "Show contract version")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const version = await sessions.getVersion();
        console.log(`Sessions contract version: ${version}`);
    });

/// @notice Create a new charging session
sessionsScope.task("start-session", "Create a new charging session")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "evse_uid", message: "Enter EVSE UID:", validate: v => !isNaN(v) },
            { type: "input", name: "connector_id", message: "Enter connector ID:", validate: v => !isNaN(v) },
            { type: "input", name: "reserve_id", message: "Enter reservation ID (0 if none):", default: 0, validate: v => !isNaN(v) },
            { type: "confirm", name: "custom_account", message: "Specify a different user address?", default: false }
        ];
        const answers = await inquirer.prompt(questions);
        let start_for;
        if (answers.custom_account) {
            start_for = await accountSelection(hre);
        } else {
            start_for = hre.ethers.ZeroAddress;
        }
        const tx = await sessions.startSessionRequest(
            answers.evse_uid,
            answers.connector_id,
            answers.reserve_id,
            start_for
        );
        await tx.wait();
        console.log("Session created, tx:", tx.hash);
    });

/// @notice Update a charging session (OCPP only)
sessionsScope.task("update-session", "Update a charging session (OCPP only)")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) },
            { type: "input", name: "meter_value", message: "Meter value:", validate: v => !isNaN(v) },
            { type: "input", name: "timestamp", message: "Timestamp:", validate: v => !isNaN(v) },
            { type: "input", name: "percent", message: "Charge percent:", validate: v => !isNaN(v) },
            { type: "input", name: "power", message: "Power:", validate: v => !isNaN(v) },
            { type: "input", name: "current", message: "Current:", validate: v => !isNaN(v) },
            { type: "input", name: "voltage", message: "Voltage:", validate: v => !isNaN(v) }
        ];
        const a = await inquirer.prompt(questions);
        const session_log = {
            meter_value: a.meter_value,
            timestamp: a.timestamp,
            percent: a.percent,
            power: a.power,
            current: a.current,
            voltage: a.voltage
        };
        const tx = await sessions.updateSession(a.session_id, session_log);
        await tx.wait();
        console.log("Session updated, tx:", tx.hash);
    });

/// @notice Send stop session response (OCPP only)
sessionsScope.task("stop-session-response", "Send stop session response (OCPP only)")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) },
            { type: "input", name: "meter_stop", message: "Final meter value:", validate: v => !isNaN(v) },
            { type: "input", name: "timestamp", message: "Timestamp:", validate: v => !isNaN(v) },
            { type: "confirm", name: "status", message: "Was the session successfully stopped?" },
            { type: "input", name: "message", message: "Comment:" }
        ];
        const a = await inquirer.prompt(questions);
        const tx = await sessions.stopSessionResponse(a.session_id, a.meter_stop, a.timestamp, a.status, a.message);
        await tx.wait();
        console.log("Stop session response sent, tx:", tx.hash);
    });

/// @notice Get session data by ID
sessionsScope.task("get-session", "Get session data by ID")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const { session_id } = await inquirer.prompt([
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) }
        ]);
        const session = await sessions.getSession(session_id);
        console.log("Session data:", session);
    });

/// @notice Check if session exists by ID
sessionsScope.task("exist", "Check if session exists by ID")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const { session_id } = await inquirer.prompt([
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) }
        ]);
        const exists = await sessions.exist(session_id);
        console.log(`Session ${session_id} exists:`, exists);
    });

/// @notice Get session ID by user address
sessionsScope.task("get-session-by-auth", "Get session ID by user address")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const auth_id = await accountSelection(hre);
        const session_id = await sessions.getSessionByAuth(auth_id);
        console.log(`Session ID for user ${auth_id}:`, session_id);
    });

/// @notice Create reservation request
sessionsScope.task("create-reservation-request", "Create reservation request")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "evse_uid", message: "Enter EVSE UID:", validate: v => !isNaN(v) },
            { type: "input", name: "connector_id", message: "Enter connector ID:", validate: v => !isNaN(v) },
            { type: "confirm", name: "custom_account", message: "Specify a different user address?", default: false }
        ];
        const a = await inquirer.prompt(questions);
        let start_for;
        if (a.custom_account) {
            start_for = await accountSelection(hre);
        } else {
            start_for = hre.ethers.ZeroAddress;
        }
        const tx = await sessions.createReservationRequest(a.evse_uid, a.connector_id, start_for);
        await tx.wait();
        console.log("Reservation request sent, tx:", tx.hash);
    });

/// @notice Send reservation response (OCPP only)
sessionsScope.task("create-reservation-response", "Send reservation response (OCPP only)")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "reserve_id", message: "Reservation ID:", validate: v => !isNaN(v) },
            { type: "confirm", name: "status", message: "Reservation confirmed?" }
        ];
        const a = await inquirer.prompt(questions);
        const tx = await sessions.createReservationResponse(a.reserve_id, a.status);
        await tx.wait();
        console.log("Reservation response sent, tx:", tx.hash);
    });

/// @notice Send reservation cancel request
sessionsScope.task("cancel-reservation-request", "Send reservation cancel request")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "reserve_id", message: "Reservation ID:", validate: v => !isNaN(v) },
            { type: "confirm", name: "custom_account", message: "Specify a different user address?", default: false }
        ];
        const a = await inquirer.prompt(questions);
        let cancel_for;
        if (a.custom_account) {
            cancel_for = await accountSelection(hre);
        } else {
            cancel_for = hre.ethers.ZeroAddress;
        }
        const tx = await sessions.cancelReservationRequest(a.reserve_id, cancel_for);
        await tx.wait();
        console.log("Reservation cancel request sent, tx:", tx.hash);
    });

/// @notice Send reservation cancel response (OCPP only)
sessionsScope.task("cancel-reservation-response", "Send reservation cancel response (OCPP only)")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "reserve_id", message: "Reservation ID:", validate: v => !isNaN(v) },
            { type: "confirm", name: "status", message: "Cancel confirmed?" }
        ];
        const a = await inquirer.prompt(questions);
        const tx = await sessions.cancelReservationResponse(a.reserve_id, a.status);
        await tx.wait();
        console.log("Reservation cancel response sent, tx:", tx.hash);
    });

/// @notice Send start session response (OCPP only)
sessionsScope.task("start-session-response", "Send start session response (OCPP only)")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) },
            { type: "input", name: "timestamp", message: "Timestamp:", validate: v => !isNaN(v) },
            { type: "input", name: "meter_start", message: "Start meter value:", validate: v => !isNaN(v) },
            { type: "confirm", name: "status", message: "Start successful?" },
            { type: "input", name: "message", message: "Comment:" }
        ];
        const a = await inquirer.prompt(questions);
        const tx = await sessions.startSessionResponse(a.session_id, a.timestamp, a.meter_start, a.status, a.message);
        await tx.wait();
        console.log("Start session response sent, tx:", tx.hash);
    });

/// @notice Send stop session request
sessionsScope.task("stop-session-request", "Send stop session request")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const { session_id } = await inquirer.prompt([
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) }
        ]);
        const tx = await sessions.stopSessionRequest(session_id);
        await tx.wait();
        console.log("Stop session request sent, tx:", tx.hash);
    });

/// @notice Finalize session (OCPP only)
sessionsScope.task("end-session", "Finalize session (OCPP only)")
    .setAction(async (_, hre) => {
        const { instance: sessions } = await loadContract("Sessions", hre);
        const questions = [
            { type: "input", name: "session_id", message: "Session ID:", validate: v => !isNaN(v) },
            { type: "input", name: "timestamp", message: "Timestamp:", validate: v => !isNaN(v) }
        ];
        const a = await inquirer.prompt(questions);
        const tx = await sessions.endSession(a.session_id, a.timestamp);
        await tx.wait();
        console.log("Session finalized, tx:", tx.hash);
    });

module.exports = sessionsScope; 