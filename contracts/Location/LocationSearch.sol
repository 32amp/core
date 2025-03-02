// SPDX-License-Identifier: GPLV3
pragma solidity ^0.8.12;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Utils.sol";
import "./ILocation.sol";
import "./ILocationSearch.sol";
import "../Hub/IHub.sol";

/**
 * @title Location Search Contract
 * @notice Provides geospatial search capabilities for charging locations
 * @dev Implements grid-based spatial indexing for efficient location queries
 * @custom:warning Requires proper initialization via Hub contract
 */
contract LocationSearch is ILocationSearch, Initializable {
    // Storage mapping documentation
    /// @dev Grid-based spatial index [latitude][longitude] => location IDs
    mapping(int16 => mapping(int16 => uint256[])) locations_index;

    // State variables documentation
    /// @notice Hub contract reference
    address hubContract;
    
    /// @notice Associated partner ID
    uint256 partner_id;
    
    /// @dev Utility library for string operations
    using Utils for string;

    /**
     * @notice Initializes contract with Hub connection
     * @param _partner_id Partner ID from Hub registry
     * @param _hubContract Address of Hub contract
     * @custom:init Called once during proxy deployment
     */
    function initialize(uint256 _partner_id, address _hubContract) public initializer {
        hubContract = _hubContract;
        partner_id = _partner_id;
    }


    // Module accessors documentation
    /// @dev Returns Location module interface
    function _Location() private view returns(ILocation) {
        return ILocation(IHub(hubContract).getModule("Location", partner_id));
    }

    /// @notice Returns current contract version
    function getVersion() external pure returns(string memory){
        return "1.0";
    }

    /**
     * @notice Adds location to spatial index
     * @param lat Integer latitude coordinate
     * @param lon Integer longitude coordinate
     * @param location_id Location ID to index
     * @custom:reverts "AccessDenied" if caller is not Location module
     */
    function addLocationToIndex(int16 lat, int16 lon, uint256 location_id) external {

        if(msg.sender != IHub(hubContract).getModule("Location", partner_id))
            revert AccessDenied("LocationSearch");

        locations_index[lat][lon].push(location_id);
    }


    /**
     * @notice Searches locations within specified area
     * @param input Search parameters including coordinates
     * @return (inAreaOutput[] memory, uint256) Array of results and total count
     * @custom:reverts "BigOffset" if offset exceeds available results
     */
    function inArea(inAreaInput calldata input) external view returns (inAreaOutput[] memory, uint256) {

        uint64 output_count = 50;


        int16 topRightLat_integerPart = input.topRightLat.splitCoordinate();
        int16 topRightLong_integerPart = input.topRightLong.splitCoordinate();
        int16 bottomLeftLat_integerPart = input.bottomLeftLat.splitCoordinate();
        int16 bottomLeftLong_integerPart = input.bottomLeftLong.splitCoordinate();


        if(topRightLat_integerPart != bottomLeftLat_integerPart && topRightLong_integerPart != bottomLeftLong_integerPart)
            return inAreaGlobalSearch(input,output_count);
        else
            return inAreaLocalSearch(input,output_count);
    }

    /**
     * @dev Performs local grid cell search
     * @param input Search parameters
     * @param output_count Maximum results to return
     * @return (inAreaOutput[] memory, uint256) Results array and total count
     * @custom:reverts "BigOffset" if offset exceeds available results
     */
    function inAreaLocalSearch(inAreaInput calldata input, uint64 output_count) private view returns (inAreaOutput[] memory, uint256) {
        uint64 count = 0;

        uint256[] memory locationIds = locations_index[input.topRightLat.splitCoordinate()][input.topRightLong.splitCoordinate()];

        int256 topRightLat = input.topRightLat.stringToInt32();
        int256 bottomLeftLat = input.bottomLeftLat.stringToInt32();
        int256 topRightLong = input.topRightLong.stringToInt32();
        int256 bottomLeftLong = input.bottomLeftLong.stringToInt32();

        
        for (uint256 i = 0; i < locationIds.length; i++) {
            uint256 id = locationIds[i];
            ILocation.outLocation memory location = _Location().getLocation(id);

            if (
                location.location.coordinates.latitude <= topRightLat &&
                location.location.coordinates.latitude >= bottomLeftLat &&
                location.location.coordinates.longitude <= topRightLong &&
                location.location.coordinates.longitude >= bottomLeftLong &&
                location.location.publish
            ) {
                count++;
            }
        }
        
        
        if(input.offset > count)
            revert BigOffset(input.offset);

        
        uint256[] memory outputIds = new uint256[](count);

        {
            uint256 _index = 0;
            for (uint256 i = 0; i < locationIds.length; i++) {
                uint256 id = locationIds[i];
                ILocation.outLocation memory location = _Location().getLocation(id);
    
                if (
                    location.location.coordinates.latitude <= topRightLat &&
                    location.location.coordinates.latitude >= bottomLeftLat &&
                    location.location.coordinates.longitude <= topRightLong &&
                    location.location.coordinates.longitude >= bottomLeftLong &&
                    location.location.publish
                ) {
                    
                    outputIds[_index] = id;
                    _index++;
                }
            }
        }



        if(count < output_count )
            output_count = count;

        if(count-input.offset < output_count)
            output_count = count-input.offset;

        
        inAreaOutput[] memory results = new inAreaOutput[](output_count);

        {
            uint256 index = 0;

            
            for (uint256 i = input.offset; i < outputIds.length; i++) {
                uint256 id = outputIds[i];

                if(output_count == index)
                    break;

                results[index] = inAreaOutput({
                    coordinates: _Location().getLocation(id).location.coordinates,
                    id:id
                });

                index++;

            }
        }

        return (results,count);
    }

    /**
     * @dev Performs global grid search across multiple cells
     * @param input Search parameters
     * @param output_count Maximum results to return
     * @return (inAreaOutput[] memory, uint256) Results array and total count
     * @custom:reverts "BigOffset" if offset exceeds available results
     */
    function inAreaGlobalSearch(inAreaInput calldata input, uint64 output_count) private view returns (inAreaOutput[] memory, uint256) {

        uint64 count = 0;
        int16 i_vertical_start;
        int16 i_vertical_end;
        int16 i_horisontal_start;
        int16 i_horisontal_end;
        
        {
            int16 topRightLat_integerPart = input.topRightLat.splitCoordinate();
            int16 topRightLong_integerPart = input.topRightLong.splitCoordinate();
            int16 bottomLeftLat_integerPart = input.bottomLeftLat.splitCoordinate();
            int16 bottomLeftLong_integerPart = input.bottomLeftLong.splitCoordinate();

            if(topRightLong_integerPart < bottomLeftLong_integerPart){
                i_vertical_start = topRightLong_integerPart;
                i_vertical_end = bottomLeftLong_integerPart;
            }else{
                i_vertical_start = bottomLeftLong_integerPart;
                i_vertical_end = topRightLong_integerPart;
            }

            if(topRightLat_integerPart < bottomLeftLat_integerPart){
                i_horisontal_start = topRightLat_integerPart;
                i_horisontal_end = bottomLeftLat_integerPart;
            }else{
                i_horisontal_start = bottomLeftLat_integerPart;
                i_horisontal_end = topRightLat_integerPart;
            }
        }

        for (int16 i = i_vertical_start; i <= i_vertical_end; i++) {
            for (int16 i_2 = i_horisontal_start; i_2 < i_horisontal_end; i_2++) {
                
                if(locations_index[i_2][i].length > 0){
                    count += uint64(locations_index[i_2][i].length);

                }
            }
        }

        

        if(input.offset >= count)
            revert BigOffset(input.offset);
        
        if(count < output_count )
            output_count = count;

        if(count-input.offset < output_count)
            output_count = count-input.offset;

        inAreaOutput[] memory results = new inAreaOutput[](output_count);


        {
            uint32 index = 0;
            uint8 index_2 = 0;

            for (int16 i = i_vertical_start; i <= i_vertical_end; i++) {
                for (int16 i_2 = i_horisontal_start; i_2 < i_horisontal_end; i_2++) {
                    uint256[] memory locationIds = locations_index[i_2][i];
                    if(locationIds.length > 0){
                        for (uint i_loc = 0; i_loc < locationIds.length; i_loc++) {
                            if(index >= input.offset && index_2 < output_count){
                                results[index_2] = inAreaOutput({
                                    coordinates: _Location().getLocation(locationIds[i_loc]).location.coordinates,
                                    id:locationIds[i_loc]
                                });
                                index_2++;
                            }
                            index++;
                        }
                    }
                }
            }
        }

        return (results,count);
    }
}