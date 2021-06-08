pragma solidity 0.6.12;

import "./libraries/TransferHelper.sol";

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Pausable.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract LibertyNFT is ERC721Pausable, AccessControl, Ownable {
    using SafeMath for uint256;

    uint256 constant public minimumStep = 10;

    struct Liberty {
        uint256 index;
        uint256 startX;
        uint256 startY;
        uint256 xLength;
        uint256 yLength;
    }
    bytes32 public constant UPDATE_TOKEN_URI_ROLE = keccak256('UPDATE_TOKEN_URI_ROLE');
    bytes32 public constant PAUSED_ROLE = keccak256('PAUSED_ROLE');
    uint256 public nextTokenId = 1;
    address public mintFeeAddr;
    uint256 public mintFeeAmount;
    address public modifyFeeAddr;
    uint256 public modifyFeeAmount;

    address public mintFeeTokenAddr;
    address public modifyFeeTokenAddr;
    mapping(uint256 => bool[100][100]) public libertyMap;
    mapping(uint256 => bool) public enableIndexMap;
    mapping(uint256 => Liberty) public nftLibertyMap;

    event Burn(address indexed sender, uint256 tokenId);
    event MintFeeAddressTransferred(address indexed previousOwner, address indexed newOwner);
    event SetMintFeeAmount(address indexed seller, uint256 oldMintFeeAmount, uint256 newMintFeeAmount);
    event SetModifyFeeAmount(address indexed seller, uint256 oldModifyFeeAmount, uint256 newModifyFeeAmount);

    constructor(
        string memory name,
        string memory symbol,
        address _mintFeeTokenAddr,
        address _modifyFeeTokenAddr,
        address _mintFeeAddr,
        uint256 _mintFeeAmount,
        address _modifyFeeAddr,
        uint256 _modifyFeeAmount
    ) public ERC721(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(UPDATE_TOKEN_URI_ROLE, _msgSender());
        _setupRole(PAUSED_ROLE, _msgSender());
        mintFeeTokenAddr = _mintFeeTokenAddr;
        modifyFeeTokenAddr = _modifyFeeTokenAddr;
        mintFeeAddr = _mintFeeAddr;
        mintFeeAmount = _mintFeeAmount;
        modifyFeeAddr = _modifyFeeAddr;
        modifyFeeAmount = _modifyFeeAmount;
        emit MintFeeAddressTransferred(address(0), mintFeeAddr);
        emit SetMintFeeAmount(_msgSender(), 0, mintFeeAmount);
    }

    receive() external payable {}

    function enableIndex(uint256 index) public onlyOwner {
        require(index==0 || (index>0 && enableIndexMap[index-1]), "enable previous one first");
        enableIndexMap[index] = true;
    }

    function mint(address to, string memory _tokenURI, uint256 index, uint256 startX, uint256 startY, uint256 xLength, uint256 yLength) public returns (uint256 tokenId) {
        require(validatePixel(index, startX, startY, xLength, yLength), "invalid pixel");
        TransferHelper.safeTransferFrom(mintFeeTokenAddr, msg.sender, address(this), mintFeeAmount);
        tokenId = nextTokenId;
        _mint(to, tokenId);
        nextTokenId++;
        _setTokenURI(tokenId, _tokenURI);
        Liberty memory liberty = Liberty({
            index:   index,
            startX:  startX,
            startY:  startY,
            xLength: xLength,
            yLength: yLength
        });
        nftLibertyMap[tokenId] = liberty;
        markAsUsed(index, startX, startY, xLength, yLength);
    }

    function markAsUsed(uint256 index, uint256 startX, uint256 startY, uint256 xLength, uint256 yLength) internal {
        bool[100][100] storage pixelArray = libertyMap[index];
        for (uint256 x = startX; x < startX.add(xLength); x = x + minimumStep) {
            for (uint256 y = startY; y < startY.add(yLength); y = y + minimumStep) {
                pixelArray[x][y] = true;
            }
        }
    }

    function validatePixel(uint256 index, uint256 startX, uint256 startY, uint256 xLength, uint256 yLength) public view returns(bool) {
        require(enableIndexMap[index], "index is not enabled yet");
        require(xLength!=0 && yLength!=0,"length should not be 0");

        require(startX<1000 && startX.add(xLength)<=1000,"horizontal exceed boundary");
        require(startY<1000 && startY.add(yLength)<=1000,"vertical exceed boundary");

        require(startX.mod(minimumStep)==0 &&
            startY.mod(minimumStep)==0 &&
            xLength.mod(minimumStep)==0 &&
            yLength.mod(minimumStep)==0,"pixel should align to 10");

        bool[100][100] memory pixelArray = libertyMap[index];
        for (uint256 x = startX; x < startX.add(xLength); x = x + minimumStep) {
            for (uint256 y = startY; y < startY.add(yLength); y = y + minimumStep) {
                if (pixelArray[x][y]) {
                    return false;
                }
            }
        }
        return true;
    }

    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), 'caller is not owner nor approved');
        _burn(tokenId);
        emit Burn(_msgSender(), tokenId);
    }

    function setBaseURI(string memory baseURI) public {
        require(hasRole(UPDATE_TOKEN_URI_ROLE, _msgSender()), 'Must have update token uri role');
        _setBaseURI(baseURI);
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), 'caller is not owner nor approved');
        _setTokenURI(tokenId, tokenURI);
    }

    function pause() public whenNotPaused {
        require(hasRole(PAUSED_ROLE, _msgSender()), 'Must have pause role');
        _pause();
    }

    function unpause() public whenPaused {
        require(hasRole(PAUSED_ROLE, _msgSender()), 'Must have pause role');
        _unpause();
    }

    function transferMintFeeAddress(address _mintFeeAddr) public {
        require(_msgSender() == mintFeeAddr, 'FORBIDDEN');
        mintFeeAddr = _mintFeeAddr;
        emit MintFeeAddressTransferred(_msgSender(), mintFeeAddr);
    }

    function setMintFeeAmount(uint256 _mintFeeAmount) public onlyOwner {
        require(mintFeeAmount != _mintFeeAmount, 'Not need update');
        emit SetMintFeeAmount(_msgSender(), mintFeeAmount, _mintFeeAmount);
        mintFeeAmount = _mintFeeAmount;
    }

    function setModifyFeeAmount(uint256 _modifyFeeAmount) public onlyOwner {
        require(modifyFeeAmount != _modifyFeeAmount, 'Not need update');
        emit SetMintFeeAmount(_msgSender(), modifyFeeAmount, _modifyFeeAmount);
        modifyFeeAmount = _modifyFeeAmount;
    }
}