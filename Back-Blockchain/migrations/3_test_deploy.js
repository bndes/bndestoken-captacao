const BNDESRegistry = artifacts.require("./BNDESRegistry.sol");
const BNDESToken = artifacts.require("./BNDESToken.sol");

module.exports = async (deployer, network, accounts) => {

	let populateTheBlockchain = true; //ATTENTION: keep it FALSE when you commit

	if ( populateTheBlockchain ) {

		console.log(" ");
		console.log("------------------------------------------------------------");
		console.log("[Important Message] 'THE POPULATE FEATURE is ON!!!' " );
		console.log("------------------------------------------------------------");
		console.log(" ");		

		bndesRegistryInstance = await BNDESRegistry.deployed();
		bndesTokenInstance    = await BNDESToken.deployed();

		const donors = [	33000167000101,   // PETROLEO BRASILEIRO SA PETROBRAS
							60701190000104,   // ITAU UNIBANCO SA
							71673990000177,   // NATURA COSMETICOS SA
							45997418000153,   // COCA COLA INDUSTRIAS LTDA
							61068276000104    // UNILEVER BRASIL LTDA
						];

		const cnpjDonor         = donors[0];
		const cnpjAnotherDonor  = donors[1];

		const clients = [	09351359000188,   // FUNDAÇÃO AMAZONAS SUSTENTÁVEL  FAZ  
							07339438000148,   // INSTITUTO DE CONSERVACAO E DESENVOLVIMENTO SUSTENTAVEL
							00580567000184,   // INSTITUTO MANEJO E CERTICACAO FLOREST AGRICIMAFLORA
							40390569000125,   // FUNDACAO BRASILEIRA PARA O DESENVOLVIMENTO SUSTENTAVEL
							01641000000133    // FUNDACAO BANCO DO BRASIL
						];
		const cnpjClient        = clients[0]; 
		const cnpjAnotherClient = clients[1]; 

		const subCreditos = [	16201771,   // FUNDAÇÃO AMAZONAS SUSTENTÁVEL  FAZ  
								17207661,   // INSTITUTO DE CONSERVACAO E DESENVOLVIMENTO SUSTENTAVEL
								17200221,   // INSTITUTO MANEJO E CERTICACAO FLOREST AGRICIMAFLORA
								18206941,   // FUNDACAO BRASILEIRA PARA O DESENVOLVIMENTO SUSTENTAVEL
								14209321    // FUNDACAO BANCO DO BRASIL
							];		

		const subCreditoCliente       = subCreditos[0];
		const subCreditoAnotherClient = subCreditos[1];

		const bndesAddr         = accounts[0];
		const clientAddr        = accounts[1];
		const donorAddr         = accounts[2];
		const anotherDonorAddr  = accounts[3];
		const anotherClientAddr = accounts[4];

		let idProofHash = "e96c7ffef33869246069ebcb32bc72a59fb488c4893c9eb9b3306de7ba74f6d8"
		await bndesTokenInstance.registryLegalEntity( cnpjDonor, 0, idProofHash, { from: donorAddr } );    
		await bndesRegistryInstance.validateRegistryLegalEntity( donorAddr, idProofHash );    
		
		let cnpjReturned = await bndesRegistryInstance.getCNPJ( donorAddr );
		console.log(" ");
		console.log("------------------------------------------------------------");
		console.log("[Important Message] 'The script seems to be fine = " + ( cnpjReturned > 0 ) + "'" );
		console.log("------------------------------------------------------------");
		console.log(" ");

		idProofHash = "1620e4f0e0f6bd1d9a52488244d95778e2663ff3eebf795917ded6954c4d3bd2"
		await bndesTokenInstance.registryLegalEntity( cnpjAnotherDonor, 0, idProofHash, { from: anotherDonorAddr } );        
		await bndesRegistryInstance.validateRegistryLegalEntity( anotherDonorAddr, idProofHash );    
		
		idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
		await bndesTokenInstance.registryLegalEntity( cnpjClient, subCreditoCliente, idProofHash, { from: clientAddr } );    
		await bndesRegistryInstance.validateRegistryLegalEntity( clientAddr, idProofHash );    
		
		idProofHash = "bc214ab54cbba561cf48b12e7d16c73da596d29400f8f736a5133106f305292f"
		await bndesTokenInstance.registryLegalEntity( cnpjAnotherClient, subCreditoAnotherClient, idProofHash, { from: anotherClientAddr } );        
		await bndesRegistryInstance.validateRegistryLegalEntity( anotherClientAddr, idProofHash );    	

		let donationTenFromDonor           = 10000;
		let donationFiveFromDonor          =  5000;
		let donationTwentyFromAnotherDonor = 20000;
		let totalDonationBooked            = donationTenFromDonor + donationFiveFromDonor + donationTwentyFromAnotherDonor;
		await bndesTokenInstance.bookDonation( donationTenFromDonor           , { from: donorAddr } );    
		await bndesTokenInstance.bookDonation( donationTwentyFromAnotherDonor , { from: anotherDonorAddr } );
		await bndesTokenInstance.bookDonation( donationFiveFromDonor          , { from: donorAddr } );
		let amountReturned = await bndesTokenInstance.getBookedTotalSupply.call();
		await bndesTokenInstance.confirmDonation( donorAddr, ( donationTenFromDonor + donationFiveFromDonor) );        
		await bndesTokenInstance.confirmDonation( anotherDonorAddr, donationTwentyFromAnotherDonor );        
		let disbursementOne = donationTenFromDonor + donationTwentyFromAnotherDonor;
		let disbursementTwo = donationFiveFromDonor;
		await bndesTokenInstance.makeDisbursement( clientAddr, disbursementOne );
		await bndesTokenInstance.makeDisbursement( anotherClientAddr, disbursementTwo );
		
		await bndesTokenInstance.redeem ( disbursementOne, { from: clientAddr } );
		await bndesTokenInstance.redeem ( disbursementTwo, { from: anotherClientAddr } );

		//await bndesTokenInstance.notifyRedemptionSettlement( redemptionTransactionHash, receiptHash);
		
		//await bndesTokenInstance.requestRedemption( disbursementOne, { from: clientAddr } );
		//await bndesTokenInstance.requestRedemption( disbursementTwo, { from: anotherClientAddr } );
		//await bndesTokenInstance.redemptionSettlement( clientAddr, disbursementOne );
		//await bndesTokenInstance.redemptionSettlement( anotherClientAddr, disbursementTwo );

		let finalSupply = await bndesTokenInstance.getConfirmedTotalSupply.call();

	}

}