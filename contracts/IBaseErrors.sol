
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
 * @title Custom Errors Interface
 * @notice Defines custom error types for access control, validation, and system constraints
 * @dev Provides detailed error messages for debugging and error handling
 */
interface IBaseErrors {

    /**
     * @notice Emitted when attempting to set status without adding connectors
     * @dev Raised when trying to mark an EVSE as available without connectors
     */
    error AddConnectorFirst();


    /**
     * @notice Emitted when user lacks required access to a module
     * @dev Raised when account doesn't have sufficient permissions for the module
     * @param module Name of the module where access was denied
     */
    error AccessDenied(string module);

    /**
     * @notice Emitted when user lacks required access level
     * @dev Raised when account's access level is lower than required
     * @param level Actual access level of the caller
     */
    error AccessDeniedLevel(string module, uint level);


    /**
     * @notice Emitted when user lacks required access level for a specific object
     * @dev Raised when account doesn't have sufficient permissions for the object in the module
     * @param module Name of the module where access was denied
     * @param object Identifier of the object being accessed
     * @param level Required access level for the operation
     */
    error AccessDeniedObjectLevel(string module, bytes32 object, uint level);

    /**
     * @notice Emitted when an offset exceeds valid bounds
     * @dev Raised during pagination or data retrieval when the offset is too large
     * @param offset Invalid offset value
     */
    error BigOffset(uint offset);

    /**
     * @notice Emitted when a field exceeds its maximum allowed length
     * @dev Raised during input validation for string or array fields
     * @param field Name of the field with invalid length
     * @param lenght Maximum allowed length for the field
     */
    error FieldLenghtNoMore(string field, uint lenght);

    /**
     * @notice Emitted when the maximum limit for an object is exceeded
     * @dev Raised when attempting to create more instances than allowed
     * @param object Name of the object type (e.g., "cards", "connectors")
     * @param maximum Maximum allowed number of objects
     */
    error MaximumOfObject(string object, uint maximum);

    /**
     * @notice Emitted when attempting to create a duplicate object
     * @dev Raised when an object with the same identifier already exists
     * @param object Name of the object type (e.g., "location", "EVSE")
     */
    error AlreadyExist(string object);

    /**
     * @notice Emitted when the provided amount is insufficient
     * @dev Raised during transactions or payments
     * @param required_amount Minimum required amount
     */
    error AmountNotEnouth(uint required_amount);

    /**
     * @notice Emitted when a referenced module is not found
     * @dev Raised when attempting to access a non-registered module
     * @param module Name of the missing module
     */
    error ModuleNotFound(string module);

    /**
     * @notice Emitted when a referenced object is not found
     * @dev Raised when attempting to access a non-registered object
     * @param object Name of the object type (e.g., "location", "connector")
     * @param object_id ID of the missing object
     */
    error ObjectNotFound(string object, uint object_id);

    /**
     * @notice Emitted when an account has insufficient balance
     * @dev Raised during transfers or withdrawals
     */
    error InsufficientBalance();

    /**
     * @notice Emitted when an invalid receiver address is provided
     * @dev Raised during transfers to zero address or invalid addresses
     * @param reciver Invalid receiver address
     */
    error InvalidReceiver(address reciver);

    /**
     * @notice Emitted when an invalid sender address is provided
     * @dev Raised during transfers from zero address or invalid addresses
     * @param sender Invalid sender address
     */
    error InvalidSender(address sender);




}