# Layer Manager

A library to add, remove layer in Leaflet and Google maps. Furthermore it provides methods to set opacity, visibility, interaction and more.

## Install

Using npm:

`npm install layer-manager`

or using git:
 
`npm install vizzuality/layer-manager`

## How to use

```js
// Import LayersManager and the corresponding Plugin depending on the 
// map provider that you are using
import LayerManager, { PluginLeaflet } from 'layer-manager';

const map = L.map('map_canvas').setView([40, -3], 5);

const layerManager = new LayerManager(map, PluginLeaflet, {});

// Adding all layers to map
layerManager.add(layerSpec, {
	opacity: 0.5,
	visibility: true,
	zIndex: 2,
	interactivity: { click: (layerSpec, data) => {} }
});

// remove all layers
layerManager.remove();

// removing specific layers
layerManager.remove(['layerID']); 

// Setting opacity to specific layer
layerManager.setOpacity('layerID', 0.5);

// Subscribing to interactivity (Draft)
layerManager.setInteractivity('layerID', {
	click: (layerSpec, data) => {}
});

// Disabling events
layerManager.setInteractivity('layerId', null);

```

`layerSpec` is the response of `http://api.resourcewatch.org/v1/layer?application=rw`.

Support for promises:

```js

spinner.start();
	
layerManager.add()
	.then((layer) => {
		spinner.stop();
		console.log('layer added');
	});

```

### Adding a custom provider

TODO


### Available options

| Attribute name | Values              | Default |
| -------------- |:-------------------:| -------:|
| mapLibrary     | Leaflet, GoogleMaps | Leaflet |


### Layer options

| Attribute name | Default |
| -------------- | -------:|
| opacity        | 1       |
| visibility     | true    |
| zIndex         | +1      |
| interactivity  | null    |


### Available methods

| Method name      | Description                               | Example    |
| ---------------- | :----------------------------------------:| ---------: |
| setOpacity       | To set opacity. A value beetween 0 and 1. | 0.5        |
| setVisibility    | It shows or hidden a layer. Boolean.      | true       |
| setZIndex        | It sets the layer position. Number        | 1          |
| setInteractivity | It sets the layer position. Number        | 1          |
| goToBounds       | It sets the layer position. Number        | 1          |
