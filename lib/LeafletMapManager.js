/*
* @Author: Dawn, dawn.chli@gmail.com
* @Date:   2017-05-11 18:43:33
* @Last Modified by:   Dawn
* @Last Modified time: 2017-05-12 17:28:06
*/
'use strict';

function LeafletMapManager(){

	var datasetPointsSet = undefined;
	var heatLayer = undefined;
	var pointLayer = undefined;

    var polylineArr = [];
    var polylineMarkerDirArr = [];
    var polylineMarkerArr = [];
    var polylineLabelArr = {};

    var isLabelShown = false;

	this.EnumShowMode = {};
	this.leafletMap = undefined;
	this.pathLayer = undefined;

	this.sbMgr = undefined;

    this.selectedInfo = undefined;

	var gThis = undefined;

	this.init = function ( divName, pos, level ) {

		gThis = this;

		this.EnumShowMode.Point = 0;
		this.EnumShowMode.Heatmap = 1;
		this.EnumShowMode.Hybrid = 2;
        
        this.leafletMap = L.map(divName, {
            center: pos,
            zoom: level,
            zoomControl: false,         //hiden two control button
            //dragging: false,
            scrollWheelZoom:false,
            doubleClickZoom:false,
            attributionControl: false   //hiden leaflet logo
        });

		L.tileLayer('https://a.tiles.mapbox.com/v4/examples.ra3sdcxr/{z}/{x}/{y}@2x.png?access_token=' + 'pk.eyJ1Ijoid2lsZGhvbmV5IiwiYSI6Imt3RkVmTTAifQ.oMrTcDjz8GEhZUhYME7pHw', {
                maxZoom: 18,
                minZoom: 1
            }).addTo(this.leafletMap);
	}

    this.removeLabels = function()
    {
        d3.select("#flow_contenter").selectAll("*").remove();
        polylineMarkerDirArr = [];
        polylineLabelArr = {};
        isLabelShown = false;
    }

    // Called in index.html
    this.ShowLabelOrNot = function()
    {
        var labelCnt = CommonFuncUtility.GetHashmapLength( polylineLabelArr );
        
        if ( !isLabelShown && labelCnt > 0 && labelCnt == polylineArr.length )
        {
            this.showPolyLabels();
            isLabelShown = true;
            return true;
        }
        else
        {
            return false;
        }
    }

    this.showPolyLabels = function()
    {
        //CommonDefine.colorTheme[i]
        for (var i = 0; i < polylineArr.length; i++) {
            var labelId = i + 1;
            var labelStr = labelId.toString() + ". " + polylineLabelArr[ i.toString() ];
            polylineMarkerArr[i].bindLabel(labelStr, { noHide: true, direction: polylineMarkerDirArr[i] }).showLabel();
        };
    }

    function catchLocation(latitude,longitude,id){
        var request = new XMLHttpRequest();

        var method = 'GET';
        var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&sensor=true&language=en';
        var async = true;

        request.open(method, url, async);
        request.onreadystatechange = function(){
          if(request.readyState == 4 && request.status == 200){
            var data = JSON.parse(request.responseText);
            //var address = data.results[0];
            //console.log( address.formatted_address );

            var arrAddress = data.results[0].address_components;
            for (var i = 0; i < arrAddress.length; i++) {
                if ( arrAddress[i].types[0] == "administrative_area_level_1" )
                {
                    polylineLabelArr[ id.toString() ] = arrAddress[i].long_name;
                }
            }
          }
        };
        request.send();
    };

	this.getHeatGrayData = function()
	{
		if ( heatLayer != undefined )
		{
			return heatLayer.getHeat().getGrayData();
		}
		else
		{
			return undefined;
		}
	}

    this.getHeatGradient = function()
    {
        if ( heatLayer != undefined )
        {
            return heatLayer.getHeat().getGradient();
        }
        else
        {
            return undefined;
        }
    }

	this.getHeatColData = function()
	{
		if ( heatLayer != undefined )
		{
			return heatLayer.getHeat().getColCtx();
		}
		else
		{
			return undefined;
		}
	}

	this.addDataWithClean = function (data)
	{
        var colorGradient = undefined;
        if ( CommonDefine.dbName == "AirQuality" )
        {
            colorGradient = CommonDefine.colorGradientAQIUSA;
        }
        else
        {
            colorGradient = CommonDefine.colorGradientNormal;
        }

		// Heatmap Layer 
		if ( heatLayer == undefined )
		{
    		heatLayer = L.heatLayer(data 
            ,{
                //maxZoom: 18,
                //blur: 15,
                radius: CommonDefine.radiusSize,
                opacity: 0.4,
                //max: 2.0,
                gradient: colorGradient
            }
            ).addTo( this.leafletMap );
		}
		else
		{
            this.leafletMap.removeLayer( heatLayer );
            heatLayer = L.heatLayer(data 
            ,{
                //maxZoom: 18,
                //blur: 15,
                radius: CommonDefine.radiusSize,
                opacity: 0.4,
                //max: 2.0,
                gradient: colorGradient
            }
            ).addTo( this.leafletMap );
		}
		console.log( "Heatmap generated!" );

		// Point Layer
        if ( pointLayer != undefined )
        {
            pointLayer.myRemove();
            pointLayer = undefined;
        };

        var usedBufferCnt = data.length;
        var featureArray = new Array(usedBufferCnt);
        datasetPointsSet = {features:featureArray, type:"FeatureCollection"};

        for (var i = 0; i < featureArray.length; i++) {
            var pos = new Array(2);
            pos[0] = data[i][1];
            pos[1] = data[i][0];
            var coordItem = {coordinates:pos, type:"Point"};
            var geometryItem = {geometry:coordItem, id:null, properties:null, type:"Feature"};
            datasetPointsSet['features'][i] = geometryItem;
        };

        // 
        var tmpRadius = 1.6;
        if ( CommonDefine.dbName == "AirQuality" )
            tmpRadius = 2.0;
        pointLayer = L.pointsLayer(datasetPointsSet, {
            radius: tmpRadius,
            applyStyle: circle_style
        });

        this.leafletMap.addLayer(pointLayer);

        console.log( "Points generated!" );

        function circle_style(circles) {
            circles.attr('opacity', 0.5)    // Point Alpha
            //.attr("stroke", "white" )
            //.attr("stroke-width", 2)
            .attr('fill', 'rgb(240, 15, 55)');
    	}
	}

	this.showData = function(showMode)
	{
		if ( showMode == this.EnumShowMode.Heatmap )
		{
            console.log( "Show heatmap..." );
			if ( heatLayer != undefined )
			{
				heatLayer.show();
				pointLayer.hide();
			};
		}
		else if ( showMode == this.EnumShowMode.Point )
		{
            console.log( "Show point..." );
			if ( pointLayer != undefined )
			{
				heatLayer.hide();
				pointLayer.show();
			};
		}
		else if ( showMode == this.EnumShowMode.Hybrid )
		{
			if ( pointLayer != undefined )
				pointLayer.show();
			if ( heatLayer != undefined )
				heatLayer.show();
		}
	}

    this.getHeatMapCtx = function(){

    }
}