// Set up
const express = require('express');
const app = express();                               // create our app w/ express
//const mongoose = require('mongoose');                     // mongoose for mongodb
const bodyParser = require('body-parser');    // pull information from HTML POST (express4)
const methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
const cors = require('cors');
const Promise = require('bluebird');
const config = require('./config.json');
const sql = require("mssql");
const fs 		= require('fs');
const keccak256 = require('keccak256'); 
const https = require ('https');

const multer = require('multer');

const DIR_UPLOAD = config.infra.caminhoArquivos + config.infra.caminhoUpload;
const DIR_CAMINHO_DECLARACAO = config.infra.caminhoArquivos + config.infra.caminhoDeclaracao;
const DIR_CAMINHO_COMPROVANTE_DOACAO = config.infra.caminhoArquivos + config.infra.caminhoComprovanteDoacao;
const DIR_CAMINHO_COMPROVANTE_LIQUIDACAO = config.infra.caminhoArquivos + config.infra.caminhoComprovanteLiquidacao;

const MAX_FILE_SIZE = Number( config.negocio.maxFileSize );

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR_UPLOAD);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName)
  }
});

const uploadMiddleware = multer(
								{ 
									limits: {fileSize: MAX_FILE_SIZE},								
									storage: storage,
									fileFilter: (req, file, cb) => {
										if (file.mimetype == "application/pdf") {
											cb(null, true);
										} else {
											cb(null, false);
											return cb(new Error('Only .pdf format allowed!'));
										}
									}
								}
							   ).single('arquivo');

// Configuration
//mongoose.connect(config.infra.addr_bd);

app.use(bodyParser.urlencoded({ 'extended': 'true' }));         // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(cors());

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

	next();
});

//console.log(config.infra.caminhoPastaPublica);

//https://expressjs.com/pt-br/starter/static-files.html
app.use(express.static(config.infra.caminhoPastaPublica));


//Promise.promisifyAll(mongoose); // key part - promisification


/*var PessoasJuridicas = mongoose.model('Pessoasjuridicas', {

	cnpj: String,
	dadosCadastrais: {
		cidade: String,
		razaoSocial: String,
	},
	subcreditos: [{
		numero: Number,
	}],
});
*/

// Rotas
/*
	//use para pegar qq verbo hhtp
	//verifica autenticacao para todas as rotas abaixo
	app.use('/*', function(req, res, next) {
		console.log("Sempre passa por aqui");
		next();
    });
*/

//Configuracao de acesso ao BD
let configAcessoBDPJ = config.infra.acesso_BD_PJ;
configAcessoBDPJ.password = process.env.BNC_BD_PJ_PASSWORD;



var contrato_json_BNDESToken = require(config.infra.contrato_json_BNDESToken);
var contrato_json_BNDESRegistry = require(config.infra.contrato_json_BNDESRegistry);

var n = contrato_json_BNDESToken.networks;

console.log("config.infra.rede_blockchain (1=Main|4=Rinkeby|4447=local) = " + config.infra.rede_blockchain);

//ABI = contrato_json_BNDESToken['abi']

let addrContratoBNDESToken;
let addrContratoBNDESRegistry;
if (config.infra.rede_blockchain < 10) {  
	console.log ("config.infra.rede_blockchain=" + config.infra.rede_blockchain);
	addrContratoBNDESToken = config.infra.endereco_BNDESToken;
	addrContratoBNDESRegistry = config.infra.endereco_BNDESRegistry;
}
else { //TODO: testar localhost
	
	try {
		console.log ("config.infra.rede_blockchain>10 -> rede local=" + config.infra.rede_blockchain);
		let test = n[config.infra.rede_blockchain].address 
	} catch (error) {
		console.log ("ERROR. Consider: ")
		console.log ("1) remove the back-blockchain/build and then migrate again...")
		console.log ("2) the number of the network in your config.json")
		console.log ("	networks = " + n)
		console.log ("	config.infra.rede_blockchain = " + config.infra.rede_blockchain)
		console.log ("	networks[config.infra.rede_blockchain] = " + n[config.infra.rede_blockchain])		
		process.exit();
	}
	addrContratoBNDESToken = n[config.infra.rede_blockchain].address;
	addrContratoBNDESRegistry = contrato_json_BNDESRegistry.networks[config.infra.rede_blockchain].address;
}

console.log("endereco do contrato BNDESToken=" + addrContratoBNDESToken);
console.log("endereco do contrato BNDESRegistry=" + addrContratoBNDESRegistry);


app.get('/api/abi', function (req, res) {
	res.json(contratoJson);
})

app.get('/api/hash/:filename', async function (req, res) {
	const filename = req.params.filename;		
	const hashedResult = await calculaHash(config.infra.caminhoUpload + filename);
	return res.json(hashedResult);
})

async function calculaHash(filename) {
	const input = fs.readFileSync(filename);	
	let hashedResult = keccak256(input).toString('hex');	
	return hashedResult;					
}

//recupera constantes front
app.post('/api/constantesFront', function (req, res) {
	res.json({ addrContratoBNDESToken: addrContratoBNDESToken, 
		addrContratoBNDESRegistry: addrContratoBNDESRegistry,
		blockchainNetwork: config.infra.rede_blockchain,
		abiBNDESToken: contrato_json_BNDESToken['abi'],
		abiBNDESRegistry: contrato_json_BNDESRegistry['abi']
	 });
});

console.log("operationAPIURL=" + config.infra.operationAPIURL);

app.post('/api/constantesFrontPJ', function (req, res) {
	console.log("operationAPIURL=" + config.infra.operationAPIURL);
	console.log("mockMongoClient=" + config.negocio.mockMongoClient)
	console.log("mockPJ=" + mockPJ)
	res.json({ operationAPIURL: config.infra.operationAPIURL,  
		mockMongoClient: config.negocio.mockMongoClient, 
		mockPJ: mockPJ,
		maxFileSize: MAX_FILE_SIZE		
	});
});


app.post('/api/pj-por-cnpj', buscaPJPorCnpj);

	function buscaPJPorCnpj (req, res, next) {
		let cnpjRecebido = req.body.cnpj;

		let isNum = /^\d+$/.test(cnpjRecebido);

		if (!isNum) {			
			res.status(200).json({});
		}


		if (mockPJ) {

			console.log("mock PJ ON!");
			https.get('https://www.receitaws.com.br/v1/cnpj/' + cnpjRecebido, (resp) => {
				let data = '';

				resp.on('data', (chunk) => {
					data += chunk;
				  });

				resp.on('end', () => {
					jsonData = JSON.parse(data);
					console.log(jsonData);

					let pj = 	
					{
						cnpj: cnpjRecebido,
						dadosCadastrais: {
							razaoSocial: jsonData.nome
						}
					}
					console.log("pj=");
					console.log(pj);
					res.status(200).json(pj);				

				});
			}).on("error", (err) => {
				console.log("Erro ao buscar mock da API: " + err.message);
			  });

		}
		else {

			new sql.ConnectionPool(configAcessoBDPJ).connect().then(pool => {
				return pool.request()
									 .input('cnpj', sql.VarChar(14), cnpjRecebido)
									 .query(config.negocio.query_cnpj)
				
				}).then(result => {
					let rows = result.recordset
	
					if (!rows[0]) {
						res.status(200).json({});
						return;
					}
	
					let pj = 	
					{
						cnpj: rows[0]["CNPJ_EMPRESA"],
						dadosCadastrais: {
							razaoSocial: rows[0]["NOME_EMPRESARIAL"]
						}
					}
	
					console.log("pj do QSA");				
					console.log(pj);
	
					res.status(200).json(pj);				
					sql.close();
	
	
				}).catch(err => {
					console.log(err);
					res.status(500).send({ message: "${err}"})
					sql.close();
				});
	

		}


	}	


//upload.single('arquivo')
app.post('/api/upload', trataUpload);

function trataUpload(req, res, next) {

	console.log("trataUpload - uploadMiddleware ")
	console.log(uploadMiddleware);
	
  	//calls the uploadMiddleware function to process the upload
	uploadMiddleware(req, res, async function (err) {
			if (err) {
				// An error occurred when uploading
				console.log(err);
				return res.status(422).send("an Error occured")
			}  
			else {
				// No error occured.			
				let cnpj     = req.body.cnpj;
				let contrato = req.body.contrato;	
				let conta    = req.body.contaBlockchain;
				let tipo     = req.body.tipo;

				console.log("tipo=");
				console.log(tipo);				

				const tmp_path = req.file.path;
				const hashedResult = await calculaHash(tmp_path);			
				
				let target_path = "";

				if (tipo=="declaracao") {					
					let fileName = montaNomeArquivoDeclaracao(cnpj, contrato, conta, hashedResult);
					target_path = DIR_CAMINHO_DECLARACAO + fileName;
				}
				else if (tipo=="comp_doacao") {
					let fileName = montaNomeArquivoComprovanteDoacao(cnpj, hashedResult);
					target_path = DIR_CAMINHO_COMPROVANTE_DOACAO + fileName;
				}
				else if (tipo=="comp_liq") {
					let fileName = montaNomeArquivoComprovanteLiquidacao(cnpj, contrato, hashedResult);
					target_path = DIR_CAMINHO_COMPROVANTE_LIQUIDACAO + fileName;
				}		
				else {
					throw "erro tipo desconhecido para download de arquivo";
				}
								
				// A better way to copy the uploaded file. 
				const src  = fs.createReadStream(tmp_path);
				const dest = fs.createWriteStream(target_path);
				src.pipe(dest);
				src.on('end', function ()
				{
					console.log("Upload Completed from "+ tmp_path + ", original name " + req.file.originalname + ", copied to " + target_path); 
				});
				src.on('error', function (err)
				{
					console.log("Upload ERROR! from "+ tmp_path + ", original name " + req.file.originalname + ", copied to " + target_path); 
				});	
				res.json(hashedResult);
			}
		}
	);
}



app.post('/api/fileinfo', buscaFileInfo);

async function buscaFileInfo(req, res) {

	let filePathAndNameToFront;
	let hashedResult;
	let hashFile;
	let targetPathToCalculateHash;

	try {

		let cnpj     = req.body.cnpj;
		let contrato = req.body.contrato;
		let blockchainAccount = req.body.blockchainAccount;
		let tipo     = req.body.tipo;
		console.log("tipo=" + tipo);

		hashFile = req.body.hashFile;		

		if (tipo=="declaracao") {
			let fileName = montaNomeArquivoDeclaracao(cnpj, contrato, blockchainAccount, hashFile);
			filePathAndNameToFront = config.infra.caminhoDeclaracao + fileName;
			targetPathToCalculateHash = DIR_CAMINHO_DECLARACAO + fileName;	
		}		
		else if (tipo=="comp_doacao") {
			let fileName = montaNomeArquivoComprovanteDoacao(cnpj, hashFile);			
			filePathAndNameToFront = config.infra.caminhoComprovanteDoacao + fileName;
			targetPathToCalculateHash = DIR_CAMINHO_COMPROVANTE_DOACAO + fileName;	
		}
		else if (tipo=="comp_liq") {
			let fileName = montaNomeArquivoComprovanteLiquidacao(cnpj, contrato, hashFile);						
			filePathAndNameToFront = config.infra.caminhoComprovanteLiquidacao + fileName;
			targetPathToCalculateHash = DIR_CAMINHO_COMPROVANTE_LIQUIDACAO + fileName;	
		}
		else {
			throw "erro tipo desconhecido para buscar arquivo";
		}

		//verifica integridade do arquivo
		hashedResult = await calculaHash(targetPathToCalculateHash);

	}
	catch (err) {
		console.log("Erro buscar informações do arquivo.");
		console.log(err)
		res.sendStatus(500);
		return;
	}

	if (hashedResult!=hashFile) {
		console.log("Erro conferir o hash do arquivo.");
		res.sendStatus(506);
		return;
	}
	else {
		console.log("Hash correto");
	}

	let respJson = {
		pathAndName: filePathAndNameToFront
	};

	console.log(respJson);
	res.json(respJson);

}

function montaNomeArquivoDeclaracao(cnpj, contrato, blockchainAccount, hashFile) {
	return ("DECL" + "_" + cnpj + '_' + contrato + '_' + blockchainAccount + '_' + hashFile +  '.PDF');
}

function montaNomeArquivoComprovanteDoacao(cnpj, hashFile) {
	return ("COMP_DOACAO" + "_" + cnpj + '_' + hashFile +  '.PDF');
}

function montaNomeArquivoComprovanteLiquidacao(cnpj, contrato, hashFile) {
	return ("COMP_LIQ" + "_" + cnpj + '_' + contrato + '_' + hashFile +  '.PDF');
}

// listen (start app with node server.js) ======================================
app.listen(8080, "0.0.0.0");

let data = "\n" + new Date() + "\nApp listening on port 8080 ";
console.log(data);
