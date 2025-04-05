// contracts/interfaces/IMCP.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IMCP {
    // Event emitted when a request for AI interaction is made
    event AIRequestSent(
        address indexed requester,
        string modelProvider,
        string modelId,
        string prompt,
        string parameters,
        uint256 requestId
    );
    
    // Event emitted when a response is received
    event AIResponseReceived(
        uint256 indexed requestId,
        address indexed requester,
        string response,
        uint256 timestamp
    );
    
    // Function to request AI interaction
    function requestAIInteraction(
        string memory modelProvider,
        string memory modelId,
        string memory prompt,
        string memory parameters
    ) external returns (uint256 requestId);
    
    // Function to register AI response (called by authorized oracle)
    function registerAIResponse(
        uint256 requestId,
        address requester,
        string memory response
    ) external;
}