const queryString = window.location.search;

const urlParams = new URLSearchParams(queryString);
const empresa = urlParams.get('EMPRESA')

if (empresa == null) {
	var urlPost = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=USER'
} else {
	var urlPost = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=USER' + "&EMPRESA=" + empresa
}


fetch(urlPost, {
		method: "POST"
	}).then(Response => {
		return Response.json()
	})
	.then(pontos => {
		var markersArr = []
		var contX = 0.00001
		var contY = 0
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
						console.log(pontos[x].hint)
						console.log(markersArr[y].hint)*/


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
			//overlay.setPosition(undefined)
			map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
				var key = feature.getId();
				var prop = feature.getGeometry()


				if (pontos[key] != undefined) {


					overlay.setPosition(prop.flatCoordinates)

					document.getElementById("card").style.display = "block"
					document.getElementById("card").style.position = "absolute"

					document.getElementById("cardImg").src = pontos[key].picture
					document.getElementById("card-header").innerText = pontos[key].hintEmpresa;
					document.getElementById("cardText").innerText = "Usuario: " + pontos[key].hintUser + "\n" + "Utilizando: " + pontos[key].hintDesc + "\n" + "Data: " + pontos[key].hintAcesso + "\n" + "Hora: " + pontos[key].hintHora;

					// $.get(pontos[key].picture)
					// 	.done(function() { 
					// 		console.log("ok")
					// 		// Do something now you know the image exists.

					// 	}).fail(function() { 
					// 		// Image doesn't exist - do something else.
					// 		console.log("reee")
					// 	})
					// fetch(pontos[key].picture, {
					// 		method: 'GET'
					// 	})
					// 	.then(res => {
					// 		if (res.ok) {
					// 			document.getElementById("cardImg").src = pontos[key].picture
					// 			console.log('Image exists.');
					// 		} else {
					// 			console.log('Image does not exist.');
					// 		}
					// 	}).catch(err => console.log('Error:', err));
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



	}).catch(err => {
		// if any error occured, then catch it here
		console.error(err);
	})



////MODALS
function criaChartPie(){

	  const data = {
		labels: ['Coleta de Dados','Reembolso','Força de Vendas','Aprovacao/Compras','Diversos/Config.'],
		datasets: [{
		  label: 'Dataset 2',
		  backgroundColor: ["red","blue","yellow","gray","green"],
		  data: [2, 10, 5, 20, 6],
		}]
	  };
	
	  const config = {
		type: 'doughnut',
		data: data,
		options: {
			cutout:"40%",
			radius:"80%",
			
			
			plugins: {
			  legend: {
				position: 'right',
				labels:{
					boxWidth:"10",
					usePointStyle:true,
					pointStyle:"circle"					
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
function criaChartBar(){
	const labels = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
	  ];
	
	  const data = {
		labels: labels,
		datasets: [{
		  label: 'My First dataset',
		  backgroundColor: 'rgb(255, 99, 132)',
		  borderColor: 'rgb(255, 99, 132)',
		  data: [0, 10, 5, 2, 20, 30, 45],
		}]
	  };
	
	  const config = {
		type: 'bar',
		data: data,
		options: {}
	  };
	
	  const myChart2 = new Chart(
		document.getElementById('myChart2'),
		config
	  );
	
	  
	
}

function criaChartLine(){
	const labels = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
	  ];
	
	  const data = {
		labels: labels,
		datasets: [{
		  label: 'My First dataset',
		  backgroundColor: 'rgb(255, 99, 132)',
		  borderColor: 'rgb(255, 99, 132)',
		  data: [0, 10, 5, 2, 20, 30, 45],
		}]
	  };
	
	  const config = {
		type: 'line',
		data: data,
		options: {}
	  };
	
	  const myChart3 = new Chart(
		document.getElementById('myChart3'),
		config
	  );
	
	  
	
}



 criaChartPie()
// criaChartBar()

//document.getElementById('myChart1').style.backgroundColor="black"
