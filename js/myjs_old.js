//set title
var title;

console.log("Hello nice to see you - come on in... please excuse the mess");
//set table vars
var tableData = [];
var tableDataIndy = [];
var sigHistory = [];
var totalSigs;
var engArr = [];
var scoArr = [];
var walArr = [];
var ireArr = [];
var ukArr = [];
var noukArr = [];
var totArr = [];

//simple callout
var say = function (x) {
	// Legacy host email reference removed
	console.log(x);
};

function setTitleHead(x) {
	document.title = x;
	say(x);
	return;
}

function setPetitionId(x) {
	if (x) {
		say("Petition ID: " + x);
		return;
	}
	say("No ID given");
	return;
}

//------BEGIN------
// set url
var url = window.location.pathname;

//get ID from URL and set
var petitionId = 730194;
setPetitionId(petitionId);
// set default pID
if (!petitionId) {
	petitionId = 241584;
}

//setlink vars
document
	.querySelector(".plink")
	.setAttribute(
		"href",
		"https://petition.parliament.uk/petitions/" + petitionId
	);
document
	.querySelector(".json")
	.setAttribute(
		"href",
		"https://petition.parliament.uk/petitions/" + petitionId + ".json"
	);
document
	.querySelector(".sign")
	.setAttribute(
		"href",
		"https://petition.parliament.uk/petitions/" + petitionId + "/signatures/new"
	);

//pId = document.querySelector('#petition');
//webId = pId.dataset.indexNumber;
//webId = "241584";
website = "https://petition.parliament.uk/petitions/" + petitionId;
websiteJsonURL = website + ".json";

//init fetch
fetch(websiteJsonURL)
	.then(function (response) {
		return response.json();
	})
	.then(function (myJson) {
		loadPage(myJson);
	});

// fetch for update
var newFetch = function () {
	fetch(websiteJsonURL)
		//console.log("Post Fetch");
		.then(function (response) {
			return response.json();
		})
		.then(function (myJson) {
			loadPage(myJson, true);
		});
};

var loadPage = function (myJson, x = false) {
	// SET TABLE DATA
	tableData = myJson.data.attributes.signatures_by_country;
	tableDataIndy = myJson.data.attributes.signatures_by_constituency;

	//DEBUG
	//console.log(findObjectByAttribute(tableDataIndy, "ons_code", "S14000022"));

	// country counter
	totalCon = 0; // set var that holds total
	totalConSig = 0;
	cuntCode = tableDataIndy[0].ons_code;
	cuntCodeSco = 0;
	cuntCodeEng = 0;
	cuntCodeWal = 0;
	cuntCodeIre = 0;
	totalConSco = 0;
	totalConEng = 0;
	totalConWal = 0;
	totalConIre = 0;
	var sigJump;

	//loop through sigs to count
	var i;
	for (i = 0; i < tableDataIndy.length; i++) {
		switch (tableDataIndy[i].ons_code.substring(0, 1)) {
			case "S":
				//console.log("SCOTLAND");
				cuntCodeSco++;
				totalConSco += tableDataIndy[i].signature_count;
				totalCon++;
				totalConSig += tableDataIndy[i].signature_count;
				break;
			case "E":
				//console.log("ENGLAND");
				cuntCodeEng++;
				totalConEng += tableDataIndy[i].signature_count;
				totalCon++;
				totalConSig += tableDataIndy[i].signature_count;
				break;
			case "N":
				//console.log("IRELAND");
				cuntCodeIre++;
				totalConIre += tableDataIndy[i].signature_count;
				totalCon++;
				totalConSig += tableDataIndy[i].signature_count;
				break;
			case "W":
				//console.log("WALES");
				cuntCodeWal++;
				totalConWal += tableDataIndy[i].signature_count;
				totalCon++;
				totalConSig += tableDataIndy[i].signature_count;
				break;
			default:
				text = "No value found";
		}
	}

	console.log("Constituencies: " + totalCon);
	//console.log("totalConSig: " + totalConSig);
	console.log("-------------");
	console.log("Update");
	console.log("-------------");

	//set shortcuts
	sco = totalConSco;
	eng = totalConEng;
	ire = totalConIre;
	wal = totalConWal;

	// console numbers
	say("----------------");
	say("Home Nations: ");
	say("----------------");

	console.log("ENG: " + cuntCodeEng + " V: " + totalConEng);
	console.log("SCO: " + cuntCodeSco + " V: " + totalConSco);
	console.log("WAL: " + cuntCodeWal + " V: " + totalConWal);
	console.log("IRE: " + cuntCodeIre + " V: " + totalConIre);

	//console.log("totalCon: "+totalCon);
	// set Frontend Tags
	updatedAt = myJson.data.attributes.updated_at;
	title = myJson.data.attributes.action;
	setTitleHead(title);
	totalSigs = myJson.data.attributes.signature_count;

	// find gb
	ukOnly = findObjectByAttribute(tableData, "code", "GB");
	ukOnly = ukOnly.signature_count;

	// sig counter

	totalSig = 0; // set var that holds total
	var i;
	for (i = 0; i < tableData.length; i++) {
		totalSig += tableData[i].signature_count;
	}

	sigHistory.push(totalSigs);
	//console.log(sigHistory);
	//console.log(totalSig);

	if (sigHistory.length > 0) {
		3;
		val1 = sigHistory[0] - 10;
		val2 = sigHistory[0];
		sigJump = 10;
		//console.log("Buffer: " +val1);
		if (sigHistory.length > 1) {
			val1 = sigHistory[0];
			//console.log("Old: " +val1);
			val2 = sigHistory[1];
			//console.log("New: " + val2);
			sigJump = val2 - val1;
			//console.log("Jump: " + (val2 - val1));
			// font change for fun
			// switch jump colour if > 0
			if (sigJump < 1) {
				document.querySelector(".jump").innerHTML =
					"Jump: <strong id ='jumpTxt' class='red'>" +
					sigJump +
					"</strong> in the past 10 seconds";
				//document.getElementById("jumpTxt").style.fontSize = sigJump + 10 + "px";
				sigHistory.shift();
			} else {
				document.querySelector(".jump").innerHTML =
					"Jump: <strong id ='jumpTxt' class='green'>+" +
					sigJump +
					"</strong> in the past 10 seconds";
				//document.getElementById("jumpTxt").style.fontSize = sigJump + 10 + "px";
				sigHistory.shift();
			}
		}
	}

	// calc non uk
	nonUK = totalSig - ukOnly;

	noOfCountries = tableData.length;

	/// DEBUG
	//console.log("No of countries: " +tableData.length);

	// update Frontend Tags

	document.querySelector(".titleHeader").innerHTML = title;
	document.querySelector(".updatedAt").innerHTML = updatedAt;

	//document.querySelector('.totalSigs').innerHTML = noC(totalSigs);

	// big spinner

	if (val1 - val2 != 0) {
		(function myLoop(i) {
			document.querySelector(".totalSigs").innerHTML = noC(val1++);
			setTimeout(function () {
				//alert('Greater than');  						//  your code here

				//console.log("jump : " +val1);
				if (val1 < val2) myLoop(i); //  incement
			}, 14000 / randomise(sigJump, sigJump + 10));
		})(sigJump); //  pass the number of iterations as an argument
	}

	// render UK sig
	document.querySelector(".ukOnly").innerHTML = noC(ukOnly);

	//render country sigs
	document.querySelector(".sco").innerHTML = noC(sco);
	document.querySelector(".eng").innerHTML = noC(eng);
	document.querySelector(".ire").innerHTML = noC(ire);
	document.querySelector(".wal").innerHTML = noC(wal);
	console.log("TOTAL: " + totalSigs);
	var homeTotal = sco + eng + ire + wal;
	var diffTotal = sco + eng + ire + wal - ukOnly;
	console.log("Home Nations Total: " + homeTotal);
	console.log("UK Total: " + ukOnly);

	console.log("Diff: " + diffTotal);
	// render non uk sig
	document.querySelector(".nonUK").innerHTML = noC(nonUK);

	//render uk only pc
	document.querySelector(".ukOnlyPc").innerHTML = noC(
		(ukOnly / (totalSig / 100)).toFixed(2) + "%"
	);

	// render countries sig pc
	document.querySelector(".scoPc").innerHTML =
		(sco / (totalSig / 100)).toFixed(2) + "%";
	document.querySelector(".engPc").innerHTML =
		(eng / (totalSig / 100)).toFixed(2) + "%";
	document.querySelector(".irePc").innerHTML =
		(ire / (totalSig / 100)).toFixed(2) + "%";
	document.querySelector(".walPc").innerHTML =
		(wal / (totalSig / 100)).toFixed(2) + "%";

	// render non uk
	document.querySelector(".nonUkPc").innerHTML = noC(
		(nonUK / (totalSig / 100)).toFixed(2) + "%"
	);

	// render no of countries
	document.querySelector(".noOfCountries").innerHTML = noOfCountries;

	//SigHistoryCount(totalSigs, totArr, "totalJump");

	SigHistoryCount(eng, engArr, "totalJumpEng");
	SigHistoryCount(sco, scoArr, "totalJumpSco");
	SigHistoryCount(wal, walArr, "totalJumpWal");
	SigHistoryCount(ire, ireArr, "totalJumpIre");
	SigHistoryCount(ukOnly, ukArr, "totalJumpUk");

	SigHistoryCount(nonUK, noukArr, "totalJumpNonUk");

	// set table for first use
	if (x !== true) {
		console.log("-------------");
		console.log("Initialise");
		console.log("-------------");
		table.setData(tableData);

		//say("totalSig: " +totalSig);
		document.querySelector(".totalSigs").innerHTML = noC(totalSigs - 10);
		//sigJump = totalSig - totalSigs;
		return;
	}
	// else rewrite  data
	table.replaceData(tableData);
	//say("totalSig: " +totalSig);
};

var table = new Tabulator("#example-table", {
	height: 450,
	//responsiveLayout:true,
	resizableColumns: "header",
	selectable: false, //make rows selectable
	layout: "fitColumns",
	data: tableData,
	columns: [
		{ title: "Country", field: "name", widthGrow: 3 },
		{
			title: "Count",
			field: "signature_count",
			formatter: "money",
			formatterParams: { precision: false },
			widthGrow: 2,
			sorter: "number",
		},
		{
			title: "%",
			width: 75,
			field: "signature_count",
			download: false,
			widthGrow: 1,
			formatter: function (cell, formatterParams, onRendered) {
				//cell - the cell component
				//formatterParams - parameters set for the column
				//onRendered - function to call when the formatter has been rendered
				var perc = (cell.getValue() / (totalSig / 100)).toFixed(2);
				if (perc < 0.01) {
					perc = "< 0.01";
				}
				return perc + "%"; //return the contents of the cell;
			},
			sorter: "number",
		},
	],
});

//refresh full
setInterval(newFetch, 10000);

//functions
//SigHistoryCount(totalSigs, totArr, "totalJump");

//SigHistoryCount(eng, engArr, "totalJumpEng");
//SigHistoryCount(sco, scoArr, "totalJumpSco");
//SigHistoryCount(wal, walArr, "totalJumpWal");
//SigHistoryCount(ire, ireArr, "totalJumpIre");
//SigHistoryCount(ukOnly, ukArr, "totalJumpUk");
//SigHistoryCount(nonUK, noukArr, "totalJumpNonUk");

function SigHistoryCount(x, y, z) {
	//say('FIRED');
	y.push(x);
	//accept engArr, scoArr, walArr, ireArr, totArr, ukArr, noukArr
	if (y.length < 2) {
		y.push(x);
		//say(z +" : " + x);
		//say (y);
		return;
	}
	//say('Equals > 0');

	y.shift();
	//say(z + " : " + x);
	//say ("Y0 -" + y[0]);
	//say ("Y1 -" + y[1]);
	id = z;
	//console.log("JUMP: " + (y[1] - y[0]) );
	var jumpSize = y[1] - y[0];
	if (jumpSize > 0) {
		// id - class = timeout
		if (z == "totalJumpUk") {
			changeClassTemp(id, "green", 5000);
		} else {
			changeClassTemp(id, "blink", 5000);
		}

		showJumpCount(id, jumpSize);
	}
}

function changeClassTemp(x, y, z) {
	//say ("BLINKED");
	//say("Y is - " +y);
	//say("X is - " +x);
	var el = document.getElementById(x);
	el.classList.add(y);
	el.classList.remove("normal");
	var delayInMilliseconds = z; //ms delay

	setTimeout(function () {
		//say ("REMOVED");
		el.classList.add("normal");
		el.classList.remove(y);
		//your code to be executed after x ms
		//el.classList.remove(y);
	}, delayInMilliseconds);
}

//SigHistoryCount(totalSigs, totArr, "totalJump");

//SigHistoryCount(eng, engArr, "totalJumpEng");
//SigHistoryCount(sco, scoArr, "totalJumpSco");
//SigHistoryCount(wal, walArr, "totalJumpWal");
//SigHistoryCount(ire, ireArr, "totalJumpIre");
//SigHistoryCount(ukOnly, ukArr, "totalJumpUk");
//SigHistoryCount(nonUK, noukArr, "totalJumpNonUk");

function showJumpCount(id, jumpSize) {
	say("ID is: " + id);
	switch (id) {
		case "totalJumpEng":
			// code block
			c = "engl";
			id = "eng";
			break;
		case "totalJumpSco":
			// code block
			c = "scot";
			id = "sco";
			break;
		case "totalJumpIre":
			// code block
			c = "irel";
			id = "ire";
			break;
		case "totalJumpWal":
			// code block
			c = "wale";
			id = "wal";
			break;
		case "totalJumpUk":
			// code block
			c = "uk";
			id = "uk";
			break;
		case "totalJumpNonUk":
			// code block
			c = "nouk";
			id = "nonuk";
			break;
		default:
		case "nouk":
			// code block
			c = "";
			id = "";
			break;
	}
	//var el = document.getElementById(id);
	//el.classList.add(y);

	var cl = document.querySelector("." + c);
	//say("CL: "+cl);
	//say("C: "+c);
	cl.dataset.content = "+" + jumpSize;
	setTimeout(() => {
		cl.setAttribute("data-content", "");
	}, 9000);
}

//thousands seperators
function noC(x) {
	var parts = x.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

///randomiser
function randomise(x, y) {
	return Math.floor(Math.random() * y) + x;
}

//  to return specific item
function findObjectByAttribute(items, attribute, value) {
	for (var i = 0; i < items.length; i++) {
		if (items[i][attribute] === value) {
			return items[i];
		}
	}
	return null;
}

//trigger download of data.csv file
$("#download-csv").click(function () {
	table.download("csv", "Petition_Data_By_Country - " + Date() + ".csv");
});

//trigger download of data.json file
$("#download-json").click(function () {
	table.download("json", "petition_data_by_country - " + Date() + ".json");
});

//trigger download of data.xlsx file
$("#download-xlsx").click(function () {
	table.download("xlsx", "petition_data_by_country - " + Date() + ".xlsx", {
		sheetName: "Petition Data",
	});
});

//trigger download of data.pdf file
$("#download-pdf").click(function () {
	table.download("pdf", "petition_data_by_country - " + Date() + ".pdf", {
		orientation: "portrait", //set page orientation to portrait
		title: "Petition Data - " + Date(), //add title to report
	});
});

table.setSort("signature_count", "desc");
