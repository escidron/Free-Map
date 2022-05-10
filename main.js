const queryString = window.location.search;

const urlParams = new URLSearchParams(queryString);
const empresa = urlParams.get('EMPRESA')

if (empresa == null) {
	var urlPost = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=USER'
	var urlModal = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=MODAL'
	


} else {
	var urlPost = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=USER' + "&EMPRESA=" + empresa
	var urlModal = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=MODAL' + "&EMPRESA=" + empresa
	var inputEmpresa = document.getElementById('inputFiltroEmpresa');
	inputEmpresa.disabled = true;
}

function criaMapa(pontos) {
	
	if (document.getElementsByClassName('ol-viewport')[0] !=undefined){
		var divCard = document.getElementById("card")
		document.getElementsByClassName('ol-viewport')[0].remove()

		var divMap = document.getElementById("map")
		divMap.appendChild(divCard)
		
	}

	var markersArr = []
	var contX = 0.00001
	var contY = 0
	if (pontos!=undefined){
		for (x = 0; x < pontos.length; x++) {

			if (typeof pontos[x].hintAcesso == "string") {
	
				const [day, month, year] = pontos[x].hintAcesso.split("/");
				pontos[x].hintAcesso = `${month}/${day}/${year}`
	
			}
	
			if (markersArr.length != 0) {
	
				for (y = 0; y < markersArr.length; y++) {
	
					if (markersArr[y].Latitude == pontos[x].Latitude && markersArr[y].Longitude == pontos[x].Longitude) {
						//coloca solo un punto con varias descripciones
						/*markersArr[y].hint =  markersArr[y].hint +"\n"+"\n"+pontos[x].hint 
						*/
	
	
						//muda a coordenada
						if (contX >= 0.0001) {
	
							contY = contY + 0.00003
							contX = 0.00001
						}
	
						pontos[x].Latitude = pontos[x].Latitude + contY
						pontos[x].Longitude = pontos[x].Longitude + contX
						contX = contX + 0.00001
	
						break
					}
	
				}
	
				markersArr.push(pontos[x])
	
	
			} else {
	
				markersArr.push(pontos[x])
			}
	
		}
	}
	
	// var modal = document.getElementById("myModal");
	// var span = document.getElementsByClassName("close")[0];

	// span.onclick = function () {
	// 	closeModal();
	// }

	// // When the user clicks anywhere outside of the modal, close it
	// window.onclick = function (event) {
	// 	if (event.target == modal)
	// 		closeModal();
	// }

	// function closeModal() {
	// 	modal.style.display = "none";
	// }

	function createStyle(src, img) {
		return new ol.style.Style({
			image: new ol.style.Icon(({
				anchor: [0.5, 0.96],
				crossOrigin: 'anonymous',
				src: src,
				img: img,
				imgSize: img ? [img.width, img.height] : undefined
			}))
		});
	}

	var iconFeatures = [];

	setIconFeatures(markersArr);

	function setIconFeatures(pontos) {


		for (var x = 0; x < pontos.length; x++) {

			var iconFeature = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat([pontos[x].Longitude, pontos[x].Latitude])));
			iconFeature.setId(pontos[x].Id);
			var Icon = "./img/" + pontos[x].icone + ".PNG"
			iconFeature.set('style', createStyle(Icon, undefined));
			iconFeatures.push(iconFeature);
		}
	}

	//var distance = document.getElementById('distance');
	var source = new ol.source.Vector({
		features: iconFeatures
	});

	var unclusteredLayer = new ol.layer.Vector({
		source: source,
		style: function (feature) {
			return feature.get('style');
		},
		maxResolution: 1
	});

	var clusterSource = new ol.source.Cluster({
		distance: 100, //parseInt(distance.value, 10),
		source: source
	});

	var styleCache = {};

	var clusters = new ol.layer.Vector({
		source: clusterSource,
		style: function (feature) {
			var size = feature.get('features').length;
			var style = styleCache[size];
			if (!style) {
				style = new ol.style.Style({
					image: new ol.style.Circle({
						radius: 10,
						stroke: new ol.style.Stroke({
							color: '#fff'
						}),
						fill: new ol.style.Fill({
							color: '#3399CC'
						})
					}),
					text: new ol.style.Text({
						text: size.toString(),
						fill: new ol.style.Fill({
							color: '#fff'
						})
					})
				});
				styleCache[size] = style;
			}
			return style;
		},
		minResolution: 1
	});

	var raster = new ol.layer.Tile({
		source: new ol.source.OSM()
	});


	const container = document.getElementById('card');
	const overlay = new ol.Overlay({

		element: container,
		autoPan: {
			animation: {
				duration: 200,
			},
		},
	});

	var map = new ol.Map({
		target: 'map',
		layers: [raster, clusters, unclusteredLayer],
		overlays: [overlay],
		view: new ol.View({
			center: ol.proj.fromLonLat([-46.4692242, -23.6042038]),
			zoom: 5,
			minZoom: 2
		})
	});



	map.on('pointermove', function (event) {
		
		overlay.setPosition(undefined)
		map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
			
			var key = feature.getId();
			var prop = feature.getGeometry()

			
			if(key!= undefined){
				for (var x= 0;x<pontos.length;x++){
					if (pontos[x].Id==key) {
						
	
						overlay.setPosition(prop.flatCoordinates)
		
						document.getElementById("card").style.display = "block"
						document.getElementById("card").style.position = "absolute"
		
						document.getElementById("cardImg").src = pontos[x].picture
						document.getElementById("card-header").innerText = pontos[x].hintEmpresa;
						document.getElementById("cardText").innerText = "Usuario: " + pontos[x].hintUser + "\n" + "Utilizando: " + pontos[x].hintDesc + "\n" + "Data: " + pontos[x].hintAcesso + "\n" + "Hora: " + pontos[x].hintHora;
		
						
					}
				}
			}
			
		});

	});


	map.on('click', function (event) {
		map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
			var atualZoom = map.getView().getZoom()
			var newZoom = atualZoom + 2
			map.getView().setZoom(newZoom)
			map.getView().setCenter(event.coordinate);




		});
	});


	map.on('pointermove', function (evt) {
		map.getTargetElement().style.cursor =
			map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
	});

}

fetchMapa()
fetchModal()

function fetchMapa(empresa,usuario,dataIni,dataFin) {
	
	fetch(urlPost, {
			method: "POST"
		}).then(Response => {
			return Response.json()
		})
		.then(pontos => {

			console.log(document.getElementById('inputRefresh').value)
			
			// window.setInterval('fetchMapa()', 10000)
			var filterArr = []	
			//  var pontos = [{
			// 	"Id": 1,
			// 	"picture": "http://server.palmapp.com.br:8090/imagens/ADU-TST/000000.jpg",
			// 	"Latitude": -23.5881079,
			// 	"Longitude": -46.7582832,
			// 	"Descricao": "ADU-TST         (DIV - Diversos / Configuracao)",
			// 	"icone": "mCI",
			// 	"hintEmpresa": "ADU-TST        ",
			// 	"hintDesc": "Diversos",
			// 	"hintUser": "Admin (ADUFERTIL)             ",
			// 	"hintAcesso": "10/05/22",
			// 	"hintHora": "11:55:19"
			// },
			// {
			// 	"Id": 2,
			// 	"picture": "http://server.palmapp.com.br:8090/imagens/AMVAC/002707.jpg",
			// 	"Latitude": -21.261827,
			// 	"Longitude": -48.308761,
			// 	"Descricao": "AMVAC           (DIV - Diversos / Configuracao)",
			// 	"icone": "mCI",
			// 	"hintEmpresa": "AMVAC          ",
			// 	"hintDesc": "Diversos",
			// 	"hintUser": "WILSON AZEVEDO                ",
			// 	"hintAcesso": "09/05/22",
			// 	"hintHora": "07:07:51"
			// },
			// {
			// 	"Id": 3,
			// 	"picture": "http://server.palmapp.com.br:8090/imagens/AMVAC/000001.jpg",
			// 	"Latitude": -19.786967543034685,
			// 	"Longitude": -47.94434143768047,
			// 	"Descricao": "AMVAC           (DIV - Diversos / Configuracao)",
			// 	"icone": "mCI",
			// 	"hintEmpresa": "AMVAC          ",
			// 	"hintDesc": "Diversos",
			// 	"hintUser": "Marcelo Sousa                 ",
			// 	"hintAcesso": "09/05/22",
			// 	"hintHora": "14:13:41"
			// }]

			if (empresa!= "" && empresa!= undefined   ||  usuario!= ""  && usuario!= undefined  ||  dataIni!= undefined && dataIni!= ""){
				//so empresa
				if (empresa.length !=0 && usuario.length == 0 && dataIni.length == 0){
					
					for (x=0;x<pontos.length;x++){
						
						if (pontos[x].hintEmpresa.toLowerCase().indexOf(empresa.toLowerCase()) >= 0){
							filterArr.push(pontos[x])
						}
						
					}
				}
				//so usuario
				else if(empresa.length ==0 && usuario.length != 0 && dataIni.length == 0){
					for (x=0;x<pontos.length;x++){
						
						if (pontos[x].hintUser.toLowerCase().indexOf(usuario.toLowerCase()) >= 0){
							filterArr.push(pontos[x])
						}
						
					}
				}
				//so so data inicial
				else if(empresa.length ==0 && usuario.length == 0 && dataIni.length != 0){

					if (typeof  dataIni== "string") {
						
						var [year, month, day] = dataIni.split("-");
						dataIni = `${year}/${month}/${day}`
						
					}
					if (typeof  dataFin== "string") {
						
						var [year, month, day] = dataFin.split("-");
						dataFin = `${year}/${month}/${day}`
						
					}
					
					dataIni = new Date(dataIni);
					dataFin = new Date(dataFin);
					
					const d = new Date()
					for (x=0;x<pontos.length;x++){
						
						if (typeof pontos[x].hintAcesso == "string") {
							
							var [day, month, year] = pontos[x].hintAcesso.split("/");
							if(parseInt(month, 10)!=d.getMonth()+1){
								pontos[x].hintAcesso = `20${year}/${day}/${month}`
							}
							else{
								pontos[x].hintAcesso = `20${year}/${month}/${day}`
							}
							
				
						}
						dateJson = new Date(pontos[x].hintAcesso)
						

						if (dataIni<=dateJson && dateJson<=dataFin){
							filterArr.push(pontos[x])
							
						}
						
						
					}	
				}
				//so empresa e usuario
				else if(empresa.length !=0 && usuario.length != 0 && dataIni.length == 0){
					for (x=0;x<pontos.length;x++){
						
						if (pontos[x].hintEmpresa.toLowerCase().indexOf(empresa.toLowerCase()) >= 0 && pontos[x].hintUser.toLowerCase().indexOf(usuario.toLowerCase()) >= 0){
							filterArr.push(pontos[x])
						}
						
					}
				}
				//so empresa e dataini
				else if(empresa.length !=0 && usuario.length == 0 && dataIni.length != 0){

					if (typeof  dataIni== "string") {
						
						var [year, month, day] = dataIni.split("-");
						dataIni = `${year}/${month}/${day}`
						
					}
					if (typeof  dataFin== "string") {
						
						var [year, month, day] = dataFin.split("-");
						dataFin = `${year}/${month}/${day}`
						
					}
					
					dataIni = new Date(dataIni);
					dataFin = new Date(dataFin);
					
					const d = new Date()
					for (x=0;x<pontos.length;x++){
						
						if (typeof pontos[x].hintAcesso == "string") {
							
							var [day, month, year] = pontos[x].hintAcesso.split("/");
							if(parseInt(month, 10)!=d.getMonth()+1){
								pontos[x].hintAcesso = `20${year}/${day}/${month}`
							}
							else{
								pontos[x].hintAcesso = `20${year}/${month}/${day}`
							}
							
				
						}
						dateJson = new Date(pontos[x].hintAcesso)
						

						if (dataIni<=dateJson && dateJson<=dataFin && pontos[x].hintEmpresa.toLowerCase().indexOf(empresa.toLowerCase()) >= 0){
							filterArr.push(pontos[x])
							
						}
						
						
					}	
				}
				//so usuario e dataini
				else if(empresa.length ==0 && usuario.length != 0 && dataIni.length != 0){

					if (typeof  dataIni== "string") {
						
						var [year, month, day] = dataIni.split("-");
						dataIni = `${year}/${month}/${day}`
						
					}
					if (typeof  dataFin== "string") {
						
						var [year, month, day] = dataFin.split("-");
						dataFin = `${year}/${month}/${day}`
						
					}
					
					dataIni = new Date(dataIni);
					dataFin = new Date(dataFin);
					
					const d = new Date()
					for (x=0;x<pontos.length;x++){
						
						if (typeof pontos[x].hintAcesso == "string") {
							
							var [day, month, year] = pontos[x].hintAcesso.split("/");
							if(parseInt(month, 10)!=d.getMonth()+1){
								pontos[x].hintAcesso = `20${year}/${day}/${month}`
							}
							else{
								pontos[x].hintAcesso = `20${year}/${month}/${day}`
							}
							
				
						}
						dateJson = new Date(pontos[x].hintAcesso)
						

						if (dataIni<=dateJson && dateJson<=dataFin  && pontos[x].hintUser.toLowerCase().indexOf(usuario.toLowerCase()) >= 0){
							filterArr.push(pontos[x])
							
						}
						
						
					}	
				}
				//todos os parametros do filtro
				else if(empresa.length !=0 && usuario.length != 0 && dataIni.length != 0){

					if (typeof  dataIni== "string") {
						
						var [year, month, day] = dataIni.split("-");
						dataIni = `${year}/${month}/${day}`
						
					}
					if (typeof  dataFin== "string") {
						
						var [year, month, day] = dataFin.split("-");
						dataFin = `${year}/${month}/${day}`
						
					}
					
					dataIni = new Date(dataIni);
					dataFin = new Date(dataFin);
					
					const d = new Date()
					for (x=0;x<pontos.length;x++){
						
						if (typeof pontos[x].hintAcesso == "string") {
							
							var [day, month, year] = pontos[x].hintAcesso.split("/");
							if(parseInt(month, 10)!=d.getMonth()+1){
								pontos[x].hintAcesso = `20${year}/${day}/${month}`
							}
							else{
								pontos[x].hintAcesso = `20${year}/${month}/${day}`
							}
							
				
						}
						dateJson = new Date(pontos[x].hintAcesso)
						

						if (dataIni<=dateJson && dateJson<=dataFin  && pontos[x].hintUser==usuario && pontos[x].hintEmpresa==empresa){
							filterArr.push(pontos[x])
							
						}
						
						
					}	
				}	
			}
			else{
				var filterArr = pontos
			}
			
			
			
			
			criaMapa(filterArr)

		}).catch(err => {
			// if any error occured, then catch it here
			console.error(err);
		})

}



////MODALS
function criaChartPie(modals) {
	
	const data = {
		labels: ['Coleta de Dados', 'Reembolso', 'Força de Vendas', 'Aprovacao/Compras', 'Diversos/Config.'],
		datasets: [{
			label: 'Dataset 2',
			backgroundColor: ["rgba(252, 4, 4, 0.9)", "rgb(46, 46, 245)", "rgba(240, 240, 42, 0.904)", "rgba(48, 48, 48, 0.8)", "rgb(144, 238, 144)"],
			//   data: [10, 10, 5, 20, 6],
			data: [modals[0].Ativos, modals[1].Ativos, modals[2].Ativos, modals[3].Ativos, modals[4].Ativos],
		}]
	};

	const config = {
		type: 'doughnut',
		data: data,
		options: {
			cutout: "40%",
			radius: "80%",
			responsive: true,
			maintainAspectRatio: false,

			plugins: {
				legend: {
					position: 'right',
					labels: {
						boxWidth: "10",
						usePointStyle: true,
						pointStyle: "circle"
					},
				},
				title: {
					display: true,
					text: 'Logins por modalidade'
				}
			}
		}
	}

	const myChart1 = new Chart(
		document.getElementById('myChart1'),
		config
	);



}

function criaChartBar(modals) {

	const data = {
		labels: ['Colet...', 'Reem...', 'Forç...', 'Aprov...', 'Dive...'],
		datasets: [{
			label: "",
			backgroundColor: ["rgba(252, 4, 4, 0.9)", "rgb(46, 46, 245)", "rgba(240, 240, 42, 0.904)", "rgba(48, 48, 48, 0.8)", "rgb(144, 238, 144)"],
			// data: [2, 10, 5, 20, 6],
			data: [modals[0].Usuarios, modals[1].Usuarios, modals[2].Usuarios, modals[3].Usuarios, modals[4].Usuarios]
		}]
	};

	const config = {
		type: 'bar',
		data: data,
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false
				},
				title: {
					display: true,
					text: 'Usuarios Cadastrados'
				}
			}
		}
	}

	const myChart2 = new Chart(
		document.getElementById('myChart2'),
		config
	);



}




function fetchModal() {
	fetch(urlModal, {
			method: "POST"
		}).then(Response => {
			return Response.json()
		})
		.then(modals => {

			criaChartPie(modals)
			criaChartBar(modals)
		}).catch(err => {
			// if any error occured, then catch it here
			console.error(err);
		})
}


function aplicaFiltro(modals) {

	let filtroEmpresa = document.getElementById('inputFiltroEmpresa').value
	let filtroUsuario = document.getElementById('inputFiltroUser').value
	let filtroDataIni = document.getElementById('inputFiltroDataIni').value
	let filtroDataFin = document.getElementById('inputFiltroDataFin').value
	
	 fetchMapa(filtroEmpresa,filtroUsuario,filtroDataIni,filtroDataFin)
}

function limpaFiltro() {
	document.getElementById('inputFiltroEmpresa').value=""
	document.getElementById('inputFiltroUser').value=""
	document.getElementById('inputFiltroDataIni').value=""
	$('#inputFiltroDataFin').val(new Date().toJSON().slice(0,10))
	fetchMapa()
}


//refresh
// window.setInterval('fetchMapa()', 100000);
// function setRefresh(){
// 	var timeRefresh = document.getElementById("inputRefresh").value
// 	window.setInterval('fetchMapa()', 1000*timeRefresh);
// 	console.log(1000*timeRefresh)
// }


var timer = 0
function setRefresh(){
	fetchMapa()
	var timeRefresh = document.getElementById("inputRefresh").value
	if(timer!=0){
		clearInterval(timer)
		timer = 0

	}
	
	timer = setInterval(function(){
		fetchMapa()
	}, 1000*parseInt(timeRefresh));
	
}	
		
