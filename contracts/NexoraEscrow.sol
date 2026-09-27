// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NexoraEscrow {
    address public buyer;
    address payable public seller;

    uint256 public amount;

    enum Status {
        Created,
        Funded,
        Released,
        Refunded
    }

    Status public status;

    constructor(address payable _seller) payable {
        buyer = msg.sender;
        seller = _seller;
        amount = msg.value;

        if (msg.value > 0) {
            status = Status.Funded;
        } else {
            status = Status.Created;
        }
    }

    function releaseFunds() external {
        require(msg.sender == buyer, "Only buyer can release funds");
        require(status == Status.Funded, "Escrow is not funded");

        status = Status.Released;
        seller.transfer(amount);
    }

    function refundBuyer() external {
        require(msg.sender == buyer, "Only buyer can refund");
        require(status == Status.Funded, "Escrow is not funded");

        status = Status.Refunded;
        payable(buyer).transfer(amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
