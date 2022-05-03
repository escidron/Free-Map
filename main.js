window.onload = init;

function init(){

    var map = new ol.Map({
        target: 'map',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          center:[-5707785.824022034,-1099594.0951053547],
          zoom: 4
        })
      });
    
      
      const features = [new ol.Feature({
        geometry: new ol.geom.Point([-5802699.234058017,-1218015.8399626557])
    }),new ol.Feature({
        geometry: new ol.geom.Point([-6459594.478460809,-132710.65355804004])
    })];
    //   for (i = 0; i < 300; i++) {
    //     features.push(new ol.Feature({
    //       geometry: new ol.geom.Point(ol.proj.fromLonLat([
    //         -getRandomNumber(50, 50), getRandomNumber(10, 50)
    //       ]))
    //     }));
    //   }
      // create the source and layer for random features
      const vectorSource = new ol.source.Vector({
        features
      });
      const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 2,
            fill: new ol.style.Fill({color: 'red'})
          })
        })
      });
      map.addLayer(vectorLayer);

    //   map.on('click',function(e){
    //       console.log(e.coordinate)
    //   })
}