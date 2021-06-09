pragma solidity 0.6.12;

import "../libraries/BEP20.sol";

contract Pixel is BEP20 {
  constructor() public BEP20("Pixel Token", "Pixel") {
    super._mint(_msgSender(), 1e8*1e18);
  }
}
