pragma solidity 0.6.12;

import "../libraries/BEP20.sol";

contract Canvas is BEP20 {
  constructor() public BEP20("Canvas Token", "Canvas") {
    super._mint(_msgSender(), 1e8*1e18);
  }
}
