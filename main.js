const queryString = window.location.search;

const urlParams = new URLSearchParams(queryString);
const empresa = urlParams.get('EMPRESA')

if (empresa == null) {
	var urlPost = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=USER'
} else {
	var urlPost = 'http://server.palmapp.com.br:8082/rest/PALM/v1/AppMapa?USERID=000000&TOKEN=palm5k&OPER=USER' + "&EMPRESA=" + empresa
}



var markersArr = []
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

		// distance.addEventListener('input', function () {
		// 	clusterSource.setDistance(parseInt(distance.value, 10));
		// });

		map.on('pointermove', function (event) {
			overlay.setPosition(undefined)
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
					

				}

			});

		});

		
		map.on('click', function (event) {
			map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
				var atualZoom =map.getView().getZoom()
				var newZoom = atualZoom+2
				map.getView().setZoom(newZoom)
				console.log(event.coordinate)
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