// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CampaignDAO.sol";

/**
 * @title CampaignDAOFactory
 * @dev Factory contract to create and track Campaign DAOs
 * @notice Creates a DAO instance for each campaign token
 */
contract CampaignDAOFactory {

    // ============================================
    // EVENTS
    // ============================================

    event CampaignDAOCreated(
        uint256 indexed campaignId,
        address indexed campaignToken,
        address indexed daoAddress,
        address creator
    );

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Mapping of campaign ID to DAO address
    mapping(uint256 => address) public campaignDAOs;

    /// @notice Mapping of token address to DAO address
    mapping(address => address) public tokenToDAO;

    mapping(uint256 => string) public hederaTopicIds; // campaignId => hederaTopicId

    /// @notice Array of all DAO addresses
    address[] public allDAOs;

    /// @notice Default DAO parameters
    struct DAOParameters {
        uint256 proposalThreshold;
        uint256 votingPeriod;
        uint256 quorumPercentage;
        uint256 majorityPercentage;
    }

    DAOParameters public defaultParameters;

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        // Set default parameters
        // Can be customized per campaign during creation
        defaultParameters = DAOParameters({
            proposalThreshold: 100 * 10**18,  // 100 tokens (assuming 18 decimals)
            votingPeriod: 3 days,
            quorumPercentage: 1000,           // 10% (in basis points)
            majorityPercentage: 5000          // 50% (in basis points)
        });
    }

    // ============================================
    // DAO CREATION
    // ============================================

    /**
     * @notice Create a new Campaign DAO with default parameters
     * @param _campaignToken Address of the campaign token
     * @param _campaignId ID of the campaign
     * @param _campaignCreator Address of the campaign creator
     * @param _isDAOEnabled Whether DAO should be created (must be true)
     * @return daoAddress Address of the newly created DAO
     */
    function createCampaignDAO(
        address _campaignToken,
        uint256 _campaignId,
        string memory _hederaTopicId,
        address _campaignCreator,
        bool _isDAOEnabled
    ) external returns (address) {
        require(_isDAOEnabled, "DAO not enabled for this campaign");

        return _createCampaignDAO(
            _campaignToken,
            _campaignId,
            _hederaTopicId,
            _campaignCreator,
            defaultParameters.proposalThreshold,
            defaultParameters.votingPeriod,
            defaultParameters.quorumPercentage,
            defaultParameters.majorityPercentage
        );
    }

    /**
     * @notice Create a new Campaign DAO with custom parameters
     * @param _campaignToken Address of the campaign token
     * @param _campaignId ID of the campaign
     * @param _campaignCreator Address of the campaign creator
     * @param _isDAOEnabled Whether DAO should be created (must be true)
     * @param _proposalThreshold Minimum tokens required to create a proposal
     * @param _votingPeriod Duration of voting period in seconds
     * @param _quorumPercentage Minimum participation percentage (basis points)
     * @param _majorityPercentage Minimum approval percentage (basis points)
     * @return daoAddress Address of the newly created DAO
     */
    function createCampaignDAOWithCustomParams(
        address _campaignToken,
        uint256 _campaignId,
        string memory _hederaTopicId,
        address _campaignCreator,
        bool _isDAOEnabled,
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _majorityPercentage
    ) external returns (address) {
        require(_isDAOEnabled, "DAO not enabled for this campaign");

        return _createCampaignDAO(
            _campaignToken,
            _campaignId,
            _hederaTopicId,
            _campaignCreator,
            _proposalThreshold,
            _votingPeriod,
            _quorumPercentage,
            _majorityPercentage
        );
    }

    /**
     * @dev Internal function to create a Campaign DAO
     */
    function _createCampaignDAO(
        address _campaignToken,
        uint256 _campaignId,
        string memory _hederaTopicId,
        address _campaignCreator,
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _majorityPercentage
    ) internal returns (address) {
        require(_campaignToken != address(0), "Invalid token address");
        require(_campaignCreator != address(0), "Invalid creator address");
        require(campaignDAOs[_campaignId] == address(0), "DAO already exists for this campaign");

        // Create new DAO instance
        CampaignDAO dao = new CampaignDAO(
            _campaignToken,
            _campaignId,
            _hederaTopicId,
            _campaignCreator,
            _proposalThreshold,
            _votingPeriod,
            _quorumPercentage,
            _majorityPercentage
        );

        address daoAddress = address(dao);

        // Store DAO address
        campaignDAOs[_campaignId] = daoAddress;
        tokenToDAO[_campaignToken] = daoAddress;
        allDAOs.push(daoAddress);
        
        hederaTopicIds[_campaignId] = _hederaTopicId;

        emit CampaignDAOCreated(_campaignId, _campaignToken, daoAddress, _campaignCreator);

        return daoAddress;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get DAO address for a campaign
     * @param _campaignId ID of the campaign
     * @return Address of the DAO (address(0) if doesn't exist)
     */
    function getDAOByCampaign(uint256 _campaignId) external view returns (address) {
        return campaignDAOs[_campaignId];
    }

    /**
     * @notice Get DAO address for a token
     * @param _tokenAddress Address of the campaign token
     * @return Address of the DAO (address(0) if doesn't exist)
     */
    function getDAOByToken(address _tokenAddress) external view returns (address) {
        return tokenToDAO[_tokenAddress];
    }

    /**
     * @notice Get total number of DAOs created
     * @return Total count of DAOs
     */
    function getTotalDAOs() external view returns (uint256) {
        return allDAOs.length;
    }

    /**
     * @notice Get all DAO addresses
     * @return Array of all DAO addresses
     */
    function getAllDAOs() external view returns (address[] memory) {
        return allDAOs;
    }

    /**
     * @notice Check if a DAO exists for a campaign
     * @param _campaignId ID of the campaign
     * @return True if DAO exists
     */
    function daoExists(uint256 _campaignId) external view returns (bool) {
        return campaignDAOs[_campaignId] != address(0);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update default DAO parameters for future DAOs
     * @param _proposalThreshold New default proposal threshold
     * @param _votingPeriod New default voting period
     * @param _quorumPercentage New default quorum percentage
     * @param _majorityPercentage New default majority percentage
     */
    function updateDefaultParameters(
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _majorityPercentage
    ) external {
        require(_quorumPercentage <= 10000, "Quorum must be <= 100%");
        require(_majorityPercentage <= 10000, "Majority must be <= 100%");

        defaultParameters = DAOParameters({
            proposalThreshold: _proposalThreshold,
            votingPeriod: _votingPeriod,
            quorumPercentage: _quorumPercentage,
            majorityPercentage: _majorityPercentage
        });
    }
}
